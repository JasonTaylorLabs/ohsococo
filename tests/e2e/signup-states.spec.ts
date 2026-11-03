import { expect, test } from "@playwright/test";

test("signup success message has a pink focus ring, not the browser outline", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Email address").press("Enter");

  const status = page.getByRole("status").filter({ hasText: "Your email app should open" });
  await expect(status).toBeFocused();
  await expect(status).toHaveCSS("outline-style", "none");
  await expect(status).toHaveCSS("box-shadow", /rgb\(196, 61, 112\) 0px 0px 0px 2px/);
});

test("signup success message hides the heart emoji from screen readers", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Email address").press("Enter");

  const status = page.getByRole("status").filter({ hasText: "Your email app should open" });
  await expect(status.locator('span[aria-hidden="true"]')).toHaveText("🤎");
  await expect(status).toHaveText(/^🤎 Your email app should open/);
});

test("invalid email field keeps a pink border after focus leaves it", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Email address");
  await expect(input).toHaveCSS("border-top-color", "rgb(154, 106, 69)");

  await input.fill("not-an-email");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter a valid email." })).toBeVisible();
  await input.blur();
  await expect(input).toHaveCSS("border-top-color", "rgb(196, 61, 112)");

  await input.fill("test@example.com");
  await input.press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Your email app should open" })).toBeVisible();
});
