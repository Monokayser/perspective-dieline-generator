"use client";

import { useEffect, useRef, useState } from "react";
import { CircleHelp, CloudOff, FilePlus2, FolderOpen, Moon, Redo2, Save, SaveAll, Sun, Undo2 } from "lucide-react";
import { openProjectArchive } from "../domain/project";
import { chooseDesktopProjectFile, isDesktopApp } from "../lib/files";
import { saveCurrentProject } from "../lib/project-actions";
import { useProjectStore } from "../store/project-store";
import { AppMark } from "./AppMark";

export function TopBar() {
  const openInput = useRef<HTMLInputElement | null>(null);
  const helpDialog = useRef<HTMLElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const {
    projectName,
    theme,
    history,
    future,
    dirty,
    readOnly,
    projectFilePath,
    setProjectName,
    setTheme,
    undo,
    redo,
    resetProject,
    loadProject,
    showNotice,
    beginOperation,
    updateOperation,
    completeOperation,
    failOperation,
  } = useProjectStore();

  const desktop = isDesktopApp();
  const save = () => void saveCurrentProject();
  const saveAs = () => void saveCurrentProject({ saveAs: true });

  useEffect(() => {
    if (!helpOpen || !helpDialog.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = helpDialog.current;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>("button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])")).filter((element) => !element.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setHelpOpen(false); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [helpOpen]);

  const open = async (file: File, sourcePath?: string) => {
    const operationId = beginOperation("project-open", "Opening project", "Reading and validating project archive", file.name);
    try {
      updateOperation(operationId, { phase: "processing", progress: 0.25, status: "Checking archive safety" });
      const project = await openProjectArchive(file);
      updateOperation(operationId, { phase: "processing", progress: 0.8, status: "Restoring project workspace" });
      loadProject(project.document, project.sourceImageDataUrl, { readOnly: project.readOnly, sourceSchemaVersion: project.sourceSchemaVersion, sourcePath });
      completeOperation(operationId, project.readOnly ? "Project opened read-only" : "Project opened successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The project could not be opened.";
      failOperation(operationId, message);
      showNotice("error", message);
    }
  };

  const chooseProject = async () => {
    if (!desktop) {
      openInput.current?.click();
      return;
    }
    try {
      const selected = await chooseDesktopProjectFile();
      if (selected) await open(selected.file, selected.path);
    } catch (error) {
      showNotice("error", error instanceof Error ? `Project open failed: ${error.message}` : "The selected project could not be opened.");
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="brand-block">
          <AppMark />
          <div className="brand-copy"><strong>Perspective Dieline</strong><span>Package engineering workspace</span></div>
        </div>
        <div className="project-title-wrap">
          <input aria-label="Project name" value={projectName} disabled={readOnly} onChange={(event) => setProjectName(event.target.value)} />
          {dirty && <i title="Unsaved changes" />}
        </div>
        <nav className="topbar-actions" aria-label="Project actions">
          <button title="New project" onClick={() => { if (!dirty || window.confirm("Create a new project? Unsaved changes will be discarded.")) resetProject(); }}><FilePlus2 size={17} /><span>New</span></button>
          <button title={desktop ? "Open a project file from this PC" : "Open a downloaded project file"} onClick={() => void chooseProject()}><FolderOpen size={17} /><span>Open</span></button>
          <button title={readOnly ? "Read-only project" : projectFilePath ? `Save project to ${projectFilePath} (Ctrl+S)` : desktop ? "Save project — choose a folder and filename (Ctrl+S)" : "Download project file (Ctrl+S)"} disabled={readOnly} onClick={save}><Save size={17} /><span>Save project</span></button>
          {desktop && <button title="Save project as — choose another folder or filename (Ctrl+Shift+S)" disabled={readOnly} onClick={saveAs}><SaveAll size={17} /><span>Save as</span></button>}
          <span className="topbar-divider" />
          <button title="Undo (Ctrl+Z)" disabled={history.length === 0} onClick={undo}><Undo2 size={17} /></button>
          <button title="Redo (Ctrl+Y)" disabled={future.length === 0} onClick={redo}><Redo2 size={17} /></button>
          <span className="topbar-divider" />
          <button title="Help and shortcuts" onClick={() => setHelpOpen(true)}><CircleHelp size={17} /></button>
          <button title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <div className="local-status" title="Images are processed locally"><CloudOff size={14} /><span>Local</span></div>
        </nav>
        <input ref={openInput} hidden type="file" accept=".pdgproj,application/zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) void open(file); event.target.value = ""; }} />
      </header>
      {helpOpen && (
        <div className="modal-backdrop" role="presentation" onPointerDown={() => setHelpOpen(false)}>
          <section ref={helpDialog} className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onPointerDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><span><CircleHelp size={19} /><strong id="help-title">Help and about</strong></span><button aria-label="Close help and about" onClick={() => setHelpOpen(false)}>x</button></div>
            <div className="help-grid">
              <div><b>1</b><span><strong>Upload and prepare</strong><p>Use a perspective JPG, PNG, or WEBP. Crop closely and improve edge contrast.</p></span></div>
              <div><b>2</b><span><strong>Detect and correct</strong><p>Automatic corners are candidates. Drag every uncertain point onto a real package edge.</p></span></div>
              <div><b>3</b><span><strong>Confirm measurements</strong><p>At least one calibrated edge and all required template dimensions must be confirmed.</p></span></div>
              <div><b>4</b><span><strong>Generate and validate</strong><p>Review the 1:1 vector net, resolve errors, then export named SVG layers.</p></span></div>
            </div>
            <div className="shortcut-list"><span><kbd>Ctrl Z</kbd> Undo</span><span><kbd>Ctrl Y</kbd> Redo</span><span><kbd>Ctrl S</kbd> Save project</span><span><kbd>Ctrl Shift S</kbd> Save as</span><span><kbd>+</kbd> Zoom in</span><span><kbd>0</kbd> Fit</span></div>
            <div className="limitation-note"><strong>Accuracy note</strong><p>A single photograph cannot reveal hidden measurements. Estimated values are never treated as manufacturing dimensions until you confirm them.</p></div>
            <div className="product-credit">
              <AppMark />
              <span><strong>Perspective Dieline Generator</strong><small>Designed and developed by <b>S. M. Monowar Kayser</b></small></span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
