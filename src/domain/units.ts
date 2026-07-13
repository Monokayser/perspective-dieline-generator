import type { Unit } from "./types";

const MM_PER_UNIT: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
};

export const toMillimetres = (value: number, unit: Unit) => value * MM_PER_UNIT[unit];
export const fromMillimetres = (valueMm: number, unit: Unit) => valueMm / MM_PER_UNIT[unit];

export const formatMeasurement = (
  valueMm: number,
  unit: Unit,
  precision = 2,
) => `${fromMillimetres(valueMm, unit).toFixed(precision)} ${unit}`;

export const mm = (valueMm: number, provenance: "manual" | "confirmed" = "manual") => ({
  valueMm,
  displayUnit: "mm" as const,
  provenance,
  confidence: provenance === "confirmed" ? 1 : undefined,
});

