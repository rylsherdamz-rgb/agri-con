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
  createReview,
  getReviews,
  getAverageRating,
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
    const { nftId, cropType, quantityKg, priceUsdc, farmerId, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, totalYieldKg, status } = req.body;
    if (!nftId || !farmerId) return res.status(400).json({ ok: false, error: "nftId and farmerId required" });
    const listing = await upsertListing({ nftId, cropType, quantityKg, priceUsdc, farmerId, parcelName, region, buyable, ndviBps, minNdviBps, areaHa, totalYieldKg, status });
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

// ====== NVIDIA AI (NDVI Summary) ======
const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

app.post("/ai/ndvi-summary", async (req, res) => {
  try {
    const { ndviBps, cropType, region } = req.body;
    if (ndviBps === undefined) return res.status(400).json({ error: "ndviBps required" });

    const apiKey = process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "NVIDIA_API_KEY not configured" });
    const model = process.env.AI_MODEL || "meta/llama-3.3-70b-instruct";

    const ndviPercent = (ndviBps / 100).toFixed(2) + "%";
    const vegHealth = ndviBps > 6000 ? "dense" : ndviBps > 4000 ? "moderate" : "sparse";

    const prompt = `You are an agricultural analyst. Given NDVI ${ndviPercent} for ${cropType || "crops"} in ${region || "a region"}, explain what this means in 2-3 sentences and give a harvest recommendation. Respond ONLY with valid JSON — no markdown, no code fences, no extra text: {"summary":"...","recommendation":"...","healthLabel":"Healthy|Moderate|Needs Attention"}`;

    const nvRes = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You return ONLY valid JSON. No markdown, no backticks." },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    const json = await nvRes.json();
    if (!nvRes.ok || json.error) {
      const msg = json.error?.message || `NVIDIA API returned ${nvRes.status}`;
      return res.status(502).json({ error: msg });
    }

    const raw = (json.choices?.[0]?.message?.content || "").trim();
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return res.json({ ok: true, ...JSON.parse(cleaned), ndviBps });
    } catch {
      return res.status(502).json({ error: "NVIDIA API returned invalid JSON", raw });
    }
  } catch (err) {
    console.error("NDVI AI error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ====== REVIEWS ======
app.post("/api/reviews", async (req, res) => {
  try {
    const { orderId, reviewer, farmerId, rating, comment } = req.body;
    if (!orderId || !reviewer || !farmerId || !rating) {
      return res.status(400).json({ ok: false, error: "orderId, reviewer, farmerId, and rating required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ ok: false, error: "rating must be 1–5" });
    }
    const review = await createReview({ orderId, reviewer, farmerId, rating, comment });
    return res.json({ ok: true, review });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ ok: false, error: "You already reviewed this order" });
    }
    console.error("POST /api/reviews:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const { farmerId, orderId, reviewer } = req.query;
    const reviews = await getReviews({ farmerId, orderId, reviewer });
    return res.json({ ok: true, reviews });
  } catch (err) {
    console.error("GET /api/reviews:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/reviews/rating/:farmerId", async (req, res) => {
  try {
    const { farmerId } = req.params;
    const rating = await getAverageRating(farmerId);
    return res.json({ ok: true, ...rating });
  } catch (err) {
    console.error("GET /api/reviews/rating:", err);
    res.status(500).json({ ok: false, error: err.message });
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