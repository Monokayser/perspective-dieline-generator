"use client";

import { create } from "zustand";
import { analyseImage, AnalysisCancelledError, cancelAnalysis } from "../lib/analysis-client";
import { createDefaultDimensions, DEFAULT_PREPROCESS } from "../domain/defaults";
import { generateDieline, getTemplate } from "../domain/templates";
import type {
  DielineModel,
  EdgeKind,
  ImageAnalysis,
  OperationKind,
  OperationState,
  PackageDimensions,
  PreprocessSettings,
  ProjectDocument,
  TemplateId,
  Unit,
  ValidationIssue,
} from "../domain/types";
import { validateDieline } from "../domain/validation";

export const WORKFLOW_STAGES = ["Upload", "Detect", "Correct", "Measure", "Generate", "Edit", "Validate", "Export"] as const;

type Snapshot = {
  dimensions: PackageDimensions;
  dieline: DielineModel | null;
  templateId: TemplateId;
};

type Notice = { id: string; tone: "success" | "warning" | "error" | "info"; message: string };

type LoadProjectOptions = { readOnly?: boolean; sourceSchemaVersion?: number; sourcePath?: string };

type ProjectStore = {
  projectId: string;
  projectName: string;
  createdAt: string;
  stage: number;
  maxStage: number;
  theme: "light" | "dark";
  unit: Unit;
  decimalPrecision: number;
  templateId: TemplateId;
  dimensions: PackageDimensions;
  preprocess: PreprocessSettings;
  imageDataUrl: string | null;
  imageFilename: string | null;
  imageMimeType: string | null;
  analysis: ImageAnalysis | null;
  analysisProgress: number;
  analysisStage: string;
  analysisRunning: boolean;
  analysisError: string | null;
  dieline: DielineModel | null;
  validationIssues: ValidationIssue[];
  selectedObjectId: string | null;
  selectedTool: string;
  zoom: number;
  pan: { x: number; y: number };
  history: Snapshot[];
  future: Snapshot[];
  notice: Notice | null;
  dirty: boolean;
  readOnly: boolean;
  sourceSchemaVersion: number;
  projectFilePath: string | null;
  operation: OperationState | null;
  setProjectName(name: string): void;
  setStage(stage: number): void;
  setTheme(theme: "light" | "dark"): void;
  setUnit(unit: Unit): void;
  setTemplate(templateId: TemplateId): void;
  setPreprocess(patch: Partial<PreprocessSettings>): void;
  setImage(dataUrl: string, filename: string, mimeType: string): void;
  clearImage(): void;
  runAnalysis(): Promise<void>;
  cancelAnalysis(): void;
  updateAnnotationPoint(id: string, x: number, y: number): void;
  approveFace(id: string): void;
  updateDimension(key: keyof PackageDimensions, valueMm: number): void;
  confirmDimensions(): void;
  generate(): boolean;
  regenerate(): boolean;
  validate(): ValidationIssue[];
  toggleLayer(id: string, field: "visible" | "locked" | "exportable"): void;
  selectObject(id: string | null): void;
  moveSelected(dx: number, dy: number): void;
  rotateSelected(degrees: number): void;
  duplicateSelected(): void;
  deleteSelected(): void;
  setSelectedPathKind(kind: EdgeKind): void;
  setTool(tool: string): void;
  setZoom(zoom: number): void;
  setPan(x: number, y: number): void;
  undo(): void;
  redo(): void;
  dismissNotice(): void;
  showNotice(tone: Notice["tone"], message: string): void;
  beginOperation(kind: OperationKind, label: string, status: string, filename?: string): string;
  updateOperation(id: string, patch: Partial<Pick<OperationState, "phase" | "progress" | "status" | "filename" | "error">>): void;
  completeOperation(id: string, status: string): void;
  failOperation(id: string, message: string): void;
  clearOperation(): void;
  markSaved(): void;
  setProjectFilePath(path: string | null): void;
  resetProject(): void;
  loadProject(document: ProjectDocument, imageDataUrl?: string, options?: LoadProjectOptions): void;
  toDocument(): ProjectDocument;
};

const cloneDimensions = (dimensions: PackageDimensions) => structuredClone(dimensions);
const cloneModel = (model: DielineModel | null) => model ? structuredClone(model) : null;

