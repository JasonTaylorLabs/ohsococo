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

test.describe("notify me button forced-colours focus ring (Issue #85)", () => {
  test("focus ring sits 2px outside the edge in forced colours", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/");

    const button = page.getByRole("button", { name: "Notify me" });
    await page.getByLabel("Email address").focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();

    const computed = await button.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        outlineOffset: cs.outlineOffset,
        outlineStyle: cs.outlineStyle,
        outlineColor: cs.outlineColor,
        borderTopStyle: cs.borderTopStyle,
        borderTopWidth: cs.borderTopWidth,
      };
    });

    expect(computed.outlineOffset).toBe("2px");
    expect(computed.outlineStyle).not.toBe("none");
    expect(computed.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(computed.borderTopStyle).toBe("solid");
    expect(computed.borderTopWidth).toBe("2px");
  });

  test("focus ring offset is unchanged in normal colours", async ({ page }) => {
    await page.goto("/");

    const button = page.getByRole("button", { name: "Notify me" });
    await page.getByLabel("Email address").focus();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();

    const outlineOffset = await button.evaluate(el => getComputedStyle(el).outlineOffset);
    expect(outlineOffset).toBe("0px");
  });
});
