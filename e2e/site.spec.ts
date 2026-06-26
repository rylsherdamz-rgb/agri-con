import { test, expect } from "@playwright/test";

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
    const res = await request.post("/api/stellar", {
      data: { action: "get_treasury_pool" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

test.describe("Farmer profiles", () => {
  const testAddresses = [
    "GCZZH3WMRJOKK2WI3CHDIT2DOGCGFAUIKTIZRYQT7UOM27KLOXUHHH4D",
    "GD6BXFHBOSRL5OEDR72DP7KXPNCREQH4G2OX67LOHZOWPCQCIYX73UKU",
    "GC3PJIVG2S4RBXI2ZKHL4Z67BR6OHWYEUY2GFFSRFXHX7U6ARFYV3FID",
  ];

  for (const addr of testAddresses) {
    test(`farmer ${addr.slice(0, 8)} is verified`, async ({ request }) => {
      const res = await request.get(`/api/profile?address=${addr}`);
      expect(res.ok()).toBeTruthy();
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.profile).toBeTruthy();
      expect(body.profile.verified).toBe(true);
    });
  }
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
    // preview mode: no 402, proceeds to processing (may fail on openEO creds, but not 402)
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
