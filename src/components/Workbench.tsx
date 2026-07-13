"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, PanelLeftOpen, PanelRightOpen, RotateCcw, X } from "lucide-react";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { Onboarding } from "./Onboarding";
import { PropertiesPanel } from "./PropertiesPanel";
import { StatusBar } from "./StatusBar";
import { ToolPanel } from "./ToolPanel";
import { TopBar } from "./TopBar";
import { WorkflowBar } from "./WorkflowBar";
import { readRecoverySnapshot, saveRecoverySnapshot } from "../domain/project";
import type { ProjectDocument } from "../domain/types";
import { saveCurrentProject } from "../lib/project-actions";
import { useProjectStore } from "../store/project-store";

export function Workbench() {
  const [leftWidth, setLeftWidth] = useState(278);
  const [rightWidth, setRightWidth] = useState(316);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [recovery, setRecovery] = useState<ProjectDocument | null>(null);
  const resizeRef = useRef<{ side: "left" | "right"; startX: number; startWidth: number } | null>(null);
  const leftDrawerButton = useRef<HTMLButtonElement | null>(null);
  const rightDrawerButton = useRef<HTMLButtonElement | null>(null);
  const [compactPanels, setCompactPanels] = useState(false);
  const {
    theme,
    projectName,
    imageDataUrl,
    dirty,
    notice,
    operation,
    readOnly,
    sourceSchemaVersion,
    zoom,
    toDocument,
    loadProject,
    setTool,
    setZoom,
    setPan,
    undo,
    redo,
    deleteSelected,
    dismissNotice,
    clearOperation,
  } = useProjectStore();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("pdg-theme");
    if (saved === "light" || saved === "dark") useProjectStore.getState().setTheme(saved);
    void readRecoverySnapshot().then((snapshot) => {
      if (snapshot && snapshot.projectName !== "Untitled package") setRecovery(snapshot);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => void saveRecoverySnapshot(toDocument()).catch(() => undefined), 1500);
    return () => window.clearTimeout(timer);
  }, [dirty, projectName, imageDataUrl, toDocument]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismissNotice, 4200);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  useEffect(() => {
    if (!operation || !["complete", "cancelled", "error"].includes(operation.phase)) return;
    const timer = window.setTimeout(clearOperation, operation.phase === "error" ? 8000 : 5000);
    return () => window.clearTimeout(timer);
  }, [operation, clearOperation]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => setCompactPanels(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!compactPanels) return;
    const panel = leftDrawerOpen ? document.getElementById("workflow-tools-panel") : rightDrawerOpen ? document.getElementById("properties-panel") : null;
    panel?.querySelector<HTMLElement>("button,input,select,[tabindex='0']")?.focus();
  }, [compactPanels, leftDrawerOpen, rightDrawerOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCurrentProject();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
      if (typing) return;
      if (event.key.toLowerCase() === "v") setTool("Select");
      if (event.key.toLowerCase() === "a") setTool("Direct select");
      if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
      if (event.key === "+" || event.key === "=") setZoom(zoom * 1.1);
      if (event.key === "-") setZoom(zoom / 1.1);
      if (event.key === "0") { setZoom(1); setPan(0, 0); }
      if (event.key === "Escape") { setLeftDrawerOpen(false); setRightDrawerOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteSelected, redo, setPan, setTool, setZoom, undo, zoom]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!resizeRef.current) return;
      const delta = event.clientX - resizeRef.current.startX;
      if (resizeRef.current.side === "left") setLeftWidth(Math.max(240, Math.min(420, resizeRef.current.startWidth + delta)));
      else setRightWidth(Math.max(270, Math.min(440, resizeRef.current.startWidth - delta)));
    };
    const stop = () => { resizeRef.current = null; document.body.classList.remove("resizing"); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  }, []);

  const beginResize = (side: "left" | "right", event: React.PointerEvent) => {
    resizeRef.current = { side, startX: event.clientX, startWidth: side === "left" ? leftWidth : rightWidth };
    document.body.classList.add("resizing");
  };

  return (
    <div className={`app-shell${leftDrawerOpen ? " left-drawer-open" : ""}${rightDrawerOpen ? " right-drawer-open" : ""}${readOnly ? " read-only" : ""}`} style={{ "--left-panel": `${leftWidth}px`, "--right-panel": `${rightWidth}px` } as React.CSSProperties}>
      <TopBar />
      <WorkflowBar />
      {operation && !["complete", "cancelled", "error"].includes(operation.phase) && (
        <div className="global-operation" role="progressbar" aria-label={operation.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(operation.progress * 100)} aria-valuetext={operation.status}>
          <span style={{ width: `${operation.progress * 100}%` }} />
        </div>
      )}
      <div className="main-layout">
        {readOnly && <div className="read-only-banner" role="status">Read-only project · schema {sourceSchemaVersion}. Editing and saving are disabled.</div>}
        <div className="drawer-actions" aria-label="Workspace panels">
          <button ref={leftDrawerButton} aria-label="Open workflow tools" aria-expanded={leftDrawerOpen} aria-controls="workflow-tools-panel" onClick={() => { setLeftDrawerOpen(true); setRightDrawerOpen(false); }}><PanelLeftOpen size={16} /> Tools</button>
          <button ref={rightDrawerButton} aria-label="Open properties and export" aria-expanded={rightDrawerOpen} aria-controls="properties-panel" onClick={() => { setRightDrawerOpen(true); setLeftDrawerOpen(false); }}>Inspect <PanelRightOpen size={16} /></button>
        </div>
        <ToolPanel inert={readOnly || (compactPanels && !leftDrawerOpen)} />
        <button className="panel-resizer left-resizer" role="separator" aria-orientation="vertical" aria-valuemin={240} aria-valuemax={420} aria-valuenow={leftWidth} aria-label="Resize tools panel" onKeyDown={(event) => { if (event.key === "ArrowLeft") setLeftWidth(Math.max(240, leftWidth - 10)); if (event.key === "ArrowRight") setLeftWidth(Math.min(420, leftWidth + 10)); }} onPointerDown={(event) => beginResize("left", event)} />
        <CanvasWorkspace />
        <button className="panel-resizer right-resizer" role="separator" aria-orientation="vertical" aria-valuemin={270} aria-valuemax={440} aria-valuenow={rightWidth} aria-label="Resize properties panel" onKeyDown={(event) => { if (event.key === "ArrowLeft") setRightWidth(Math.min(440, rightWidth + 10)); if (event.key === "ArrowRight") setRightWidth(Math.max(270, rightWidth - 10)); }} onPointerDown={(event) => beginResize("right", event)} />
        <PropertiesPanel inert={compactPanels && !rightDrawerOpen} />
        {(leftDrawerOpen || rightDrawerOpen) && <button className="drawer-backdrop" aria-label="Close side panel" onClick={() => { const restore = leftDrawerOpen ? leftDrawerButton.current : rightDrawerButton.current; setLeftDrawerOpen(false); setRightDrawerOpen(false); window.setTimeout(() => restore?.focus()); }} />}
      </div>
      <StatusBar />
      <Onboarding />
      {recovery && !imageDataUrl && (
        <div className="recovery-banner">
          <RotateCcw size={17} />
          <span><strong>Recovery snapshot found</strong><small>{recovery.projectName} · {new Date(recovery.updatedAt).toLocaleString()}</small></span>
          <button onClick={() => { loadProject(recovery); setRecovery(null); }}>Restore</button>
          <button className="icon-button" aria-label="Dismiss recovery" onClick={() => setRecovery(null)}><X size={15} /></button>
        </div>
      )}
      {notice && (
        <div className={`toast toast-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"} aria-live={notice.tone === "error" ? "assertive" : "polite"}>
          {notice.tone === "success" ? <CheckCircle2 size={17} /> : notice.tone === "warning" || notice.tone === "error" ? <AlertTriangle size={17} /> : <Info size={17} />}
          <span>{notice.message}</span>
          <button onClick={dismissNotice} aria-label="Dismiss notification"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
