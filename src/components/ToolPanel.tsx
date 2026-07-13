"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  Box,
  Check,
  Crop,
  FlipHorizontal2,
  FlipVertical2,
  ImagePlus,
  LoaderCircle,
  Move3D,
  RotateCcw,
  RotateCw,
  Ruler,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { createSamplePackageImage } from "../lib/sample-image";
import { TEMPLATES, getTemplate } from "../domain/templates";
import type { TemplateId } from "../domain/types";
import { fromMillimetres, toMillimetres } from "../domain/units";
import { useProjectStore } from "../store/project-store";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const readableKey = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());

const toolButtons = ["Select", "Corner", "Edge", "Face", "Calibration", "Guide"];

export function ToolPanel({ inert = false }: { inert?: boolean }) {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [calibrationLength, setCalibrationLength] = useState("80");
  const {
    stage,
    unit,
    imageDataUrl,
    analysis,
    analysisRunning,
    analysisError,
    preprocess,
    templateId,
    dimensions,
    selectedTool,
    setImage,
    clearImage,
    runAnalysis,
    cancelAnalysis,
    setPreprocess,
    setTemplate,
    setTool,
    updateDimension,
    confirmDimensions,
    approveFace,
    generate,
    showNotice,
    beginOperation,
    updateOperation,
    completeOperation,
    failOperation,
  } = useProjectStore();

  const loadFile = async (file: File) => {
    setFileError(null);
    if (!ACCEPTED_TYPES.has(file.type)) {
      setFileError("Use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("The image is larger than the 25 MiB safety limit.");
      return;
    }
    const operationId = beginOperation("image-load", "Loading source image", "Reading image file", file.name);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error ?? new Error("The image file could not be read."));
        reader.readAsDataURL(file);
      });
      updateOperation(operationId, { phase: "processing", progress: 0.55, status: "Decoding image dimensions" });
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();
      if (pixels > 50_000_000) throw new Error("The decoded image exceeds 50 megapixels. Resize it before uploading.");
      updateOperation(operationId, { phase: "processing", progress: 0.85, status: "Preparing local workspace" });
      setImage(dataUrl, file.name, file.type);
      completeOperation(operationId, "Source image ready");
      showNotice("success", `${file.name} loaded. The original remains on this device.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The image could not be loaded.";
      setFileError(message);
      failOperation(operationId, message);
      showNotice("error", message);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadFile(file);
  };

  const loadSample = () => {
    setImage(createSamplePackageImage(), "sample-rectangular-carton.png", "image/png");
    window.setTimeout(() => void runAnalysis(), 50);
  };

  const measurementKeys = getTemplate(templateId).required.filter((key) => !["materialThickness", "foldAllowance"].includes(key));

  return (
    <aside id="workflow-tools-panel" className="tool-panel" aria-label="Workflow tools" inert={inert || undefined}>
      <section className="panel-section upload-section">
        <div className="section-heading"><span><ImagePlus size={16} /> Source image</span><span className="section-step">01</span></div>
        {!imageDataUrl ? (
          <>
            <div
              className={`dropzone ${dragging ? "dragging" : ""}`}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInput.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.current?.click(); } }}
            >
              <div className="dropzone-icon"><ImagePlus size={23} /></div>
              <strong>Drop package image</strong>
              <span>JPG, PNG or WEBP · 25 MiB max</span>
              <span className="secondary-button dropzone-browse" aria-hidden="true">Browse files</span>
            </div>
            <input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }} />
            <button className="sample-button" onClick={loadSample}><Sparkles size={15} /> Load guided sample project</button>
            {fileError && <div className="inline-error"><X size={14} /> {fileError}</div>}
          </>
        ) : (
          <div className="uploaded-file">
            <div className="file-thumbnail"><Box size={23} /></div>
            <div><strong>Source ready</strong><span>Stored only in this project</span></div>
            <button title="Remove source" onClick={clearImage}><X size={15} /></button>
          </div>
        )}
      </section>

      {imageDataUrl && (
        <section className="panel-section">
          <div className="section-heading"><span><SlidersHorizontal size={16} /> Prepare image</span><span className="section-step">02</span></div>
          <div className="compact-tool-grid">
            <button title="Rotate left" onClick={() => setPreprocess({ rotation: preprocess.rotation - 90 })}><RotateCcw size={15} /><span>Left</span></button>
            <button title="Rotate right" onClick={() => setPreprocess({ rotation: preprocess.rotation + 90 })}><RotateCw size={15} /><span>Right</span></button>
            <button title="Flip horizontally" className={preprocess.flipX ? "active" : ""} onClick={() => setPreprocess({ flipX: !preprocess.flipX })}><FlipHorizontal2 size={15} /><span>Flip H</span></button>
            <button title="Flip vertically" className={preprocess.flipY ? "active" : ""} onClick={() => setPreprocess({ flipY: !preprocess.flipY })}><FlipVertical2 size={15} /><span>Flip V</span></button>
            <button title="Crop mode" onClick={() => setTool("Crop")}><Crop size={15} /><span>Crop</span></button>
            <button title="Perspective correction" onClick={() => setTool("Perspective")}><Move3D size={15} /><span>Correct</span></button>
          </div>
          {(["brightness", "contrast", "saturation"] as const).map((key) => (
            <label className="range-row" key={key}>
              <span>{readableKey(key)}</span>
              <input type="range" min="50" max="150" value={preprocess[key]} onChange={(event) => setPreprocess({ [key]: Number(event.target.value) })} />
              <output>{preprocess[key]}%</output>
            </label>
          ))}
          <div className="preview-toggles">
            <button className={preprocess.grayscale ? "active" : ""} onClick={() => setPreprocess({ grayscale: !preprocess.grayscale })}>Grayscale</button>
            <button className={preprocess.threshold ? "active" : ""} onClick={() => setPreprocess({ threshold: !preprocess.threshold })}>Threshold</button>
            <button className={preprocess.edgePreview ? "active" : ""} onClick={() => setPreprocess({ edgePreview: !preprocess.edgePreview })}>Edges</button>
          </div>
          <button className="ghost-button full-width" onClick={() => setPreprocess({ rotation: 0, flipX: false, flipY: false, brightness: 100, contrast: 100, saturation: 100, grayscale: false, threshold: false, edgePreview: false })}><RotateCcw size={14} /> Reset preparation</button>
        </section>
      )}

      {imageDataUrl && (
        <section className="panel-section">
          <div className="section-heading"><span><ScanLine size={16} /> Detect package</span><span className="section-step">03</span></div>
          {!analysisRunning ? (
            <button className="primary-button full-width" onClick={() => void runAnalysis()}><WandSparkles size={16} /> {analysis ? "Rerun local analysis" : "Analyse image locally"}</button>
          ) : (
            <button className="danger-button full-width" onClick={cancelAnalysis}><LoaderCircle size={16} className="spin" /> Cancel processing</button>
          )}
          <p className="privacy-note">OpenCV/WASM and deterministic contour analysis run on this device.</p>
          {analysisError && <div className="inline-error">{analysisError}</div>}
          {analysis && (
            <div className="candidate-list">
              {analysis.candidates.map((candidate) => (
                <button key={candidate.templateId} className={templateId === candidate.templateId ? "selected" : ""} onClick={() => setTemplate(candidate.templateId)}>
                  <span><strong>{candidate.label}</strong><small>{candidate.reasons[0]}</small></span>
                  <b>{Math.round(candidate.confidence * 100)}%</b>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {analysis && (
        <section className="panel-section">
          <div className="section-heading"><span><CrosshairIcon /> Correct structure</span><span className="section-step">04</span></div>
          <div className="annotation-tools">
            {toolButtons.map((tool) => <button key={tool} className={selectedTool === tool ? "active" : ""} onClick={() => setTool(tool)}>{tool}</button>)}
          </div>
          {analysis.faces.map((face) => (
            <div className="face-review" key={face.id}>
              <span><strong>{readableKey(face.label)} face</strong><small>{Math.round(face.confidence * 100)}% confidence</small></span>
              <button className={face.approved ? "approved" : ""} onClick={() => approveFace(face.id)}><Check size={14} /> {face.approved ? "Approved" : "Approve"}</button>
            </div>
          ))}
        </section>
      )}

      {(stage >= 3 || analysis) && (
        <section className="panel-section">
          <div className="section-heading"><span><Ruler size={16} /> Measurements</span><span className="section-step">05</span></div>
          <div className="calibration-card">
            <strong>Known edge calibration</strong>
            <p>Select an annotated edge, then enter its real length.</p>
            <label><span>Edge length</span><div><input value={calibrationLength} inputMode="decimal" onChange={(event) => setCalibrationLength(event.target.value)} /><b>{unit}</b></div></label>
            <button onClick={() => updateDimension("width", toMillimetres(Number(calibrationLength) || 0, unit))}>Apply to front width</button>
          </div>
          <label className="field-label">Package template</label>
          <select value={templateId} onChange={(event) => setTemplate(event.target.value as TemplateId)}>
            {TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
          <div className="dimension-grid">
            {measurementKeys.map((key) => (
              <label key={key}>
                <span>{readableKey(key)} <i className={`provenance provenance-${dimensions[key].provenance}`}>{dimensions[key].provenance}</i></span>
                <div><input type="number" min="0" step="0.1" value={Number(fromMillimetres(dimensions[key].valueMm, unit).toFixed(3))} onChange={(event) => updateDimension(key, toMillimetres(Number(event.target.value), unit))} /><b>{unit}</b></div>
              </label>
            ))}
          </div>
          <button className="secondary-button full-width" onClick={confirmDimensions}><Check size={15} /> Confirm required measurements</button>
          <button className="primary-button full-width" onClick={generate}><Box size={16} /> Generate 1:1 dieline</button>
        </section>
      )}
    </aside>
  );
}

function CrosshairIcon() {
  return <span aria-hidden="true" className="crosshair-mini">+</span>;
}
