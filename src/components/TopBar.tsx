"use client";

import { useRef, useState } from "react";
import { CircleHelp, CloudOff, FilePlus2, FolderOpen, Moon, Redo2, RefreshCw, Save, Sun, Undo2 } from "lucide-react";
import { createProjectArchive, openProjectArchive } from "../domain/project";
import { downloadBlob } from "../domain/exporters";
import { useProjectStore } from "../store/project-store";

const safeFilename = (value: string) => value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "dieline-project";

export function TopBar() {
  const openInput = useRef<HTMLInputElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const {
    projectName,
    theme,
    imageDataUrl,
    history,
    future,
    dirty,
    setProjectName,
    setTheme,
    undo,
    redo,
    resetProject,
    toDocument,
    loadProject,
  } = useProjectStore();

  const save = () => {
    downloadBlob(createProjectArchive(toDocument(), imageDataUrl ?? undefined), `${safeFilename(projectName)}.pdgproj`);
  };

  const open = async (file: File) => {
    try {
      const project = await openProjectArchive(file);
      loadProject(project.document, project.sourceImageDataUrl);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "The project could not be opened.");
    }
  };

  const checkForUpdates = async () => {
    if (!("__TAURI_INTERNALS__" in window)) {
      window.alert("Desktop update checks are available in the installed Windows app.");
      return;
    }
    setCheckingUpdate(true);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (!update) {
        window.alert("Perspective Dieline Generator is up to date.");
        return;
      }
      if (window.confirm(`Version ${update.version} is available. Download and install it now?`)) {
        await update.downloadAndInstall();
        window.alert("The update is installed. Restart the application to finish updating.");
      }
    } catch (error) {
      window.alert(error instanceof Error ? `Update check failed: ${error.message}` : "Update check failed. Offline use is unaffected.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="brand-block">
          <div className="app-mark" aria-hidden="true"><span /><span /><span /></div>
          <div className="brand-copy"><strong>Perspective Dieline</strong><span>Package engineering workspace</span></div>
        </div>
        <div className="project-title-wrap">
          <input aria-label="Project name" value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          {dirty && <i title="Unsaved changes" />}
        </div>
        <nav className="topbar-actions" aria-label="Project actions">
          <button title="New project" onClick={() => { if (!dirty || window.confirm("Create a new project? Unsaved changes will be discarded.")) resetProject(); }}><FilePlus2 size={17} /><span>New</span></button>
          <button title="Open project" onClick={() => openInput.current?.click()}><FolderOpen size={17} /><span>Open</span></button>
          <button title="Save project (Ctrl+S)" onClick={save}><Save size={17} /><span>Save</span></button>
          <span className="topbar-divider" />
          <button title="Undo (Ctrl+Z)" disabled={history.length === 0} onClick={undo}><Undo2 size={17} /></button>
          <button title="Redo (Ctrl+Y)" disabled={future.length === 0} onClick={redo}><Redo2 size={17} /></button>
          <span className="topbar-divider" />
          <button title="Help and shortcuts" onClick={() => setHelpOpen(true)}><CircleHelp size={17} /></button>
          <button title="Check for desktop updates" disabled={checkingUpdate} onClick={() => void checkForUpdates()}><RefreshCw className={checkingUpdate ? "spin" : ""} size={17} /></button>
          <button title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <div className="local-status" title="Images are processed locally"><CloudOff size={14} /><span>Local</span></div>
        </nav>
        <input ref={openInput} hidden type="file" accept=".pdgproj,application/zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) void open(file); event.target.value = ""; }} />
      </header>
      {helpOpen && (
        <div className="modal-backdrop" role="presentation" onPointerDown={() => setHelpOpen(false)}>
          <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onPointerDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><span><CircleHelp size={19} /><strong id="help-title">Workspace guide</strong></span><button onClick={() => setHelpOpen(false)}>×</button></div>
            <div className="help-grid">
              <div><b>1</b><span><strong>Upload and prepare</strong><p>Use a perspective JPG, PNG, or WEBP. Crop closely and improve edge contrast.</p></span></div>
              <div><b>2</b><span><strong>Detect and correct</strong><p>Automatic corners are candidates. Drag every uncertain point onto a real package edge.</p></span></div>
              <div><b>3</b><span><strong>Confirm measurements</strong><p>At least one calibrated edge and all required template dimensions must be confirmed.</p></span></div>
              <div><b>4</b><span><strong>Generate and validate</strong><p>Review the 1:1 vector net, resolve errors, then export named SVG layers.</p></span></div>
            </div>
            <div className="shortcut-list"><span><kbd>V</kbd> Select</span><span><kbd>A</kbd> Direct select</span><span><kbd>Ctrl Z</kbd> Undo</span><span><kbd>Ctrl S</kbd> Save</span><span><kbd>+</kbd> Zoom in</span><span><kbd>0</kbd> Fit</span></div>
            <div className="limitation-note"><strong>Accuracy note</strong><p>A single photograph cannot reveal hidden measurements. Estimated values are never treated as manufacturing dimensions until you confirm them.</p></div>
          </section>
        </div>
      )}
    </>
  );
}