const snapshot = (state: Pick<ProjectStore, "dimensions" | "dieline" | "templateId">): Snapshot => ({
  dimensions: cloneDimensions(state.dimensions),
  dieline: cloneModel(state.dieline),
  templateId: state.templateId,
});

const createIdentity = () => ({
  projectId: crypto.randomUUID(),
  projectName: "Untitled package",
  createdAt: new Date().toISOString(),
});

const initialIdentity = createIdentity();

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialIdentity,
  stage: 0,
  maxStage: 0,
  theme: "dark",
  unit: "mm",
  decimalPrecision: 2,
  templateId: "rectangular-carton",
  dimensions: createDefaultDimensions(),
  preprocess: { ...DEFAULT_PREPROCESS },
  imageDataUrl: null,
  imageFilename: null,
  imageMimeType: null,
  analysis: null,
  analysisProgress: 0,
  analysisStage: "Ready",
  analysisRunning: false,
  analysisError: null,
  dieline: null,
  validationIssues: [],
  selectedObjectId: null,
  selectedTool: "Select",
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  future: [],
  notice: null,
  dirty: false,
  readOnly: false,
  sourceSchemaVersion: 1,
  projectFilePath: null,
  operation: null,

  setProjectName: (projectName) => {
    if (get().readOnly) return;
    set({ projectName: projectName.slice(0, 160), dirty: true });
  },
  setStage: (stage) => {
    const next = Math.max(0, Math.min(7, stage));
    if (next <= get().maxStage) set({ stage: next });
  },
  setTheme: (theme) => {
    localStorage.setItem("pdg-theme", theme);
    set({ theme });
  },
  setUnit: (unit) => set({ unit, dirty: true }),
  setTemplate: (templateId) => {
    const state = get();
    if (state.readOnly) return;
    set({
      history: [...state.history.slice(-99), snapshot(state)],
      future: [],
      templateId,
      dieline: null,
      validationIssues: [],
      dirty: true,
    });
  },
  setPreprocess: (patch) => set((state) => state.readOnly ? state : ({ preprocess: { ...state.preprocess, ...patch }, dirty: true })),
  setImage: (imageDataUrl, imageFilename, imageMimeType) => {
    if (get().readOnly) return;
    set({
    imageDataUrl,
    imageFilename,
    imageMimeType,
    stage: 1,
    maxStage: Math.max(1, get().maxStage),
    analysis: null,
    dieline: null,
    validationIssues: [],
    analysisError: null,
    dirty: true,
    });
  },
  clearImage: () => {
    if (get().readOnly) return;
    set({
    imageDataUrl: null,
    imageFilename: null,
    imageMimeType: null,
    analysis: null,
    dieline: null,
    stage: 0,
    maxStage: 0,
    validationIssues: [],
    dirty: true,
    });
  },
  runAnalysis: async () => {
    if (get().readOnly) return;
    const imageDataUrl = get().imageDataUrl;
    if (!imageDataUrl) {
      set({ notice: { id: crypto.randomUUID(), tone: "warning", message: "Upload an image before running detection." } });
      return;
    }
    const operationId = get().beginOperation("analysis", "Analysing package image", "Starting local analysis");
    set({ analysisRunning: true, analysisProgress: 0, analysisStage: "Starting local analysis", analysisError: null, stage: 1 });
    try {
      const analysis = await analyseImage(imageDataUrl, (analysisProgress, analysisStage) => {
        set({ analysisProgress, analysisStage });
        get().updateOperation(operationId, { phase: "processing", progress: analysisProgress, status: analysisStage });
      });
      const topCandidate = analysis.candidates[0]?.templateId;
      set({
        analysis,
        templateId: topCandidate && topCandidate !== "custom" ? topCandidate : get().templateId,
        analysisRunning: false,
        analysisProgress: 1,
        analysisStage: "Analysis complete",
        stage: 2,
        maxStage: Math.max(3, get().maxStage),
        notice: { id: crypto.randomUUID(), tone: analysis.confidence >= 0.55 ? "success" : "warning", message: analysis.confidence >= 0.55 ? "Package structure detected locally." : "Detection needs manual confirmation." },
        dirty: true,
      });
      get().completeOperation(operationId, "Package analysis complete");
    } catch (error) {
      if (error instanceof AnalysisCancelledError) {
        set({ analysisRunning: false, analysisStage: "Analysis cancelled", analysisError: null });
        get().updateOperation(operationId, { phase: "cancelled", progress: get().analysisProgress, status: "Analysis cancelled" });
        return;
      }
      const message = error instanceof Error ? error.message : "Image analysis failed.";
      set({ analysisRunning: false, analysisError: message, analysisStage: "Manual correction available", maxStage: Math.max(3, get().maxStage), notice: { id: crypto.randomUUID(), tone: "error", message } });
      get().failOperation(operationId, message);
    }
  },
  cancelAnalysis: () => {
    cancelAnalysis();
    set({ analysisRunning: false, analysisStage: "Analysis cancelled", notice: { id: crypto.randomUUID(), tone: "info", message: "Analysis cancelled. Existing annotations were preserved." } });
  },
  updateAnnotationPoint: (id, x, y) => set((state) => {
    if (!state.analysis || state.readOnly) return state;
    return {
      analysis: {
        ...state.analysis,
        points: state.analysis.points.map((point) => point.id === id ? { ...point, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)), confidence: 1 } : point),
      },
      dirty: true,
    };
  }),
  approveFace: (id) => set((state) => state.analysis && !state.readOnly ? ({
    analysis: { ...state.analysis, faces: state.analysis.faces.map((face) => face.id === id ? { ...face, approved: true, confidence: 1 } : face) },
    maxStage: Math.max(3, state.maxStage),
    stage: 3,
    dirty: true,
  }) : state),
  updateDimension: (key, valueMm) => {
    if (!Number.isFinite(valueMm) || valueMm < 0) return;
    const state = get();
    if (state.readOnly) return;
    const dimensions = cloneDimensions(state.dimensions);
    dimensions[key] = { ...dimensions[key], valueMm, provenance: "manual", confidence: undefined };
    set({
      history: [...state.history.slice(-99), snapshot(state)],
      future: [],
      dimensions,
      dieline: state.dieline ? generateDieline(state.templateId, dimensions) : null,
      validationIssues: [],
      dirty: true,
    });
  },
  confirmDimensions: () => set((state) => state.readOnly ? state : ({
    dimensions: Object.fromEntries(Object.entries(state.dimensions).map(([key, measurement]) => [key, { ...measurement, provenance: "confirmed", confidence: 1 }])) as unknown as PackageDimensions,
    maxStage: Math.max(4, state.maxStage),
    stage: 4,
    notice: { id: crypto.randomUUID(), tone: "success", message: "Measurements confirmed. The template can now generate at 1:1 scale." },
    dirty: true,
  })),
  generate: () => {
    const state = get();
    if (state.readOnly) return false;
    const template = getTemplate(state.templateId);
    const unconfirmed = template.required.filter((key) => state.dimensions[key].provenance !== "confirmed");
    const dimensionErrors = template.validateDimensions(state.dimensions);
    if (unconfirmed.length > 0 || dimensionErrors.length > 0) {
      set({ notice: { id: crypto.randomUUID(), tone: "warning", message: unconfirmed.length > 0 ? `Confirm ${unconfirmed.length} required measurement${unconfirmed.length === 1 ? "" : "s"} before generating.` : dimensionErrors[0] } });
      return false;
    }
    const dieline = template.generate(state.dimensions);
    const issues = validateDieline(dieline);
    set({
      history: [...state.history.slice(-99), snapshot(state)],
      future: [],
      dieline,
      validationIssues: issues,
      stage: 5,
      maxStage: 7,
      selectedObjectId: null,
      notice: { id: crypto.randomUUID(), tone: "success", message: `${template.name} generated as editable vector geometry.` },
      dirty: true,
    });
    return true;
  },
  regenerate: () => get().generate(),
  validate: () => {
    const validationIssues = validateDieline(get().dieline);
    set({ validationIssues, stage: get().dieline ? 6 : get().stage, notice: { id: crypto.randomUUID(), tone: validationIssues.some((item) => item.severity === "error") ? "error" : "success", message: validationIssues.some((item) => item.severity === "error") ? "Validation found blocking geometry errors." : "Validation completed. No blocking geometry errors." } });
    return validationIssues;
  },
  toggleLayer: (id, field) => set((state) => state.dieline && !state.readOnly ? ({
    dieline: { ...state.dieline, layers: state.dieline.layers.map((layer) => layer.id === id ? { ...layer, [field]: !layer[field] } : layer) },
    dirty: true,
  }) : state),
  selectObject: (selectedObjectId) => set({ selectedObjectId }),
  moveSelected: (dx, dy) => set((state) => {
    if (!state.dieline || !state.selectedObjectId || state.readOnly) return state;
    const move = <T extends { id: string; points: Array<{ x: number; y: number }> }>(object: T): T => object.id === state.selectedObjectId
      ? { ...object, points: object.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) }
      : object;
    return {
      dieline: { ...state.dieline, customMode: true, panels: state.dieline.panels.map(move), paths: state.dieline.paths.map(move) },
      validationIssues: [],
      dirty: true,
    };
  }),
  rotateSelected: (degrees) => set((state) => {
    if (!state.dieline || !state.selectedObjectId || state.readOnly) return state;
    const rotate = <T extends { id: string; points: Array<{ x: number; y: number }> }>(object: T): T => {
      if (object.id !== state.selectedObjectId) return object;
      const cx = object.points.reduce((sum, point) => sum + point.x, 0) / object.points.length;
      const cy = object.points.reduce((sum, point) => sum + point.y, 0) / object.points.length;
      const radians = degrees * Math.PI / 180;
      return {
        ...object,
        points: object.points.map((point) => ({
          x: cx + (point.x - cx) * Math.cos(radians) - (point.y - cy) * Math.sin(radians),
          y: cy + (point.x - cx) * Math.sin(radians) + (point.y - cy) * Math.cos(radians),
        })),
      };
    };
    return { dieline: { ...state.dieline, customMode: true, panels: state.dieline.panels.map(rotate), paths: state.dieline.paths.map(rotate) }, validationIssues: [], dirty: true };
  }),
  duplicateSelected: () => set((state) => {
    if (!state.dieline || !state.selectedObjectId || state.readOnly) return state;
    const panel = state.dieline.panels.find((object) => object.id === state.selectedObjectId);
    const path = state.dieline.paths.find((object) => object.id === state.selectedObjectId);
    if (!panel && !path) return state;
    const nextId = `${state.selectedObjectId}-copy-${Date.now().toString(36)}`;
    return {
      dieline: {
        ...state.dieline,
        customMode: true,
        panels: panel ? [...state.dieline.panels, { ...structuredClone(panel), id: nextId, name: `${panel.name} copy`, points: panel.points.map((point) => ({ x: point.x + 5, y: point.y + 5 })) }] : state.dieline.panels,
        paths: path ? [...state.dieline.paths, { ...structuredClone(path), id: nextId, name: `${path.name} copy`, points: path.points.map((point) => ({ x: point.x + 5, y: point.y + 5 })) }] : state.dieline.paths,
      },
      selectedObjectId: nextId,
      validationIssues: [],
      dirty: true,
    };
  }),
  deleteSelected: () => set((state) => {
    if (!state.dieline || !state.selectedObjectId || state.readOnly) return state;
    return {
      dieline: { ...state.dieline, customMode: true, panels: state.dieline.panels.filter((panel) => panel.id !== state.selectedObjectId), paths: state.dieline.paths.filter((path) => path.id !== state.selectedObjectId) },
      selectedObjectId: null,
      validationIssues: [],
      dirty: true,
    };
  }),
  setSelectedPathKind: (kind) => set((state) => {
    if (!state.dieline || !state.selectedObjectId || state.readOnly) return state;
    return {
      dieline: { ...state.dieline, customMode: true, paths: state.dieline.paths.map((path) => path.id === state.selectedObjectId ? { ...path, kind } : path) },
      validationIssues: [],
      dirty: true,
    };
  }),
  setTool: (selectedTool) => set({ selectedTool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.2, Math.min(5, zoom)) }),
  setPan: (x, y) => set({ pan: { x, y } }),
  undo: () => {
    const state = get();
    if (state.readOnly) return;
    const previous = state.history.at(-1);
    if (!previous) return;
    set({
      dimensions: cloneDimensions(previous.dimensions),
      dieline: cloneModel(previous.dieline),
      templateId: previous.templateId,
      history: state.history.slice(0, -1),
      future: [snapshot(state), ...state.future].slice(0, 100),
      dirty: true,
    });
  },
  redo: () => {
    const state = get();
    if (state.readOnly) return;
    const next = state.future[0];
    if (!next) return;
    set({
      dimensions: cloneDimensions(next.dimensions),
      dieline: cloneModel(next.dieline),
      templateId: next.templateId,
      history: [...state.history, snapshot(state)].slice(-100),
      future: state.future.slice(1),
      dirty: true,
    });
  },
  dismissNotice: () => set({ notice: null }),
  showNotice: (tone, message) => set({ notice: { id: crypto.randomUUID(), tone, message } }),
  beginOperation: (kind, label, status, filename) => {
    const id = crypto.randomUUID();
    set({ operation: { id, kind, phase: "preparing", label, status, progress: 0, filename, startedAt: new Date().toISOString() } });
    return id;
  },
  updateOperation: (id, patch) => set((state) => state.operation?.id === id
    ? { operation: { ...state.operation, ...patch, progress: patch.progress === undefined ? state.operation.progress : Math.max(0, Math.min(1, patch.progress)) } }
    : state),
  completeOperation: (id, status) => set((state) => state.operation?.id === id ? ({ operation: { ...state.operation, phase: "complete", progress: 1, status, completedAt: new Date().toISOString() } }) : state),
  failOperation: (id, message) => set((state) => state.operation?.id === id ? ({ operation: { ...state.operation, phase: "error", status: "Operation failed", error: message, completedAt: new Date().toISOString() } }) : state),
  clearOperation: () => set({ operation: null }),
  markSaved: () => set({ dirty: false }),
  setProjectFilePath: (projectFilePath) => set({ projectFilePath }),
  resetProject: () => {
    const identity = createIdentity();
    set({
      ...identity,
      stage: 0,
      maxStage: 0,
      templateId: "rectangular-carton",
      dimensions: createDefaultDimensions(),
      preprocess: { ...DEFAULT_PREPROCESS },
      imageDataUrl: null,
      imageFilename: null,
      imageMimeType: null,
      analysis: null,
      dieline: null,
      validationIssues: [],
      history: [],
      future: [],
      selectedObjectId: null,
      notice: { id: crypto.randomUUID(), tone: "info", message: "New local project created." },
      dirty: false,
      readOnly: false,
      sourceSchemaVersion: 1,
      projectFilePath: null,
      operation: null,
    });
  },
  loadProject: (document, imageDataUrl, options = {}) => set({
    projectId: document.projectId,
    projectName: document.projectName,
    createdAt: document.createdAt,
    stage: document.stage,
    maxStage: document.dieline ? 7 : document.analysis ? 4 : document.sourceImage ? 1 : 0,
    theme: document.display.theme,
    unit: document.display.unit,
    decimalPrecision: document.display.decimalPrecision,
    templateId: document.templateId,
    dimensions: document.dimensions,
    preprocess: document.preprocess,
    imageDataUrl: imageDataUrl ?? null,
    imageFilename: document.sourceImage?.filename ?? null,
    imageMimeType: document.sourceImage?.mimeType ?? null,
    analysis: document.analysis,
    dieline: document.dieline,
    validationIssues: validateDieline(document.dieline),
    history: [],
    future: [],
    dirty: false,
    readOnly: options.readOnly ?? false,
    sourceSchemaVersion: options.sourceSchemaVersion ?? document.schemaVersion,
    projectFilePath: options.sourcePath ?? null,
    notice: { id: crypto.randomUUID(), tone: options.readOnly ? "warning" : "success", message: options.readOnly ? `${document.projectName} opened read-only because it uses project schema ${options.sourceSchemaVersion ?? document.schemaVersion}.` : `${document.projectName} opened locally.` },
  }),
  toDocument: () => {
    const state = get();
    return {
      schemaVersion: 1,
      application: "Perspective Dieline Generator",
      projectId: state.projectId,
      projectName: state.projectName,
      createdAt: state.createdAt,
      updatedAt: new Date().toISOString(),
      stage: state.stage,
      templateId: state.templateId,
      dimensions: cloneDimensions(state.dimensions),
      preprocess: { ...state.preprocess },
      analysis: state.analysis ? structuredClone(state.analysis) : null,
      dieline: cloneModel(state.dieline),
      sourceImage: state.imageFilename && state.imageMimeType ? { filename: state.imageFilename, mimeType: state.imageMimeType, assetPath: `assets/source.${state.imageMimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin"}` } : undefined,
      display: { unit: state.unit, scale: state.dieline?.scale ?? 1, theme: state.theme, decimalPrecision: state.decimalPrecision },
    };
  },
}));
