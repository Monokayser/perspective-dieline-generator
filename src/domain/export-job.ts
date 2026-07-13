import {
  DEFAULT_SVG_OPTIONS,
  exportDxf,
  exportMinimalVectorPdf,
  exportRasterPreview,
  exportSvg,
} from "./exporters";
import { createProjectArchive } from "./project";
import type {
  DielineModel,
  ExportProgress,
  ExportRequest,
  ExportResult,
  FileSaveAdapter,
  ProjectDocument,
} from "./types";
import { saveBlob } from "../lib/files";

type ExportContext = {
  request: ExportRequest;
  model: DielineModel | null;
  document: ProjectDocument;
  sourceImageDataUrl?: string;
  onProgress(progress: ExportProgress): void;
  saveFile?: FileSaveAdapter["save"];
};

const formatInfo = {
  svg: { extension: "svg", mime: "image/svg+xml", description: "Editable SVG dieline" },
  pdf: { extension: "pdf", mime: "application/pdf", description: "Vector PDF dieline" },
  dxf: { extension: "dxf", mime: "application/dxf", description: "Layered DXF dieline" },
  png: { extension: "png", mime: "image/png", description: "PNG preview" },
  jpg: { extension: "jpg", mime: "image/jpeg", description: "JPG preview" },
  json: { extension: "json", mime: "application/json", description: "Dieline JSON" },
  project: { extension: "pdgproj", mime: "application/vnd.pdg.project+zip", description: "Perspective Dieline project" },
} as const;

const nextFrame = () => new Promise<void>((resolve) => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
  else setTimeout(resolve, 0);
});

const progress = async (callback: ExportContext["onProgress"], value: ExportProgress) => {
  callback(value);
  await nextFrame();
};

export const runExport = async ({ request, model, document, sourceImageDataUrl, onProgress, saveFile = saveBlob }: ExportContext): Promise<ExportResult | null> => {
  const info = formatInfo[request.format];
  const filename = request.filename.toLowerCase().endsWith(`.${info.extension}`)
    ? request.filename
    : `${request.filename}.${info.extension}`;

  await progress(onProgress, { phase: "validating", progress: 0.08, status: "Checking export readiness" });
  if (request.format !== "project" && !model) throw new Error("Generate and validate a dieline before exporting this format.");

  await progress(onProgress, { phase: "processing", progress: 0.24, status: "Preparing named geometry and layers" });
  let blob: Blob;
  switch (request.format) {
    case "svg":
      blob = new Blob([exportSvg(model!, request.svgOptions ?? DEFAULT_SVG_OPTIONS)], { type: info.mime });
      break;
    case "pdf":
      blob = exportMinimalVectorPdf(model!);
      break;
    case "dxf":
      blob = new Blob([exportDxf(model!)], { type: info.mime });
      break;
    case "png":
      blob = await exportRasterPreview(model!, "png", 300, (value, status) => onProgress({ phase: "encoding", progress: value, status }));
      break;
    case "jpg":
      blob = await exportRasterPreview(model!, "jpeg", 300, (value, status) => onProgress({ phase: "encoding", progress: value, status }));
      break;
    case "json":
      blob = new Blob([JSON.stringify(document, null, 2)], { type: info.mime });
      break;
    case "project":
      blob = createProjectArchive(document, sourceImageDataUrl);
      break;
  }

  await progress(onProgress, { phase: "saving", progress: 0.9, status: "Saving file to this device" });
  const saved = await saveFile(blob, filename, info.description);
  if (saved.cancelled) return null;
  onProgress({ phase: "complete", progress: 1, status: `${filename} is ready` });
  return { format: request.format, filename, bytes: blob.size, destination: saved.destination };
};
