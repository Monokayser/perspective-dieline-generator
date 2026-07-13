import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";
import type { ProjectDocument } from "./types";

const MAX_ARCHIVE_INPUT_BYTES = 64 * 1024 * 1024;
const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
const MAX_ENTRIES = 16;
const MAX_COMPRESSION_RATIO = 200;
const SAFE_PATH = /^(?![A-Za-z]:)(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;

const unitSchema = z.enum(["mm", "cm", "in", "pt"]);
const templateSchema = z.enum(["rectangular-carton", "cube-box", "straight-tuck-end", "reverse-tuck-end", "simple-sleeve", "basic-mailer", "triangular-closure", "custom"]);
const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const measurementSchema = z.object({
  valueMm: z.number().finite().min(0).max(100000),
  displayUnit: unitSchema,
  provenance: z.enum(["confirmed", "manual", "calculated", "estimated", "inferred"]),
  confidence: z.number().min(0).max(1).optional(),
  sourceRef: z.string().max(200).optional(),
}).strict();
const dimensionsSchema = z.object({
  width: measurementSchema,
  height: measurementSchema,
  depth: measurementSchema,
  topFlap: measurementSchema,
  bottomFlap: measurementSchema,
  glueFlap: measurementSchema,
  dustFlap: measurementSchema,
  lockingTab: measurementSchema,
  bleed: measurementSchema,
  safeMargin: measurementSchema,
  materialThickness: measurementSchema,
  foldAllowance: measurementSchema,
}).strict();
const preprocessSchema = z.object({
  rotation: z.number().finite().min(-3600).max(3600),
  flipX: z.boolean(),
  flipY: z.boolean(),
  brightness: z.number().finite().min(0).max(300),
  contrast: z.number().finite().min(0).max(300),
  saturation: z.number().finite().min(0).max(300),
  sharpness: z.number().finite().min(0).max(10),
  grayscale: z.boolean(),
  threshold: z.boolean(),
  edgePreview: z.boolean(),
}).strict();
const annotationPointSchema = pointSchema.extend({ id: z.string().min(1).max(120), locked: z.boolean().optional(), confidence: z.number().min(0).max(1) }).strict();
const analysisSchema = z.object({
  version: z.literal(1),
  analysisVersion: z.literal("1.0.0"),
  transformStack: z.array(z.object({ operation: z.string().max(80), values: z.array(z.number().finite()).max(32) }).strict()).max(100),
  workingImage: z.object({ width: z.number().int().positive().max(50000), height: z.number().int().positive().max(50000), scaleFromOriginal: z.number().positive().max(1), maxDimension: z.number().int().positive().max(8192) }).strict(),
  points: z.array(annotationPointSchema).max(10000),
  normalizedCorners: z.array(annotationPointSchema).max(10000),
  edges: z.array(z.object({ id: z.string().max(120), startId: z.string().max(120), endId: z.string().max(120), kind: z.enum(["cut", "crease", "perforation", "guide", "hidden"]), confidence: z.number().min(0).max(1) }).strict()).max(20000),
  faces: z.array(z.object({ id: z.string().max(120), label: z.enum(["front", "back", "left", "right", "top", "bottom", "unknown"]), pointIds: z.array(z.string().max(120)).max(1000), confidence: z.number().min(0).max(1), approved: z.boolean() }).strict()).max(1000),
  vanishingDirections: z.array(z.object({ id: z.string().max(120), direction: pointSchema, confidence: z.number().min(0).max(1) }).strict()).max(32),
  rectificationMatrices: z.array(z.object({ faceId: z.string().max(120), matrix3x3: z.array(z.number().finite()).length(9), confidence: z.number().min(0).max(1) }).strict()).max(1000),
  candidates: z.array(z.object({ templateId: templateSchema, label: z.string().max(120), confidence: z.number().min(0).max(1), reasons: z.array(z.string().max(300)).max(20) }).strict()).max(32),
  quality: z.object({ width: z.number().int().positive().max(50000), height: z.number().int().positive().max(50000), brightness: z.number().min(0).max(1), contrast: z.number().min(0).max(1), sharpness: z.number().min(0).max(1), foregroundCoverage: z.number().min(0).max(1) }).strict(),
  warnings: z.array(z.object({ id: z.string().max(120), severity: z.enum(["warning", "information"]), title: z.string().max(200), detail: z.string().max(1000), recommendation: z.string().max(1000) }).strict()).max(100),
  confidence: z.number().min(0).max(1),
  processedAt: z.string().max(80),
  method: z.enum(["local-gradient-and-contour", "manual"]),
}).strict();
const panelSchema = z.object({ id: z.string().min(1).max(120), name: z.string().max(200), role: z.enum(["front", "back", "left", "right", "top", "bottom", "flap", "glue"]), points: z.array(pointSchema).min(3).max(20000), locked: z.boolean() }).strict();
const pathSchema = z.object({ id: z.string().min(1).max(120), name: z.string().max(200), kind: z.enum(["cut", "crease", "perforation", "guide", "hidden", "bleed", "safe", "measurement", "artboard"]), points: z.array(pointSchema).min(2).max(20000), closed: z.boolean(), panelId: z.string().max(120).optional() }).strict();
const layerSchema = z.object({ id: z.string().min(1).max(120), name: z.string().max(200), visible: z.boolean(), locked: z.boolean(), exportable: z.boolean() }).strict();
const overrideValueSchema = z.union([z.string().max(1000), z.number().finite(), z.boolean(), z.null()]);
const dielineSchema = z.object({
  version: z.literal(1), id: z.string().min(1).max(120), templateId: templateSchema, templateVersion: z.number().int().positive().max(1000), customMode: z.boolean(),
  parameters: dimensionsSchema,
  nonstructuralOverrides: z.record(z.string().max(120), overrideValueSchema).refine((value) => Object.keys(value).length <= 100, "Too many nonstructural overrides"),
  panels: z.array(panelSchema).max(2000), paths: z.array(pathSchema).max(10000), layers: z.array(layerSchema).max(100),
  artboard: z.object({ widthMm: z.number().positive().max(100000), heightMm: z.number().positive().max(100000), paddingMm: z.number().min(0).max(10000) }).strict(),
  scale: z.number().positive().max(1000), generatedAt: z.string().max(80),
}).strict();

const projectSchema = z.object({
  schemaVersion: z.number().int().positive(),
  application: z.literal("Perspective Dieline Generator"),
  projectId: z.string().min(1),
  projectName: z.string().min(1).max(160),
  createdAt: z.string(),
  updatedAt: z.string(),
  stage: z.number().int().min(0).max(7),
  templateId: templateSchema,
  dimensions: dimensionsSchema,
  preprocess: preprocessSchema,
  analysis: analysisSchema.nullable(),
  dieline: dielineSchema.nullable(),
  sourceImage: z.object({ filename: z.string().min(1).max(255).refine((value) => !/[\\/]/.test(value), "Unsafe source filename"), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), assetPath: z.string().max(255) }).strict().optional(),
  display: z.object({
    unit: unitSchema,
    scale: z.number().positive(),
    theme: z.enum(["light", "dark"]),
    decimalPrecision: z.number().int().min(0).max(6),
  }).strict(),
}).passthrough();

