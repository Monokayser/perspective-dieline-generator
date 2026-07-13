import { describe, expect, it } from "vitest";
import { safeFilename } from "./files";

describe("safe export filenames", () => {
  it.each([
    ["  My package / proof  ", "My-package-proof"],
    ["../../unsafe", "unsafe"],
    ["", "dieline"],
    ["carton_v2-final", "carton_v2-final"],
  ])("normalises %j", (input, expected) => expect(safeFilename(input)).toBe(expected));

  it("limits filenames to a portable length", () => {
    expect(safeFilename("a".repeat(400))).toHaveLength(120);
  });
});

