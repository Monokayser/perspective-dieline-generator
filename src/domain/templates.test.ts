import { describe, expect, it } from "vitest";
import { createDefaultDimensions } from "./defaults";
import { exportSvg } from "./exporters";
import { generateDieline, TEMPLATES } from "./templates";
import { validateDieline } from "./validation";

const requiredGroups = ["artboard", "cut-lines", "crease-lines", "perforation-lines", "glue-flaps", "bleed-area", "safe-area", "measurements", "labels", "guides"];

describe("parametric dieline generators", () => {
  it.each(TEMPLATES.filter((template) => template.id !== "custom"))(
    "$name produces connected exportable geometry",
    (template) => {
      const dimensions = createDefaultDimensions();
      const model = template.generate(dimensions);
      const issues = validateDieline(model);
      const svg = exportSvg(model);
      expect(template.validateDimensions(dimensions)).toEqual([]);
      expect(model.artboard.widthMm).toBeGreaterThan(0);
      expect(model.artboard.heightMm).toBeGreaterThan(0);
      expect(new Set([...model.panels, ...model.paths].map(({ id }) => id)).size).toBe(model.panels.length + model.paths.length);
      expect(issues.filter(({ severity }) => severity === "error")).toEqual([]);
      expect(svg).toContain('width="');
      expect(svg).toContain('mm" height="');
      expect(svg).toContain(`width="${model.artboard.widthMm.toFixed(4)}mm" height="${model.artboard.heightMm.toFixed(4)}mm" viewBox="0 0 ${model.artboard.widthMm.toFixed(4)} ${model.artboard.heightMm.toFixed(4)}"`);
      for (const group of requiredGroups) expect(svg).toContain(`id="${group}"`);
    },
  );

  it("generates 60 bounded procedural fixtures", () => {
    for (let fixture = 0; fixture < 60; fixture += 1) {
      const dimensions = createDefaultDimensions();
      dimensions.width.valueMm = 35 + (fixture * 17) % 165;
      dimensions.height.valueMm = 45 + (fixture * 29) % 210;
      dimensions.depth.valueMm = 18 + (fixture * 11) % 82;
      dimensions.topFlap.valueMm = Math.min(dimensions.width.valueMm, dimensions.depth.valueMm) * 0.8;
      dimensions.bottomFlap.valueMm = dimensions.topFlap.valueMm;
      const template = TEMPLATES[fixture % 7];
      const model = generateDieline(template.id, dimensions);
      expect(validateDieline(model).filter(({ severity }) => severity === "error"), `fixture ${fixture} / ${template.id}`).toEqual([]);
      for (const path of model.paths) for (const point of path.points) {
        expect(point.x).toBeGreaterThanOrEqual(-0.01);
        expect(point.y).toBeGreaterThanOrEqual(-0.01);
        expect(point.x).toBeLessThanOrEqual(model.artboard.widthMm + 0.01);
        expect(point.y).toBeLessThanOrEqual(model.artboard.heightMm + 0.01);
      }
    }
  });

  it("exports byte-for-byte stable SVG for the same model", () => {
    const model = generateDieline("straight-tuck-end", createDefaultDimensions());
    expect(exportSvg(model)).toBe(exportSvg(model));
  });
});
