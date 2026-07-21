import { expect, test } from "@playwright/test";

test("landing page loads without a fatal client error", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await expect(page.getByText(/Fast delivery/i)).toBeVisible();
  await expect(page).toHaveTitle(/MoveDek/i);
  expect(pageErrors).toEqual([]);
});

test("unknown routes render the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText(/not found/i)).toBeVisible();
});
