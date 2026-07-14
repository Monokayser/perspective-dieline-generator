import { describe, expect, it } from "vitest";
import { normalizeRotation, preparedDimensions, preparationFilter } from "./prepare-image";

describe("image preparation geometry", () => {
  it("normalizes positive and negative rotations", () => {
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
  });

  it("swaps dimensions only for quarter turns", () => {
    expect(preparedDimensions(1200, 800, 90)).toEqual({ width: 800, height: 1200 });
    expect(preparedDimensions(1200, 800, 180)).toEqual({ width: 1200, height: 800 });
  });

  it("builds a deterministic cross-browser canvas filter", () => {
    expect(preparationFilter({ brightness: 110, contrast: 95, saturation: 120 }))
      .toBe("brightness(110%) contrast(95%) saturate(120%)");
  });
});
