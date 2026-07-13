import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
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
    expect(opened.readOnly).toBe(false);
    expect(opened.sourceSchemaVersion).toBe(1);
  });

  it("opens structurally compatible newer projects read-only", async () => {
    const document = { ...project(), schemaVersion: 2 };
    const archive = createProjectArchive(document);
    const opened = await openProjectArchive(new File([archive], "future.pdgproj"));
    expect(opened.readOnly).toBe(true);
    expect(opened.sourceSchemaVersion).toBe(2);
  });

  it("rejects traversal paths before extraction", async () => {
    const archive = zipSync({ "../project.json": strToU8(JSON.stringify(project())) });
    await expect(openProjectArchive(new File([archive], "unsafe.pdgproj"))).rejects.toThrow(/unsafe archive path/i);
  });

  it("rejects suspicious compression ratios before parsing", async () => {
    const archive = zipSync({ "project.json": strToU8("0".repeat(2_000_000)) }, { level: 9 });
    await expect(openProjectArchive(new File([archive], "bomb.pdgproj"))).rejects.toThrow(/compression ratio/i);
  });

  it("rejects malformed nested geometry", async () => {
    const document = project();
    document.dieline!.paths[0].points[0].x = Number.NaN;
    const archive = createProjectArchive(document);
    await expect(openProjectArchive(new File([archive], "malformed.pdgproj"))).rejects.toThrow(/invalid project document/i);
  });
});
