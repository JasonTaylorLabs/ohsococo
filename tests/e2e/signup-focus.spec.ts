import { expect, test } from "@playwright/test";

test.describe("signup email field focus outline", () => {
  test("shows a solid pink outline on focus", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Email address");

    await expect(input).toHaveCSS("outline-style", "none");

    await input.focus();

    await expect(input).toHaveCSS("outline-style", "solid");
    await expect(input).toHaveCSS("outline-width", "2px");
    await expect(input).toHaveCSS("outline-offset", "2px");
    await expect(input).toHaveCSS("outline-color", "rgb(196, 61, 112)");
    await expect(input).toHaveCSS("box-shadow", "none");
    await expect(input).toHaveCSS("border-top-color", "rgb(232, 93, 138)");
  });

  test("focus outline survives forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    const input = page.getByLabel("Email address");

    await input.focus();

    await expect(input).toHaveCSS("outline-style", "solid");
    await expect(input).toHaveCSS("outline-width", "2px");

    // rgba(0, 0, 0, 0) would be an invisible outline.
    const outlineColor = await input.evaluate(el => getComputedStyle(el).outlineColor);
    expect(outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  // The invalid border (pink-700) overrides the focus border here, so the outline is the only focus cue.
  test("outline shows when the field is invalid and focused again", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Email address");
    await input.fill("not-an-email");
    await page.getByRole("button", { name: "Notify me" }).click();
    await expect(input).toHaveAttribute("aria-invalid", "true");

    await input.focus();

    await expect(input).toHaveCSS("outline-style", "solid");
    await expect(input).toHaveCSS("outline-color", "rgb(196, 61, 112)");
    await expect(input).toHaveCSS("border-top-color", "rgb(196, 61, 112)");
  });
});
