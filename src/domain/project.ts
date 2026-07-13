import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";
import type { ProjectDocument } from "./types";

const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;
const SAFE_PATH = /^(?![A-Za-z]:)(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._/-]+$/;

const projectSchema = z.object({
  schemaVersion: z.number().int().positive(),
  application: z.literal("Perspective Dieline Generator"),
  projectId: z.string().min(1),
  projectName: z.string().min(1).max(160),
  createdAt: z.string(),
  updatedAt: z.string(),
  stage: z.number().int().min(0).max(7),
  templateId: z.string(),
  dimensions: z.record(z.string(), z.object({
    valueMm: z.number().finite().min(0).max(100000),
    displayUnit: z.enum(["mm", "cm", "in", "pt"]),
    provenance: z.enum(["confirmed", "manual", "calculated", "estimated", "inferred"]),
    confidence: z.number().min(0).max(1).optional(),
    sourceRef: z.string().max(200).optional(),
  })),
  preprocess: z.record(z.string(), z.unknown()),
  analysis: z.unknown().nullable(),
  dieline: z.unknown().nullable(),
  sourceImage: z.object({ filename: z.string(), mimeType: z.string(), assetPath: z.string() }).optional(),
  display: z.object({
    unit: z.enum(["mm", "cm", "in", "pt"]),
    scale: z.number().positive(),
    theme: z.enum(["light", "dark"]),
    decimalPrecision: z.number().int().min(0).max(6),
  }),
});

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
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error("Project archives larger than 200 MiB are not supported.");
  const unpacked = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (entry) => {
    if (!SAFE_PATH.test(entry.name)) throw new Error(`Unsafe archive path: ${entry.name}`);
    return true;
  } });
  const total = Object.values(unpacked).reduce((sum, bytes) => sum + bytes.length, 0);
  if (total > MAX_ARCHIVE_BYTES) throw new Error("The expanded project exceeds the 200 MiB safety limit.");
  if (!unpacked["project.json"]) throw new Error("This archive does not contain project.json.");

  const raw = JSON.parse(strFromU8(unpacked["project.json"]));
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Invalid project document: ${parsed.error.issues[0]?.message ?? "schema mismatch"}`);
  if (parsed.data.schemaVersion > 1) {
    throw new Error("This project was created by a newer application version and can only be opened read-only.");
  }
  const document = raw as ProjectDocument;
  let sourceImageDataUrl: string | undefined;
  if (document.sourceImage) {
    if (!SAFE_PATH.test(document.sourceImage.assetPath)) throw new Error("The project references an unsafe image path.");
    const bytes = unpacked[document.sourceImage.assetPath];
    if (!bytes) throw new Error("The embedded source image is missing.");
    sourceImageDataUrl = bytesToDataUrl(bytes, document.sourceImage.mimeType);
  }
  return { document, sourceImageDataUrl };
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
  return result;
};

