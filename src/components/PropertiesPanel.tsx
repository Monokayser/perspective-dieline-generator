"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileArchive,
  FileCode2,
  FileImage,
  FileText,
  Info,
  Layers3,
  Lock,
  LockOpen,
  Move,
  RotateCw,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_SVG_OPTIONS,
  downloadBlob,
  downloadText,
  exportDxf,
  exportMinimalVectorPdf,
  exportRasterPreview,
  exportSvg,
  type SvgExportOptions,
} from "../domain/exporters";
import { createProjectArchive } from "../domain/project";
import type { EdgeKind, ValidationSeverity } from "../domain/types";
import { validationSummary } from "../domain/validation";
import { useProjectStore } from "../store/project-store";

type Tab = "properties" | "layers" | "validate" | "export";

const iconForSeverity = (severity: ValidationSeverity) => {
  if (severity === "error") return <AlertCircle size={15} />;
  if (severity === "warning") return <AlertTriangle size={15} />;
  if (severity === "recommendation") return <Info size={15} />;
  return <CheckCircle2 size={15} />;
};

const safeFilename = (value: string) => value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "dieline";

export function PropertiesPanel() {
  const [tab, setTab] = useState<Tab>("properties");
  const [svgOptions, setSvgOptions] = useState<SvgExportOptions>({ ...DEFAULT_SVG_OPTIONS });
  const [exporting, setExporting] = useState<string | null>(null);
  const {
    projectName,
    imageDataUrl,
    dieline,
    validationIssues,
    selectedObjectId,
    selectedTool,
    unit,
    toDocument,
    toggleLayer,
    selectObject,
    moveSelected,
    rotateSelected,
    duplicateSelected,
    deleteSelected,
    setSelectedPathKind,
    validate,
    setStage,
  } = useProjectStore();

  const selectedPanel = dieline?.panels.find((panel) => panel.id === selectedObjectId);
  const selectedPath = dieline?.paths.find((path) => path.id === selectedObjectId);
  const selected = selectedPanel ?? selectedPath;
  const summary = validationSummary(validationIssues);
  const filename = safeFilename(projectName);

  const performExport = async (kind: string) => {
    if (!dieline && kind !== "project") return;
    setExporting(kind);
    try {
      if (kind === "svg" && dieline) downloadText(exportSvg(dieline, { ...svgOptions, unit }), `${filename}.svg`, "image/svg+xml");
      if (kind === "dxf" && dieline) downloadText(exportDxf(dieline), `${filename}.dxf`, "application/dxf");
      if (kind === "pdf" && dieline) downloadBlob(exportMinimalVectorPdf(dieline), `${filename}.pdf`);
      if (kind === "png" && dieline) downloadBlob(await exportRasterPreview(dieline, "png"), `${filename}-preview.png`);
      if (kind === "jpg" && dieline) downloadBlob(await exportRasterPreview(dieline, "jpeg"), `${filename}-preview.jpg`);
      if (kind === "json") downloadText(JSON.stringify(toDocument(), null, 2), `${filename}.json`, "application/json");
      if (kind === "project") downloadBlob(createProjectArchive(toDocument(), imageDataUrl ?? undefined), `${filename}.pdgproj`);
      setStage(7);
    } finally {
      setExporting(null);
    }
  };

  return (
    <aside className="properties-panel" aria-label="Properties, layers, validation, and export">
      <div className="properties-tabs" role="tablist">
        <button className={tab === "properties" ? "active" : ""} onClick={() => setTab("properties")} title="Properties"><Settings2 size={16} /><span>Properties</span></button>
        <button className={tab === "layers" ? "active" : ""} onClick={() => setTab("layers")} title="Layers"><Layers3 size={16} /><span>Layers</span></button>
        <button className={tab === "validate" ? "active" : ""} onClick={() => setTab("validate")} title="Validation"><ShieldCheck size={16} /><span>Validate</span>{summary.errors > 0 && <b>{summary.errors}</b>}</button>
        <button className={tab === "export" ? "active" : ""} onClick={() => setTab("export")} title="Export"><Download size={16} /><span>Export</span></button>
      </div>

      <div className="properties-content">
        {tab === "properties" && (
          <>
            <div className="section-heading"><span>Selected object</span></div>
            {!selected ? (
              <div className="empty-properties"><Move size={25} /><strong>Nothing selected</strong><p>Select a panel or line in the vector workspace.</p></div>
            ) : (
              <div className="object-properties">
                <div className="object-title"><div className="object-swatch" /><span><strong>{selected.name}</strong><small>{selected.id}</small></span></div>
                {selectedPanel && <div className="property-row"><span>Panel role</span><b>{selectedPanel.role}</b></div>}
                {selectedPath && (
                  <label className="property-field"><span>Line classification</span><select value={selectedPath.kind} onChange={(event) => setSelectedPathKind(event.target.value as EdgeKind)}>{["cut", "crease", "perforation", "guide", "hidden"].map((kind) => <option key={kind}>{kind}</option>)}</select></label>
                )}
                <div className="property-row"><span>Nodes</span><b>{selected.points.length}</b></div>
                <div className="property-row"><span>Mode</span><b>{dieline?.customMode ? "Custom geometry" : "Parametric"}</b></div>
                <div className="transform-grid">
                  <button onClick={() => moveSelected(-1, 0)}>← 1 mm</button>
                  <button onClick={() => moveSelected(1, 0)}>1 mm →</button>
                  <button onClick={() => moveSelected(0, -1)}>↑ 1 mm</button>
                  <button onClick={() => moveSelected(0, 1)}>1 mm ↓</button>
                </div>
                <div className="object-actions">
                  <button onClick={() => rotateSelected(90)}><RotateCw size={14} /> Rotate 90°</button>
                  <button onClick={duplicateSelected}><Copy size={14} /> Duplicate</button>
                  <button className="danger-text" onClick={deleteSelected}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            )}
            <div className="section-heading"><span>Tool settings</span></div>
            <div className="property-row"><span>Active tool</span><b>{selectedTool}</b></div>
            <div className="property-row"><span>Snap to grid</span><b>5 mm</b></div>
            <div className="property-row"><span>Coordinate units</span><b>{unit}</b></div>
          </>
        )}

        {tab === "layers" && (
          <>
            <div className="section-heading"><span>Document layers</span><small>{dieline?.layers.length ?? 0}</small></div>
            {!dieline ? <div className="empty-properties"><Layers3 size={25} /><strong>No vector layers yet</strong><p>Generate a dieline to create the professional layer stack.</p></div> : (
              <div className="layer-list">
                {dieline.layers.map((layer) => (
                  <div className="layer-row" key={layer.id}>
                    <button title={layer.visible ? "Hide layer" : "Show layer"} onClick={() => toggleLayer(layer.id, "visible")}>{layer.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    <span onClick={() => selectObject(layer.id)}><i className={`layer-dot layer-dot-${layer.id}`} />{layer.name}</span>
                    <button title={layer.locked ? "Unlock layer" : "Lock layer"} onClick={() => toggleLayer(layer.id, "locked")}>{layer.locked ? <Lock size={14} /> : <LockOpen size={14} />}</button>
                    <button className={layer.exportable ? "enabled" : ""} title="Include in export" onClick={() => toggleLayer(layer.id, "exportable")}><Download size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "validate" && (
          <>
            <div className="validation-summary">
              <div><strong>{summary.errors}</strong><span>Errors</span></div>
              <div><strong>{summary.warnings}</strong><span>Warnings</span></div>
              <div><strong>{summary.recommendations}</strong><span>Suggestions</span></div>
            </div>
            <button className="primary-button full-width" onClick={() => validate()}><ShieldCheck size={15} /> Run complete validation</button>
            <div className="issue-list">
              {validationIssues.map((issue) => (
                <button key={issue.id} className={`issue issue-${issue.severity}`} onClick={() => selectObject(issue.objectIds[0] ?? null)}>
                  <span className="issue-icon">{iconForSeverity(issue.severity)}</span>
                  <span><strong>{issue.title}</strong><small>{issue.message}</small><em>{issue.repair}</em></span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "export" && (
          <>
            <div className="export-readiness">
              <div className={dieline && summary.errors === 0 ? "ready-icon ready" : "ready-icon"}>{dieline && summary.errors === 0 ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}</div>
              <span><strong>{dieline && summary.errors === 0 ? "Ready for vector export" : "Review before export"}</strong><small>1:1 scale · {unit} · editable paths</small></span>
            </div>
            <div className="section-heading"><span>SVG content</span></div>
            <div className="export-options">
              {([
                ["includeMeasurements", "Measurements"],
                ["includeLabels", "Panel labels"],
                ["includeBleed", "Bleed area"],
                ["includeSafeArea", "Safe area"],
                ["includeGuides", "Guides"],
                ["includeLegend", "Line legend"],
                ["includeArtboard", "Artboard border"],
              ] as const).map(([key, label]) => (
                <label key={key}><input type="checkbox" checked={svgOptions[key]} onChange={(event) => setSvgOptions({ ...svgOptions, [key]: event.target.checked })} /><span>{label}</span></label>
              ))}
            </div>
            <button className="primary-button export-primary" disabled={!dieline || Boolean(exporting)} onClick={() => void performExport("svg")}><FileCode2 size={17} /> Export editable SVG</button>
            <div className="export-grid">
              <button disabled={!dieline || Boolean(exporting)} onClick={() => void performExport("pdf")}><FileText size={16} /><span><strong>PDF</strong><small>Vector print</small></span></button>
              <button disabled={!dieline || Boolean(exporting)} onClick={() => void performExport("dxf")}><FileCode2 size={16} /><span><strong>DXF</strong><small>Layered CAD</small></span></button>
              <button disabled={!dieline || Boolean(exporting)} onClick={() => void performExport("png")}><FileImage size={16} /><span><strong>PNG</strong><small>300 dpi</small></span></button>
              <button disabled={!dieline || Boolean(exporting)} onClick={() => void performExport("jpg")}><FileImage size={16} /><span><strong>JPG</strong><small>300 dpi</small></span></button>
              <button disabled={Boolean(exporting)} onClick={() => void performExport("json")}><FileCode2 size={16} /><span><strong>JSON</strong><small>Raw model</small></span></button>
              <button disabled={Boolean(exporting)} onClick={() => void performExport("project")}><FileArchive size={16} /><span><strong>PDGPROJ</strong><small>Editable project</small></span></button>
            </div>
            <div className="compatibility-note"><Info size={14} /><span>SVG groups are named for Illustrator, Inkscape, CorelDRAW, and Affinity Designer.</span></div>
          </>
        )}
      </div>
    </aside>
  );
}

