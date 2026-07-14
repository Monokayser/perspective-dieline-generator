import { runExport } from "../domain/export-job";
import { safeFilename } from "./files";
import { useProjectStore } from "../store/project-store";

export const saveCurrentProject = async ({ saveAs = false }: { saveAs?: boolean } = {}) => {
  const state = useProjectStore.getState();
  if (state.readOnly) {
    state.showNotice("warning", "This newer project is open read-only and cannot be overwritten.");
    return false;
  }
  if (state.operation && !["complete", "cancelled", "error"].includes(state.operation.phase)) {
    state.showNotice("warning", `Wait for ${state.operation.label.toLowerCase()} to finish before saving the project.`);
    return false;
  }
  const filename = `${safeFilename(state.projectName, "dieline-project")}.pdgproj`;
  const operationId = state.beginOperation("project-save", "Saving project", "Preparing project archive", filename);
  try {
    const result = await runExport({
      request: { format: "project", filename },
      model: state.dieline,
      document: state.toDocument(),
      sourceImageDataUrl: state.imageDataUrl ?? undefined,
      onProgress: (progress) => useProjectStore.getState().updateOperation(operationId, progress),
      saveOptions: !saveAs && state.projectFilePath ? { targetPath: state.projectFilePath } : undefined,
    });
    const current = useProjectStore.getState();
    if (!result) {
      current.updateOperation(operationId, { phase: "cancelled", status: "Save cancelled" });
      current.showNotice("info", "Project save cancelled. No file was written.");
      return false;
    }
    current.completeOperation(operationId, `${filename} saved successfully`);
    if (result.path) current.setProjectFilePath(result.path);
    current.markSaved();
    current.showNotice("success", result.path ? `Project saved to ${result.path}` : `${filename} downloaded successfully.`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The project could not be saved.";
    const current = useProjectStore.getState();
    current.failOperation(operationId, message);
    current.showNotice("error", message);
    return false;
  }
};
