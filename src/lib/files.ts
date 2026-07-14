import type { FileSaveAdapter, FileSaveOptions, FileSaveResult } from "../domain/types";

export const safeFilename = (value: string, fallback = "dieline") =>
  value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 120) || fallback;

export type SaveResult = FileSaveResult;

export const isDesktopApp = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const extensionOf = (filename: string) => filename.includes(".") ? filename.split(".").pop()?.toLowerCase() ?? "" : "";

const filenameFromPath = (path: string, fallback: string) => path.split(/[\\/]/).pop() || fallback;

const ensureExtension = (path: string, extension: string) => {
  if (!path.trim() || path.includes("\0")) {
    throw new Error("The selected save path is invalid. Choose another folder or filename.");
  }
  if (!extension || path.toLowerCase().endsWith(`.${extension}`)) return path;
  return `${path.replace(/\.$/, "")}.${extension}`;
};

const saveError = (error: unknown, path: string) => {
  const detail = error instanceof Error ? error.message : String(error);
  const normalised = detail.toLowerCase();
  const name = filenameFromPath(path, "the export");

  if (/access.*denied|permission|not permitted|os error 5/.test(normalised)) {
    return new Error(`Windows denied permission to save ${name}. Choose another folder or check its permissions.`);
  }
  if (/already exists|os error (80|183)|being used by another process|sharing violation/.test(normalised)) {
    return new Error(`${name} already exists or is open in another application. Close it or choose another filename.`);
  }
  if (/no such file|cannot find|not found|os error (2|3)/.test(normalised)) {
    return new Error("The selected folder is no longer available. Choose another save location.");
  }
  if (/no space|disk full|os error 112/.test(normalised)) {
    return new Error("The selected drive does not have enough free space for this export.");
  }
  return new Error(`Could not save ${name}. ${detail || "Choose another folder or filename and try again."}`);
};

const browserDownload = (blob: Blob, filename: string): SaveResult => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return { filename, destination: "download", cancelled: false };
};

export const browserFileSaveAdapter: FileSaveAdapter = {
  save: async (blob, filename) => browserDownload(blob, filename),
};

export const tauriFileSaveAdapter: FileSaveAdapter = {
  save: async (blob, filename, description = "Dieline export", options?: FileSaveOptions) => {
    const [{ save }, { writeFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    const extension = extensionOf(filename);
    let path = options?.targetPath;
    if (!path) {
      path = await save({
        defaultPath: filename,
        filters: extension ? [{ name: description, extensions: [extension] }] : undefined,
      }) ?? undefined;
      if (!path) return { filename, destination: "desktop", cancelled: true };
    }

    const finalPath = ensureExtension(path, extension);
    try {
      await writeFile(finalPath, new Uint8Array(await blob.arrayBuffer()));
    } catch (error) {
      throw saveError(error, finalPath);
    }
    return { filename: filenameFromPath(finalPath, filename), destination: "desktop", cancelled: false, path: finalPath };
  },
};

export const saveBlob = async (blob: Blob, filename: string, description = "Dieline export", options?: FileSaveOptions): Promise<SaveResult> => {
  return (isDesktopApp() ? tauriFileSaveAdapter : browserFileSaveAdapter).save(blob, filename, description, options);
};

export type OpenedProjectFile = { file: File; path: string };

export const chooseDesktopProjectFile = async (): Promise<OpenedProjectFile | null> => {
  if (!isDesktopApp()) return null;
  const [{ open }, { readFile }] = await Promise.all([
    import("@tauri-apps/plugin-dialog"),
    import("@tauri-apps/plugin-fs"),
  ]);
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Perspective Dieline project", extensions: ["pdgproj"] }],
  });
  if (typeof path !== "string") return null;
  const bytes = await readFile(path);
  const filename = path.split(/[\\/]/).pop() || "project.pdgproj";
  return { file: new File([bytes], filename, { type: "application/vnd.pdg.project+zip" }), path };
};
