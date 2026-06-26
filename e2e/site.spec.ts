import { test, expect } from "@playwright/test";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";

async function createFundedKeypair() {
  const kp = Keypair.random();
  const addr = kp.publicKey();
  await fetch(`https://friendbot.stellar.org?addr=${addr}`, { method: "GET" });
  return { kp, addr };
}

test.describe("Landing page", () => {
  test("loads hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Agricultural").first()).toBeVisible({ timeout: 15000 });
  });

  test("shows satellite verification feature", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Satellite Verification" })).toBeVisible({ timeout: 15000 });
  });
});

test.describe("API endpoints", () => {
  test("GET /api/price returns ok", async ({ request }) => {
    const res = await request.get("/api/price");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("xlmUsd");
  });

  test("POST /api/stellar get_treasury_pool returns ok", async ({ request }) => {
    const res = await request.post("/api/stellar", { data: { action: "get_treasury_pool" } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("POST /api/stellar get_all_listings returns ok", async ({ request }) => {
    const res = await request.post("/api/stellar", { data: { action: "get_all_listings" } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.listings)).toBe(true);
  });

  test("GET /api/listings returns ok", async ({ request }) => {
    const res = await request.get("/api/listings");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.listings ?? body.data ?? [])).toBe(true);
  });
});

test.describe("Marketplace page loads", () => {
  test("marketplace page renders", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByText("Marketplace").or(page.getByText("market"))).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Farmer onboarding — create profile + auto-verified", () => {
  let farmerAddr = "";

  test("create farmer profile and verify auto-verified", async ({ request }) => {
    test.setTimeout(30000);
    const { kp, addr } = await createFundedKeypair();
    farmerAddr = addr;

    const res = await request.post("/api/profile", {
      data: { address: addr, fullName: "E2E Farmer", farmName: "E2E Farm", region: "E2E", totalYieldKg: 5000 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.profile.verified).toBe(true);
  });

  test("GET profile returns verified", async ({ request }) => {
    test.setTimeout(15000);
    expect(farmerAddr).toBeTruthy();
    const res = await request.get(`/api/profile?address=${farmerAddr}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.profile.verified).toBe(true);
  });
});

test.describe("NDVI verification — payment gate", () => {
  test("preview mode (nftId=0) skips payment", async ({ request }) => {
    const res = await request.post("/api/verification/run", {
      data: {
        nftId: 0,
        bbox: { west: -6.5, south: 37.8, east: -6.2, north: 38.1 },
        minNdviBps: 2500,
        temporalExtent: "2024-01-01/2024-12-31",
        sampleGridSize: 3,
      },
    });
    expect(res.status()).not.toBe(402);
  });

  test("non-preview (nftId=1) returns 402 without payment", async ({ request }) => {
    const res = await request.post("/api/verification/run", {
      data: {
        nftId: 1,
        bbox: { west: -6.5, south: 37.8, east: -6.2, north: 38.1 },
        minNdviBps: 2500,
        temporalExtent: "2024-01-01/2024-12-31",
        sampleGridSize: 3,
      },
    });
    expect(res.status()).toBe(402);
    const body = await res.json();
    expect(body).toHaveProperty("amount", "0.1");
    expect(body).toHaveProperty("assetCode", "XLM");
  });
});
