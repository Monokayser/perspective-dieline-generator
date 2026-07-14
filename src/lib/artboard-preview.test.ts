import { describe, expect, it } from "vitest";
import { calculateArtboardFit, formatAspectRatio } from "./artboard-preview";

describe("artboard preview fitting", () => {
  it("contains a wide artboard while preserving its ratio", () => {
    const fit = calculateArtboardFit({ artboardWidth: 400, artboardHeight: 200, viewportWidth: 800, viewportHeight: 500, padding: 40 });
    expect(fit).toMatchObject({ width: 720, height: 360, ratio: 2 });
  });

  it("contains a tall artboard while preserving its ratio", () => {
    const fit = calculateArtboardFit({ artboardWidth: 200, artboardHeight: 400, viewportWidth: 800, viewportHeight: 500, padding: 40 });
    expect(fit.width).toBe(210);
    expect(fit.height).toBe(420);
    expect(fit.width / fit.height).toBeCloseTo(0.5, 8);
  });

  it("respects the canvas size caps and reports the physical ratio", () => {
    const fit = calculateArtboardFit({ artboardWidth: 400, artboardHeight: 400, viewportWidth: 2000, viewportHeight: 1600, padding: 20, maxWidth: 1000, maxHeight: 700 });
    expect(fit).toMatchObject({ width: 700, height: 700, ratio: 1 });
    expect(formatAspectRatio(400, 200)).toBe("2.00:1");
  });
});
