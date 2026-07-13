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
import { downloadBlob } from "../domain/exporters";
import { createProjectArchive, readRecoverySnapshot, saveRecoverySnapshot } from "../domain/project";
import type { ProjectDocument } from "../domain/types";
import { useProjectStore } from "../store/project-store";

const safeFilename = (value: string) => value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "dieline-project";

export function Workbench() {
  const [leftWidth, setLeftWidth] = useState(278);
  const [rightWidth, setRightWidth] = useState(316);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [recovery, setRecovery] = useState<ProjectDocument | null>(null);
  const resizeRef = useRef<{ side: "left" | "right"; startX: number; startWidth: number } | null>(null);
  const {
    theme,
    projectName,
    imageDataUrl,
    dirty,
    notice,
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
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        downloadBlob(createProjectArchive(toDocument(), imageDataUrl ?? undefined), `${safeFilename(projectName)}.pdgproj`);
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
  }, [deleteSelected, imageDataUrl, projectName, redo, setPan, setTool, setZoom, toDocument, undo, zoom]);

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
    <div className={`app-shell${leftDrawerOpen ? " left-drawer-open" : ""}${rightDrawerOpen ? " right-drawer-open" : ""}`} style={{ "--left-panel": `${leftWidth}px`, "--right-panel": `${rightWidth}px` } as React.CSSProperties}>
      <TopBar />
      <WorkflowBar />
      <div className="main-layout">
        <div className="drawer-actions" aria-label="Workspace panels">
          <button aria-label="Open workflow tools" onClick={() => { setLeftDrawerOpen(true); setRightDrawerOpen(false); }}><PanelLeftOpen size={16} /> Tools</button>
          <button aria-label="Open properties and export" onClick={() => { setRightDrawerOpen(true); setLeftDrawerOpen(false); }}>Inspect <PanelRightOpen size={16} /></button>
        </div>
        <ToolPanel />
        <button className="panel-resizer left-resizer" aria-label="Resize tools panel" onPointerDown={(event) => beginResize("left", event)} />
        <CanvasWorkspace />
        <button className="panel-resizer right-resizer" aria-label="Resize properties panel" onPointerDown={(event) => beginResize("right", event)} />
        <PropertiesPanel />
        {(leftDrawerOpen || rightDrawerOpen) && <button className="drawer-backdrop" aria-label="Close side panel" onClick={() => { setLeftDrawerOpen(false); setRightDrawerOpen(false); }} />}
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
        <div className={`toast toast-${notice.tone}`} role="status" aria-live="polite">
          {notice.tone === "success" ? <CheckCircle2 size={17} /> : notice.tone === "warning" || notice.tone === "error" ? <AlertTriangle size={17} /> : <Info size={17} />}
          <span>{notice.message}</span>
          <button onClick={dismissNotice} aria-label="Dismiss notification"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
