import { expect, test } from "@playwright/test";

test.describe("notify me button forced-colours edge (Issue #81)", () => {
  test("Notify me button has a visible border in forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");

    const button = page.getByRole("button", { name: "Notify me" });

    await expect(button).toHaveCSS("border-top-style", "solid");
    await expect(button).toHaveCSS("border-top-width", "2px");

    const borderColor = await button.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(borderColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("Notify me button looks the same in normal colours", async ({ page }) => {
    await page.goto("/");

    const button = page.getByRole("button", { name: "Notify me" });

    await expect(button).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
    await expect(button).toHaveCSS("background-color", "rgb(92, 58, 33)");
    const box = await button.boundingBox();
    expect(box?.height).toBe(56);
  });

  test("Notify me button keeps its edge on focus in forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");

    const button = page.getByRole("button", { name: "Notify me" });
    await button.focus();

    await expect(button).toHaveCSS("border-top-style", "solid");
    await expect(button).toHaveCSS("border-top-width", "2px");

    const borderColor = await button.evaluate(el => getComputedStyle(el).borderTopColor);
    expect(borderColor).not.toBe("rgba(0, 0, 0, 0)");
  });
});