const manifestSchema = z.object({
  format: z.literal("pdgproj"),
  schemaVersion: z.number().int().positive(),
  createdBy: z.string().max(200),
  files: z.array(z.string().max(255)).max(MAX_ENTRIES),
}).passthrough();

const dataUrlToBytes = (dataUrl: string) => {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("The source image is not a supported embedded asset.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { mimeType: match[1], bytes };
};

const bytesToDataUrl = (bytes: Uint8Array, mimeType: string) => {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
};

export const createProjectArchive = (document: ProjectDocument, sourceImageDataUrl?: string) => {
  const files: Record<string, Uint8Array> = {};
  const cleanDocument = structuredClone(document);
  if (sourceImageDataUrl && document.sourceImage) {
    const { bytes } = dataUrlToBytes(sourceImageDataUrl);
    if (bytes.length > MAX_ARCHIVE_BYTES) throw new Error("The embedded image exceeds the 200 MiB project limit.");
    files[document.sourceImage.assetPath] = bytes;
  }
  const manifest = {
    format: "pdgproj",
    schemaVersion: 1,
    createdBy: "Perspective Dieline Generator 1.0.0",
    files: Object.keys(files),
  };
  files["project.json"] = strToU8(JSON.stringify(cleanDocument, null, 2));
  files["manifest.json"] = strToU8(JSON.stringify(manifest, null, 2));
  return new Blob([zipSync(files, { level: 6 })], { type: "application/vnd.pdg.project+zip" });
};

export const openProjectArchive = async (file: File) => {
  if (file.size > MAX_ARCHIVE_INPUT_BYTES) throw new Error("Project archives larger than 64 MiB are not supported.");
  let entryCount = 0;
  let declaredTotal = 0;
  const unpacked = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (entry) => {
    if (!SAFE_PATH.test(entry.name)) throw new Error(`Unsafe archive path: ${entry.name}`);
    if (entry.name.endsWith("/")) return false;
    entryCount += 1;
    if (entryCount > MAX_ENTRIES) throw new Error(`Project archives may contain at most ${MAX_ENTRIES} files.`);
    if (entry.originalSize > MAX_ENTRY_BYTES) throw new Error(`Archive entry ${entry.name} exceeds the 64 MiB per-file limit.`);
    declaredTotal += entry.originalSize;
    if (declaredTotal > MAX_ARCHIVE_BYTES) throw new Error("The archive declares more than 200 MiB of expanded data.");
    if (entry.size > 0 && entry.originalSize / entry.size > MAX_COMPRESSION_RATIO) throw new Error(`Archive entry ${entry.name} has an unsafe compression ratio.`);
    return true;
  } });
  const total = Object.values(unpacked).reduce((sum, bytes) => sum + bytes.length, 0);
  if (total > MAX_ARCHIVE_BYTES) throw new Error("The expanded project exceeds the 200 MiB safety limit.");
  if (!unpacked["project.json"]) throw new Error("This archive does not contain project.json.");
  if (unpacked["project.json"].length > 10 * 1024 * 1024) throw new Error("project.json exceeds the 10 MiB safety limit.");
  if (unpacked["manifest.json"]) {
    const manifest = manifestSchema.safeParse(JSON.parse(strFromU8(unpacked["manifest.json"])));
    if (!manifest.success) throw new Error(`Invalid project manifest: ${manifest.error.issues[0]?.message ?? "schema mismatch"}`);
    for (const path of manifest.data.files) if (!SAFE_PATH.test(path)) throw new Error(`Unsafe manifest path: ${path}`);
  }

  const raw = JSON.parse(strFromU8(unpacked["project.json"]));
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Invalid project document: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`);
  const document = parsed.data as ProjectDocument;
  const sourceSchemaVersion = parsed.data.schemaVersion;
  const readOnly = sourceSchemaVersion > 1;
  let sourceImageDataUrl: string | undefined;
  if (document.sourceImage) {
    if (!SAFE_PATH.test(document.sourceImage.assetPath)) throw new Error("The project references an unsafe image path.");
    const bytes = unpacked[document.sourceImage.assetPath];
    if (!bytes) throw new Error("The embedded source image is missing.");
    sourceImageDataUrl = bytesToDataUrl(bytes, document.sourceImage.mimeType);
  }
  return { document, sourceImageDataUrl, readOnly, sourceSchemaVersion };
};

const DATABASE = "perspective-dieline-recovery";
const STORE = "snapshots";

const openRecoveryDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DATABASE, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const saveRecoverySnapshot = async (document: ProjectDocument) => {
  const database = await openRecoveryDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).put(document, "latest");
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
};

export const readRecoverySnapshot = async () => {
  const database = await openRecoveryDatabase();
  const result = await new Promise<ProjectDocument | undefined>((resolve, reject) => {
    const request = database.transaction(STORE, "readonly").objectStore(STORE).get("latest");
    request.onsuccess = () => resolve(request.result as ProjectDocument | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  if (!result) return undefined;
  const parsed = projectSchema.safeParse(result);
  return parsed.success && parsed.data.schemaVersion <= 1 ? parsed.data as ProjectDocument : undefined;
};
