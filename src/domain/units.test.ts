import { describe, expect, it } from "vitest";
import { confidenceLabel } from "./types";
import { formatMeasurement, fromMillimetres, toMillimetres } from "./units";

describe("physical unit conversions", () => {
  it.each([
    ["mm", 1], ["cm", 10], ["in", 25.4], ["pt", 25.4 / 72],
  ] as const)("round-trips %s without losing precision", (unit, factor) => {
    expect(toMillimetres(1, unit)).toBeCloseTo(factor, 12);
    expect(fromMillimetres(toMillimetres(37.125, unit), unit)).toBeCloseTo(37.125, 12);
  });

  it("formats dimensions in the selected display unit", () => {
    expect(formatMeasurement(25.4, "in", 3)).toBe("1.000 in");
  });
});

describe("confidence bands", () => {
  it.each([[0.8, "high"], [0.55, "medium"], [0.35, "low"], [0.349, "manual"]] as const)(
    "maps %s to %s", (score, label) => expect(confidenceLabel(score)).toBe(label),
  );
  it("requires manual confirmation when explicitly requested", () => {
    expect(confidenceLabel(0.99, true)).toBe("manual");
  });
});
