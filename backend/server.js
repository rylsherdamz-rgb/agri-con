const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "agri-con-backend", uptime: process.uptime() });
});

// NDVI Summary via Gemini AI
app.post("/ai/ndvi-summary", async (req, res) => {
  try {
    const { ndviBps, cropType, region } = req.body;
    if (ndviBps === undefined) return res.status(400).json({ error: "ndviBps required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const vegHealth = ndviBps > 6000 ? "dense" : ndviBps > 4000 ? "moderate" : "sparse";
    const prompt = `You are an agricultural analyst. Given NDVI ${(ndviBps / 100).toFixed(2)}% for ${cropType || "crops"} in ${region || "a region"}, explain what this means (2-3 sentences) and give a harvest recommendation. Respond in JSON: {"summary":"...","recommendation":"...","healthLabel":"Healthy|Moderate|Needs Attention"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return res.json({ ok: true, ...JSON.parse(cleaned) });
    } catch {
      return res.json({
        ok: true,
        summary: `NDVI at ${(ndviBps / 100).toFixed(2)}% indicates ${vegHealth} vegetation.`,
        recommendation: ndviBps > 5000 ? "Good conditions for harvest." : "Monitor conditions.",
        healthLabel: ndviBps > 5000 ? "Healthy" : "Needs Attention",
      });
    }
  } catch (err) {
    console.error("NDVI AI error:", err);
    res.status(500).json({ error: err.message });
  }
});

// AI Chat
app.post("/ai/chat", async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages?.length) return res.status(400).json({ error: "messages required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are AgriAI, an agricultural assistant. Answer in 2-4 sentences.${context ? ` Context: ${context}` : ""}`;
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ systemInstruction: { role: "user", parts: [{ text: systemPrompt }] }, history });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return res.json({ ok: true, reply: result.response.text() });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Farmer ID upload URL (Google Cloud Storage)
app.post("/farmer-id/upload-url", async (req, res) => {
  try {
    const { farmerAddress, fileName, contentType } = req.body;
    if (!farmerAddress || !fileName) return res.status(400).json({ error: "farmerAddress and fileName required" });

    const bucketName = process.env.GCP_FARMER_ID_BUCKET;
    if (!bucketName) return res.status(500).json({ error: "GCP_FARMER_ID_BUCKET not configured" });

    const { Storage } = require("@google-cloud/storage");
    const storage = new Storage(
      process.env.GCP_SERVICE_ACCOUNT_JSON
        ? { credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON) }
        : undefined,
    );

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `farmer-ids/${farmerAddress}/${Date.now()}-${safeFileName}`;
    const bucket = storage.bucket(bucketName);

    const [url] = await bucket.file(objectPath).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: contentType || "application/octet-stream",
    });

    return res.json({ ok: true, bucket: bucketName, objectPath, uploadUrl: url, expiresInSeconds: 900 });
  } catch (err) {
    console.error("Upload URL error:", err);
    res.status(500).json({ error: err.message });
  }
});

// OpenEO NDVI Verification
app.post("/verification/run", async (req, res) => {
  try {
    const { nftId, bbox, sampleGridSize = 20, temporalExtent, minNdviBps = 3500 } = req.body;
    if (!nftId || !bbox) return res.status(400).json({ error: "nftId and bbox required" });

    const openEOBase = process.env.OPENEO_SH_BASE_URL || "https://openeosh.dataspace.copernicus.eu";
    const clientId = process.env.OPENEO_CLIENT_ID;
    const clientSecret = process.env.OPENEO_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(500).json({ error: "OpenEO credentials not configured" });

    // OIDC auth
    const wellKnown = await fetch(`${openEOBase}/.well-known/openeo`).then((r) => r.json());
    const tokenRes = await fetch(
      `${wellKnown.provider_backends?.[0]?.url || "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
      },
    );
    const { access_token: token } = await tokenRes.json();
    if (!token) return res.status(500).json({ error: "Failed to authenticate with openEO" });

    const start = temporalExtent?.start || "2026-04-01";
    const end = temporalExtent?.end || "2026-05-31";

    // NDVI process graph
    const process = {
      process_graph: {
        load: {
          process_id: "load_collection",
          arguments: {
            id: "SENTINEL2_L2A",
            spatial_extent: { west: bbox.west, south: bbox.south, east: bbox.east, north: bbox.north },
            temporal_extent: [start, end],
            bands: ["B04", "B08"],
          },
        },
        ndvi: {
          process_id: "ndvi",
          arguments: { data: { from_node: "load" }, nir: "B08", red: "B04" },
        },
        reduce: {
          process_id: "reduce_dimension",
          arguments: { data: { from_node: "ndvi" }, reducer: { process_graph: { mean: { process_id: "mean", arguments: { data: { from_parameter: "data" } } } } }, dimension: "t" },
        },
        save: {
          process_id: "save_result",
          arguments: { data: { from_node: "reduce" }, format: "GTiff" },
          result: true,
        },
      },
    };

    const resultRes = await fetch(`${openEOBase}/result`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(process),
    });

    if (!resultRes.ok) {
      return res.status(502).json({ error: `openEO result failed: ${resultRes.status}` });
    }

    const buffer = Buffer.from(await resultRes.arrayBuffer());
    const sharp = require("sharp");
    const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
    const pixels = new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < pixels.length; i++) {
      if (!isNaN(pixels[i]) && pixels[i] > -1 && pixels[i] < 1) {
        sum += pixels[i];
        count++;
      }
    }
    const ndviMean = count > 0 ? sum / count : 0;
    const ndviBpsMeasured = Math.round(ndviMean * 10000);
    const buyable = ndviBpsMeasured >= (minNdviBps || 3500);

    const crypto = require("crypto");
    const bboxHash = crypto.createHash("sha256").update(`${bbox.west},${bbox.south},${bbox.east},${bbox.north}`).digest("hex");
    const reportHash = crypto.createHash("sha256").update(`${nftId}-${ndviBpsMeasured}-${buyable}-${Date.now()}`).digest("hex");

    return res.json({
      ok: true,
      nftId,
      ndviMean,
      ndviBps: ndviBpsMeasured,
      buyable,
      attestation: {
        observed_at: Math.floor(Date.now() / 1000),
        ndvi_bps: ndviBpsMeasured,
        min_ndvi_bps: minNdviBps,
        buyable,
        bbox_hash: bboxHash,
        report_hash: reportHash,
        source: "copernicus-sentinel2",
      },
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Agri-Block backend running on port ${PORT}`);
});