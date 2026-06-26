# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site.spec.ts >> Marketplace page loads >> marketplace page renders
- Location: e2e/site.spec.ts:56:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Marketplace').or(getByText('market'))
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Marketplace').or(getByText('market'))

```

```yaml
- heading "Connect Your Wallet" [level=1]
- paragraph: Connect your Stellar wallet to access Agri-Block features.
- button "Connect Wallet"
- alert
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";
  3   | 
  4   | async function createFundedKeypair() {
  5   |   const kp = Keypair.random();
  6   |   const addr = kp.publicKey();
  7   |   await fetch(`https://friendbot.stellar.org?addr=${addr}`, { method: "GET" });
  8   |   return { kp, addr };
  9   | }
  10  | 
  11  | test.describe("Landing page", () => {
  12  |   test("loads hero section", async ({ page }) => {
  13  |     await page.goto("/");
  14  |     await expect(page.getByText("Agricultural").first()).toBeVisible({ timeout: 15000 });
  15  |   });
  16  | 
  17  |   test("shows satellite verification feature", async ({ page }) => {
  18  |     await page.goto("/");
  19  |     await expect(page.getByRole("heading", { name: "Satellite Verification" })).toBeVisible({ timeout: 15000 });
  20  |   });
  21  | });
  22  | 
  23  | test.describe("API endpoints", () => {
  24  |   test("GET /api/price returns ok", async ({ request }) => {
  25  |     const res = await request.get("/api/price");
  26  |     expect(res.ok()).toBeTruthy();
  27  |     const body = await res.json();
  28  |     expect(body).toHaveProperty("xlmUsd");
  29  |   });
  30  | 
  31  |   test("POST /api/stellar get_treasury_pool returns ok", async ({ request }) => {
  32  |     const res = await request.post("/api/stellar", { data: { action: "get_treasury_pool" } });
  33  |     expect(res.ok()).toBeTruthy();
  34  |     const body = await res.json();
  35  |     expect(body.ok).toBe(true);
  36  |   });
  37  | 
  38  |   test("POST /api/stellar get_all_listings returns ok", async ({ request }) => {
  39  |     const res = await request.post("/api/stellar", { data: { action: "get_all_listings" } });
  40  |     expect(res.ok()).toBeTruthy();
  41  |     const body = await res.json();
  42  |     expect(body.ok).toBe(true);
  43  |     expect(Array.isArray(body.listings)).toBe(true);
  44  |   });
  45  | 
  46  |   test("GET /api/listings returns ok", async ({ request }) => {
  47  |     const res = await request.get("/api/listings");
  48  |     expect(res.ok()).toBeTruthy();
  49  |     const body = await res.json();
  50  |     expect(body.ok).toBe(true);
  51  |     expect(Array.isArray(body.listings ?? body.data ?? [])).toBe(true);
  52  |   });
  53  | });
  54  | 
  55  | test.describe("Marketplace page loads", () => {
  56  |   test("marketplace page renders", async ({ page }) => {
  57  |     await page.goto("/marketplace");
> 58  |     await expect(page.getByText("Marketplace").or(page.getByText("market"))).toBeVisible({ timeout: 15000 });
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  59  |   });
  60  | });
  61  | 
  62  | test.describe("Farmer onboarding — create profile + auto-verified", () => {
  63  |   let farmerAddr = "";
  64  | 
  65  |   test("create farmer profile and verify auto-verified", async ({ request }) => {
  66  |     test.setTimeout(30000);
  67  |     const { kp, addr } = await createFundedKeypair();
  68  |     farmerAddr = addr;
  69  | 
  70  |     const res = await request.post("/api/profile", {
  71  |       data: { address: addr, fullName: "E2E Farmer", farmName: "E2E Farm", region: "E2E", totalYieldKg: 5000 },
  72  |     });
  73  |     expect(res.ok()).toBeTruthy();
  74  |     const body = await res.json();
  75  |     expect(body.ok).toBe(true);
  76  |     expect(body.profile.verified).toBe(true);
  77  |   });
  78  | 
  79  |   test("GET profile returns verified", async ({ request }) => {
  80  |     test.setTimeout(15000);
  81  |     expect(farmerAddr).toBeTruthy();
  82  |     const res = await request.get(`/api/profile?address=${farmerAddr}`);
  83  |     expect(res.ok()).toBeTruthy();
  84  |     const body = await res.json();
  85  |     expect(body.ok).toBe(true);
  86  |     expect(body.profile.verified).toBe(true);
  87  |   });
  88  | });
  89  | 
  90  | test.describe("NDVI verification — payment gate", () => {
  91  |   test("preview mode (nftId=0) skips payment", async ({ request }) => {
  92  |     const res = await request.post("/api/verification/run", {
  93  |       data: {
  94  |         nftId: 0,
  95  |         bbox: { west: -6.5, south: 37.8, east: -6.2, north: 38.1 },
  96  |         minNdviBps: 2500,
  97  |         temporalExtent: "2024-01-01/2024-12-31",
  98  |         sampleGridSize: 3,
  99  |       },
  100 |     });
  101 |     expect(res.status()).not.toBe(402);
  102 |   });
  103 | 
  104 |   test("non-preview (nftId=1) returns 402 without payment", async ({ request }) => {
  105 |     const res = await request.post("/api/verification/run", {
  106 |       data: {
  107 |         nftId: 1,
  108 |         bbox: { west: -6.5, south: 37.8, east: -6.2, north: 38.1 },
  109 |         minNdviBps: 2500,
  110 |         temporalExtent: "2024-01-01/2024-12-31",
  111 |         sampleGridSize: 3,
  112 |       },
  113 |     });
  114 |     expect(res.status()).toBe(402);
  115 |     const body = await res.json();
  116 |     expect(body).toHaveProperty("amount", "0.1");
  117 |     expect(body).toHaveProperty("assetCode", "XLM");
  118 |   });
  119 | });
  120 | 
```