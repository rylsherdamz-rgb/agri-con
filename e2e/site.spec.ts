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
