import type { FileSaveAdapter } from "../domain/types";

export const safeFilename = (value: string, fallback = "dieline") =>
  value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "").slice(0, 120) || fallback;

export type SaveResult = {
  filename: string;
  destination: "download" | "desktop";
  cancelled: boolean;
};

const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const extensionOf = (filename: string) => filename.includes(".") ? filename.split(".").pop()?.toLowerCase() ?? "" : "";

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
  save: async (blob, filename, description = "Dieline export") => {
    const [{ save }, { writeFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    const extension = extensionOf(filename);
    const path = await save({
      defaultPath: filename,
      filters: extension ? [{ name: description, extensions: [extension] }] : undefined,
    });
    if (!path) return { filename, destination: "desktop", cancelled: true };
    await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    return { filename, destination: "desktop", cancelled: false };
  },
};

export const saveBlob = async (blob: Blob, filename: string, description = "Dieline export"): Promise<SaveResult> => {
  return (isTauri() ? tauriFileSaveAdapter : browserFileSaveAdapter).save(blob, filename, description);
};
