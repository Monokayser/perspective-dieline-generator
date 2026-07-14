import { describe, expect, it, vi } from "vitest";
import { createDefaultDimensions, DEFAULT_PREPROCESS } from "./defaults";
import { runExport } from "./export-job";
import { generateDieline } from "./templates";
import type { ProjectDocument } from "./types";

const model = generateDieline("rectangular-carton", createDefaultDimensions());
const document: ProjectDocument = {
  schemaVersion: 1,
  application: "Perspective Dieline Generator",
  projectId: "export-test",
  projectName: "Export test",
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
  stage: 7,
  templateId: "rectangular-carton",
  dimensions: createDefaultDimensions(),
  preprocess: { ...DEFAULT_PREPROCESS },
  analysis: null,
  dieline: model,
  display: { unit: "mm", scale: 1, theme: "dark", decimalPrecision: 2 },
};

describe("export operation pipeline", () => {
  it.each(["svg", "pdf", "dxf", "json", "project"] as const)("prepares and saves %s with progress", async (format) => {
    const save = vi.fn(async (blob: Blob, filename: string) => ({ filename, destination: "download" as const, cancelled: false, bytes: blob.size }));
    const updates: number[] = [];
    const result = await runExport({
      request: { format, filename: `fixture.${format === "project" ? "pdgproj" : format}` },
      model,
      document,
      onProgress: (entry) => updates.push(entry.progress),
      saveFile: save,
    });
    expect(result?.bytes).toBeGreaterThan(0);
    expect(result?.destination).toBe("download");
    expect(save).toHaveBeenCalledOnce();
    expect(updates[0]).toBe(0.08);
    expect(updates.at(-1)).toBe(1);
  });

  it("does not write when the user cancels the save dialog", async () => {
    const result = await runExport({
      request: { format: "svg", filename: "cancelled.svg" },
      model,
      document,
      onProgress: () => undefined,
      saveFile: async (_blob, filename) => ({ filename, destination: "desktop", cancelled: true }),
    });
    expect(result).toBeNull();
  });

  it("forwards a chosen desktop path and reports where the file was saved", async () => {
    const targetPath = "C:\\Users\\Example\\Documents\\fixture.svg";
    const save = vi.fn(async (_blob: Blob, filename: string, _description?: string, options?: { targetPath?: string }) => ({
      filename,
      destination: "desktop" as const,
      cancelled: false,
      path: options?.targetPath,
    }));
    const result = await runExport({
      request: { format: "svg", filename: "fixture.svg" },
      model,
      document,
      onProgress: () => undefined,
      saveFile: save,
      saveOptions: { targetPath },
    });
    expect(save).toHaveBeenCalledWith(expect.any(Blob), "fixture.svg", "Editable SVG dieline", { targetPath });
    expect(result?.path).toBe(targetPath);
  });

  it("rejects production exports without generated geometry", async () => {
    await expect(runExport({
      request: { format: "svg", filename: "missing.svg" },
      model: null,
      document: { ...document, dieline: null },
      onProgress: () => undefined,
      saveFile: vi.fn(),
    })).rejects.toThrow(/generate and validate/i);
  });
});
