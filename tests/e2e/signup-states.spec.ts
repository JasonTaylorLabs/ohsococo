import { expect, test, type Page } from "@playwright/test";

test("signup success message has a pink focus ring, not the browser outline", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Email address").press("Enter");

  const status = page.getByRole("status").filter({ hasText: "Your email app should open" });
  await expect(status).toBeVisible();
  // Wait for focus to settle.
  await expect(status).toHaveCount(1);

  await expect(status).toBeFocused();
  await expect(status).toHaveCSS("outline-style", "none");
  await expect(status).toHaveCSS("box-shadow", /rgb\(196, 61, 112\) 0px 0px 0px 2px/);
});

test("signup success message hides the heart emoji from screen readers", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Email address").press("Enter");

  const status = page.getByRole("status").filter({ hasText: "Your email app should open" });
  await expect(status).toBeVisible();

  const span = status.locator('span[aria-hidden="true"]');
  await expect(span).toContainText("\uD83E\uDD0E");
  await expect(status).toContainText("Your email app should open");
});

async function submitInvalidEmail(page: Page) {
  await page.goto("/");
  const input = page.getByLabel("Email address");
  await input.fill("not-an-email");
  await page.getByRole("button", { name: "Notify me" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter a valid email." })).toBeVisible();
}

test("invalid email field keeps a pink border after focus leaves it", async ({ page }) => {
  const input = page.getByLabel("Email address");

  // Before any submit: resting cocoa-600.
  await page.goto("/");
  await expect(input).toHaveCSS("border-top-color", "rgb(154, 106, 69)");

  await input.blur();

  // After submitting bad email and blurring: pink-700.
  await submitInvalidEmail(page);
  await input.blur();
  await expect(input).toHaveCSS("border-top-color", "rgb(196, 61, 112)");

  // A valid submission clears the form (unmount status), so check that it still works.
  await input.fill("test@example.com");
  await page.getByLabel("Email address").press("Enter");
  await expect(page.getByRole("status").filter({ hasText: "Your email app should open" })).toBeVisible();
});
