import { expect, test } from "@playwright/test";

test.describe("signup email field focus outline", () => {
  test("shows a solid pink outline on focus", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Email address");

    // Before focus: no outline (using browser default which shows as none via our tests checking baseline)
    await expect(input).toHaveCSS("outline-style", "none");

    // Focus the input
    await input.focus();

    // Verify outline properties match expectation
    await expect(input).toHaveCSS("outline-style", "solid");
    await expect(input).toHaveCSS("outline-width", "2px");
    await expect(input).toHaveCSS("outline-offset", "2px");
    await expect(input).toHaveCSS("outline-color", "rgb(196, 61, 112)");

    // Ring should be gone (no box-shadow halo)
    await expect(input).toHaveCSS("box-shadow", "none");

    // Border should still turn pink on focus
    await expect(input).toHaveCSS("border-top-color", "rgb(232, 93, 138)");
  });

  test("focus outline survives forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");
    const input = page.getByLabel("Email address");

    await input.focus();

    // Outline still solid in forced colours mode
    await expect(input).toHaveCSS("outline-style", "solid");
    await expect(input).toHaveCSS("outline-width", "2px");

    // outline-color should not be fully transparent (rgba(0, 0, 0, 0) is invisible)
    const outlineColor = await input.evaluate(el => getComputedStyle(el).outlineColor);
    expect(outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});
