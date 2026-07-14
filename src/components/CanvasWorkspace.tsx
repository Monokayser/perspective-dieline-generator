"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent } from "react";
import { Focus, Grid3X3, Maximize2, Minus, Plus, ScanLine } from "lucide-react";
import { confidenceLabel, type PanelGeometry, type Point, type VectorPath } from "../domain/types";
import { prepareImage } from "../lib/prepare-image";
import { useProjectStore } from "../store/project-store";

const pathData = (points: Point[], closed: boolean) => {
  if (points.length === 0) return "";
  return `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}${closed ? " Z" : ""}`;
};

const panelCenter = (panel: PanelGeometry) => ({
  x: panel.points.reduce((sum, point) => sum + point.x, 0) / panel.points.length,
  y: panel.points.reduce((sum, point) => sum + point.y, 0) / panel.points.length,
});

const pathClass = (kind: VectorPath["kind"]) => `vector-path vector-${kind}`;

const layerForKind = (kind: VectorPath["kind"]) => ({
  cut: "cut-lines",
  crease: "crease-lines",
  perforation: "perforation-lines",
  guide: "guides",
  hidden: "guides",
  bleed: "bleed-area",
  safe: "safe-area",
  measurement: "measurements",
  artboard: "artboard",
}[kind]);

function DielineCanvas({ showGrid = true, preview = false }: { showGrid?: boolean; preview?: boolean }) {
  const {
    dieline,
    zoom,
    pan,
    selectedObjectId,
    setZoom,
    setPan,
    selectObject,
  } = useProjectStore();
  const dragging = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  if (!dieline) return null;
  const visibleLayers = new Set(dieline.layers.filter((layer) => layer.visible).map((layer) => layer.id));
  const viewWidth = dieline.artboard.widthMm;
  const viewHeight = dieline.artboard.heightMm;

  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    setZoom(zoom * (event.deltaY > 0 ? 0.9 : 1.1));
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 1 && event.button !== 2 && !event.shiftKey) return;
    dragging.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    setPan(dragging.current.panX + event.clientX - dragging.current.x, dragging.current.panY + event.clientY - dragging.current.y);
  };

  return (
    <div className={`canvas-scroll dieline-surface${preview ? " print-preview-surface" : ""}`}>
      <svg
        className={`dieline-canvas${preview ? " print-preview-canvas" : ""}`}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        aria-label="Editable dieline vector workspace"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragging.current = null; }}
        onContextMenu={(event) => event.preventDefault()}
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <defs>
          <pattern id="minor-grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" className="minor-grid-line" fill="none" />
          </pattern>
          <pattern id="major-grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <rect width="25" height="25" fill="url(#minor-grid)" />
            <path d="M 25 0 L 0 0 0 25" className="major-grid-line" fill="none" />
          </pattern>
        </defs>
        <rect width={viewWidth} height={viewHeight} className="artboard-fill" />
        {showGrid && !preview && <rect width={viewWidth} height={viewHeight} fill="url(#major-grid)" />}
        {visibleLayers.has("panel-geometry") && dieline.panels.map((panel) => (
          <path
            key={panel.id}
            d={pathData(panel.points, true)}
            className={`panel-shape panel-${panel.role} ${selectedObjectId === panel.id ? "selected" : ""}`}
            onPointerDown={(event) => { if (!preview) { event.stopPropagation(); selectObject(panel.id); } }}
          />
        ))}
        {dieline.paths.map((path) => visibleLayers.has(layerForKind(path.kind)) && (
          <path
            key={path.id}
            d={pathData(path.points, path.closed)}
            className={`${pathClass(path.kind)} ${selectedObjectId === path.id ? "selected" : ""}`}
            onPointerDown={(event) => { if (!preview) { event.stopPropagation(); selectObject(path.id); } }}
          />
        ))}
        {visibleLayers.has("labels") && dieline.panels.map((panel) => {
          const center = panelCenter(panel);
          return <text key={`label-${panel.id}`} x={center.x} y={center.y} className="panel-label">{panel.name}</text>;
        })}
        {selectedObjectId && (() => {
          const panel = dieline.panels.find((candidate) => candidate.id === selectedObjectId);
          if (!panel) return null;
          return panel.points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r={1.6} className="selection-handle" />);
        })()}
      </svg>
    </div>
  );
}

