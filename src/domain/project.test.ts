import { describe, expect, it } from "vitest";
import { createDefaultDimensions } from "./defaults";
import { createProjectArchive, openProjectArchive } from "./project";
import { generateDieline } from "./templates";
import type { ProjectDocument } from "./types";

const project = (): ProjectDocument => ({
  schemaVersion: 1,
  application: "Perspective Dieline Generator",
  projectId: "test-project",
  projectName: "Archive round trip",
  createdAt: "2026-07-14T00:00:00.000Z",
  updatedAt: "2026-07-14T00:00:00.000Z",
  stage: 7,
  templateId: "rectangular-carton",
  dimensions: createDefaultDimensions(),
  preprocess: { rotation: 0, flipX: false, flipY: false, brightness: 100, contrast: 100, saturation: 100, sharpness: 0, grayscale: false, threshold: false, edgePreview: false },
  analysis: null,
  dieline: generateDieline("rectangular-carton", createDefaultDimensions()),
  display: { unit: "mm", scale: 1, theme: "dark", decimalPrecision: 2 },
});

describe(".pdgproj archives", () => {
  it("round-trips a version 1 project", async () => {
    const archive = createProjectArchive(project());
    const file = new File([archive], "roundtrip.pdgproj", { type: archive.type });
    const opened = await openProjectArchive(file);
    expect(opened.document.projectId).toBe("test-project");
    expect(opened.document.dieline?.paths.length).toBeGreaterThan(0);
  });
});
