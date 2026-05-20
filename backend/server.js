const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const {
  upsertFarmer,
  getFarmer,
  listFarmers,
  upsertListing,
  getListings,
  createOrder,
  getOrders,
  recordAttestation,
} = require("./src/db");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ====== HEALTH ======
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "agri-con-backend", uptime: process.uptime() });
});

// ====== FARMER PROFILES ======
app.get("/api/profile", async (req, res) => {
  try {
    const { address } = req.query;
    if (address) {
      const farmer = await getFarmer(address);
      return res.json({ ok: true, profile: farmer });
    }
    const farmers = await listFarmers();
    return res.json({ ok: true, profiles: farmers });
  } catch (err) {
    console.error("GET /api/profile:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/profile", async (req, res) => {
  try {
    const { address, fullName, farmName, region, totalYieldKg, idDocPath, verified } = req.body;
    if (!address || !fullName) return res.status(400).json({ ok: false, error: "address and fullName required" });
    const profile = await upsertFarmer({ id: address, fullName, farmName, region, totalYieldKg: totalYieldKg || 0, idDocPath, verified });
    return res.json({ ok: true, profile });
  } catch (err) {
    console.error("POST /api/profile:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ====== LISTINGS ======
app.get("/api/listings", async (req, res) => {
  try {
    const { buyable, region, farmerId, search } = req.query;
    const filters = {};
    if (buyable !== undefined) filters.buyable = buyable === "true";
    if (region) filters.region = region;
    if (farmerId) filters.farmerId = farmerId;
    if (search) filters.search = search;
    const listings = await getListings(filters);
    return res.json({ ok: true, listings });
  } catch (err) {
    console.error("GET /api/listings:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/listings", async (req, res) => {
  try {
    const { nftId, cropType, quantityKg, priceUsdc, farmerId, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, status } = req.body;
    if (!nftId || !farmerId) return res.status(400).json({ ok: false, error: "nftId and farmerId required" });
    const listing = await upsertListing({ nftId, cropType, quantityKg, priceUsdc, farmerId, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, status });
    return res.json({ ok: true, listing });
  } catch (err) {
    console.error("POST /api/listings:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ====== ORDERS ======
app.get("/api/orders", async (req, res) => {
  try {
    const { buyerAddress, farmerAddress, status } = req.query;
    const orders = await getOrders({ buyerAddress, farmerAddress, status });
    return res.json({ ok: true, orders });
  } catch (err) {
    console.error("GET /api/orders:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { listingId, buyerAddress, amountUsdc, txHash, status } = req.body;
    if (!listingId || !buyerAddress) return res.status(400).json({ ok: false, error: "listingId and buyerAddress required" });
    const order = await createOrder({ listingId, buyerAddress, amountUsdc, txHash, status });
    return res.json({ ok: true, order });
  } catch (err) {
    console.error("POST /api/orders:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ====== ATTESTATION ======
app.post("/api/attestations", async (req, res) => {
  try {
    const { nftId, observedAt, ndviBps, minNdviBps, buyable, bboxHash, reportHash, source } = req.body;
    if (!nftId) return res.status(400).json({ ok: false, error: "nftId required" });
    const attestation = await recordAttestation({ nftId, observedAt, ndviBps, minNdviBps, buyable, bboxHash, reportHash, source });
    return res.json({ ok: true, attestation });
  } catch (err) {
    console.error("POST /api/attestations:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ====== GEMINI AI ======
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
    const prompt = `You are an agricultural analyst. Given NDVI ${(ndviBps / 100).toFixed(2)}% for ${cropType || "crops"} in ${region || "a region"}, explain what this means in 2-3 sentences and give a harvest recommendation. Respond in JSON: {"summary":"...","recommendation":"...","healthLabel":"Healthy|Moderate|Needs Attention"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return res.json({ ok: true, ...JSON.parse(cleaned), ndviBps });
    } catch {
      return res.json({
        ok: true,
        summary: `NDVI at ${(ndviBps / 100).toFixed(2)}% indicates ${vegHealth} vegetation.`,
        recommendation: ndviBps > 5000 ? "Good conditions for harvest." : "Monitor conditions.",
        healthLabel: ndviBps > 5000 ? "Healthy" : "Needs Attention",
        ndviBps,
      });
    }
  } catch (err) {
    console.error("NDVI AI error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== GCS UPLOAD URL ======
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

const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => console.log(`Agri-Block backend running on ${HOST}:${PORT}`));