function ImageCanvas() {
  const {
    imageDataUrl,
    imageFilename,
    preprocess,
    analysis,
    analysisRunning,
    analysisProgress,
    analysisStage,
    updateAnnotationPoint,
  } = useProjectStore();
  const overlayRef = useRef<SVGSVGElement | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);

  const pointMap = useMemo(() => new Map(analysis?.points.map((point) => [point.id, point]) ?? []), [analysis]);
  const [preparedImage, setPreparedImage] = useState<{ source: string; url: string } | null>(null);

  useEffect(() => {
    if (!imageDataUrl) return;
    const controller = new AbortController();
    let prepared: Awaited<ReturnType<typeof prepareImage>> | null = null;
    void prepareImage(imageDataUrl, preprocess, controller.signal).then((result) => {
      prepared = result;
      setPreparedImage({ source: imageDataUrl, url: result.url });
    }).catch(() => undefined);
    return () => { controller.abort(); prepared?.revoke(); };
  }, [imageDataUrl, preprocess]);

  const updateFromPointer = (event: ReactPointerEvent<SVGSVGElement>, pointId: string) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    updateAnnotationPoint(pointId, (event.clientX - bounds.left) / bounds.width, (event.clientY - bounds.top) / bounds.height);
  };

  if (!imageDataUrl) {
    return (
      <div className="empty-workspace" role="status">
        <div className="empty-icon"><ScanLine size={34} /></div>
        <h2>Start with a perspective package image</h2>
        <p>Drop a JPG, PNG, or WEBP into the upload panel. Your image stays on this device.</p>
        <div className="privacy-pill">Local processing · no cloud upload</div>
      </div>
    );
  }

  return (
    <div className="image-workspace">
      <div className="image-stage">
        {/* Keep the untouched source local; image preparation is handled by the deterministic bitmap pipeline. */}
        <img
          src={preparedImage?.source === imageDataUrl ? preparedImage.url : imageDataUrl}
          alt={`Source package: ${imageFilename ?? "uploaded image"}`}
          className={`source-image ${preprocess.threshold ? "threshold-preview" : ""}`}
          style={{ filter: preprocess.grayscale ? "grayscale(1)" : undefined }}
        />
        {analysis && (
          <svg
            ref={overlayRef}
            className="annotation-overlay"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-label="Detected package annotations"
            onPointerMove={(event) => { if (draggingPoint) updateFromPointer(event, draggingPoint); }}
            onPointerUp={() => setDraggingPoint(null)}
            onPointerLeave={() => setDraggingPoint(null)}
          >
            {analysis.faces.map((face) => (
              <polygon
                key={face.id}
                points={face.pointIds.map((id) => pointMap.get(id)).filter(Boolean).map((point) => `${point!.x},${point!.y}`).join(" ")}
                className={`detected-face ${face.approved ? "approved" : ""}`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {analysis.edges.map((edge) => {
              const start = pointMap.get(edge.startId);
              const end = pointMap.get(edge.endId);
              return start && end ? (
                <line key={edge.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={`detected-edge edge-${edge.kind}`} vectorEffect="non-scaling-stroke" />
              ) : null;
            })}
            {analysis.points.map((point, index) => (
              <g key={point.id} className="corner-point" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDraggingPoint(point.id); }}>
                <circle cx={point.x} cy={point.y} r="0.014" vectorEffect="non-scaling-stroke" />
                <text x={point.x} y={point.y} dy="0.004" textAnchor="middle" vectorEffect="non-scaling-stroke">{index + 1}</text>
              </g>
            ))}
          </svg>
        )}
        {preprocess.edgePreview && <div className="edge-preview-overlay" aria-hidden="true" />}
        {analysisRunning && (
          <div className="analysis-progress" role="status" aria-live="polite">
            <div className="spinner" />
            <strong>{analysisStage}</strong>
            <div className="progress-track" role="progressbar" aria-label="Local image analysis" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(analysisProgress * 100)}><span style={{ width: `${analysisProgress * 100}%` }} /></div>
            <small>{Math.round(analysisProgress * 100)}% · running locally</small>
          </div>
        )}
      </div>
      {analysis && (
        <div className="image-footer-strip">
          <span className={`confidence-badge confidence-${confidenceLabel(analysis.confidence)}`}><Focus size={14} /> {confidenceLabel(analysis.confidence)} confidence · {Math.round(analysis.confidence * 100)}%</span>
          <span>{analysis.points.length} corners</span>
          <span>{analysis.edges.length} edges</span>
        </div>
      )}
    </div>
  );
}

export function CanvasWorkspace() {
  const { phase, dieline, zoom, setZoom, setPan, pan } = useProjectStore();
  const [view, setView] = useState<"image" | "dieline" | "preview">("dieline");
  const [showGrid, setShowGrid] = useState(true);
  const activeView = !dieline || phase === "source" || phase === "analyze" || phase === "measure" ? "image" : view;
  const showDieline = activeView !== "image" && Boolean(dieline);

  return (
    <main className="workspace" aria-label="Package analysis and dieline workspace">
      <div className="workspace-toolbar">
        <div className="tool-group" aria-label="Workspace tools">
          <button className={showGrid ? "active" : ""} aria-pressed={showGrid} title="Toggle grid" onClick={() => setShowGrid((value) => !value)}><Grid3X3 size={16} /></button>
        </div>
        <div className="view-tabs" role="tablist" aria-label="Workspace view">
          <button id="workspace-tab-image" className={activeView === "image" ? "active" : ""} role="tab" aria-selected={activeView === "image"} aria-controls="workspace-view" onClick={() => setView("image")}>Image & detection</button>
          <button id="workspace-tab-dieline" className={activeView === "dieline" ? "active" : ""} role="tab" aria-selected={activeView === "dieline"} aria-controls="workspace-view" disabled={!dieline} onClick={() => setView("dieline")}>Dieline editor</button>
          <button id="workspace-tab-preview" className={activeView === "preview" ? "active" : ""} role="tab" aria-selected={activeView === "preview"} aria-controls="workspace-view" disabled={!dieline} onClick={() => setView("preview")}>Print preview</button>
        </div>
        <div className="zoom-controls">
          <button onClick={() => setZoom(zoom / 1.1)} title="Zoom out"><Minus size={15} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom * 1.1)} title="Zoom in"><Plus size={15} /></button>
          <button onClick={() => { setZoom(1); setPan(0, 0); }} title="Fit to screen"><Maximize2 size={15} /></button>
        </div>
      </div>
      <div id="workspace-view" className="workspace-body" role="tabpanel" aria-labelledby={`workspace-tab-${activeView}`}>
        {showDieline ? <DielineCanvas showGrid={showGrid} preview={activeView === "preview"} /> : <ImageCanvas />}
      </div>
      {showDieline && <div className="canvas-coordinates">X {pan.x.toFixed(0)} · Y {pan.y.toFixed(0)} · 1:1 model</div>}
    </main>
  );
}
