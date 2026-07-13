export type Unit = "mm" | "cm" | "in" | "pt";

export type OperationKind = "image-load" | "analysis" | "project-open" | "project-save" | "validation" | "export";

export type OperationPhase =
  | "preparing"
  | "validating"
  | "processing"
  | "encoding"
  | "saving"
  | "complete"
  | "cancelled"
  | "error";

export interface OperationState {
  id: string;
  kind: OperationKind;
  phase: OperationPhase;
  label: string;
  status: string;
  progress: number;
  filename?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export type ExportFormat = "svg" | "pdf" | "dxf" | "png" | "jpg" | "json" | "project";

export interface ExportRequest {
  format: ExportFormat;
  filename: string;
  svgOptions?: SvgExportSettings;
}

export interface SvgExportSettings {
  unit: Unit;
  includeMeasurements: boolean;
  includeLabels: boolean;
  includeBleed: boolean;
  includeSafeArea: boolean;
  includeGuides: boolean;
  includeLegend: boolean;
  includeArtboard: boolean;
}

export interface ExportProgress {
  phase: OperationPhase;
  progress: number;
  status: string;
}

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  bytes: number;
  destination: "download" | "desktop";
}

export interface FileSaveAdapter {
  save(blob: Blob, filename: string, description?: string): Promise<{ filename: string; destination: "download" | "desktop"; cancelled: boolean }>;
}

export type Provenance =
  | "confirmed"
  | "manual"
  | "calculated"
  | "estimated"
  | "inferred";

export type ConfidenceLabel = "high" | "medium" | "low" | "manual";

export interface Point {
  x: number;
  y: number;
}

export interface MeasurementValue {
  valueMm: number;
  displayUnit: Unit;
  provenance: Provenance;
  confidence?: number;
  sourceRef?: string;
}

export type EdgeKind =
  | "cut"
  | "crease"
  | "perforation"
  | "guide"
  | "hidden";

export interface AnnotationPoint extends Point {
  id: string;
  locked?: boolean;
  confidence: number;
}

export interface AnnotationEdge {
  id: string;
  startId: string;
  endId: string;
  kind: EdgeKind;
  confidence: number;
}

export interface DetectedFace {
  id: string;
  label: "front" | "back" | "left" | "right" | "top" | "bottom" | "unknown";
  pointIds: string[];
  confidence: number;
  approved: boolean;
}

export interface PackageCandidate {
  templateId: TemplateId;
  label: string;
  confidence: number;
  reasons: string[];
}

export interface QualityMetrics {
  width: number;
  height: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  foregroundCoverage: number;
}

export interface AnalysisWarning {
  id: string;
  severity: "warning" | "information";
  title: string;
  detail: string;
  recommendation: string;
}

export interface ImageAnalysis {
  version: 1;
  analysisVersion: "1.0.0";
  transformStack: Array<{ operation: string; values: number[] }>;
  workingImage: { width: number; height: number; scaleFromOriginal: number; maxDimension: number };
  points: AnnotationPoint[];
  normalizedCorners: AnnotationPoint[];
  edges: AnnotationEdge[];
  faces: DetectedFace[];
  vanishingDirections: Array<{ id: string; direction: Point; confidence: number }>;
  rectificationMatrices: Array<{ faceId: string; matrix3x3: number[]; confidence: number }>;
  candidates: PackageCandidate[];
  quality: QualityMetrics;
  warnings: AnalysisWarning[];
  confidence: number;
  processedAt: string;
  method: "local-gradient-and-contour" | "manual";
}

export type TemplateId =
  | "rectangular-carton"
  | "cube-box"
  | "straight-tuck-end"
  | "reverse-tuck-end"
  | "simple-sleeve"
  | "basic-mailer"
  | "triangular-closure"
  | "custom";

export interface PackageDimensions {
  width: MeasurementValue;
  height: MeasurementValue;
  depth: MeasurementValue;
  topFlap: MeasurementValue;
  bottomFlap: MeasurementValue;
  glueFlap: MeasurementValue;
  dustFlap: MeasurementValue;
  lockingTab: MeasurementValue;
  bleed: MeasurementValue;
  safeMargin: MeasurementValue;
  materialThickness: MeasurementValue;
  foldAllowance: MeasurementValue;
}

export interface PanelGeometry {
  id: string;
  name: string;
  role: "front" | "back" | "left" | "right" | "top" | "bottom" | "flap" | "glue";
  points: Point[];
  locked: boolean;
}

export interface VectorPath {
  id: string;
  name: string;
  kind: EdgeKind | "bleed" | "safe" | "measurement" | "artboard";
  points: Point[];
  closed: boolean;
  panelId?: string;
}

export interface LayerDefinition {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  exportable: boolean;
}

export interface Artboard {
  widthMm: number;
  heightMm: number;
  paddingMm: number;
}

export interface DielineModel {
  version: 1;
  id: string;
  templateId: TemplateId;
  templateVersion: number;
  customMode: boolean;
  parameters: PackageDimensions;
  nonstructuralOverrides: Record<string, unknown>;
  panels: PanelGeometry[];
  paths: VectorPath[];
  layers: LayerDefinition[];
  artboard: Artboard;
  scale: number;
  generatedAt: string;
}

export type ValidationSeverity = "error" | "warning" | "recommendation" | "information";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  ruleId: string;
  title: string;
  message: string;
  repair: string;
  objectIds: string[];
}

export interface PreprocessSettings {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  grayscale: boolean;
  threshold: boolean;
  edgePreview: boolean;
}

export interface ProjectDocument {
  schemaVersion: number;
  application: "Perspective Dieline Generator";
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  stage: number;
  templateId: TemplateId;
  dimensions: PackageDimensions;
  preprocess: PreprocessSettings;
  analysis: ImageAnalysis | null;
  dieline: DielineModel | null;
  sourceImage?: {
    filename: string;
    mimeType: string;
    assetPath: string;
  };
  display: {
    unit: Unit;
    scale: number;
    theme: "light" | "dark";
    decimalPrecision: number;
  };
}

export interface TemplateDefinition {
  id: TemplateId;
  version: number;
  name: string;
  description: string;
  family: string;
  parameterSchema: Partial<Record<keyof PackageDimensions, { label: string; minMm: number; maxMm: number }>>;
  constraints: string[];
  required: Array<keyof PackageDimensions>;
  scoreCandidate(analysis: ImageAnalysis): number;
  generate(dimensions: PackageDimensions): DielineModel;
  validateDimensions(dimensions: PackageDimensions): string[];
}

export const confidenceLabel = (score: number, manualRequired = false): ConfidenceLabel => {
  if (manualRequired || score < 0.35) return "manual";
  if (score >= 0.8) return "high";
  if (score >= 0.55) return "medium";
  return "low";
};

export const DEFAULT_LAYERS: LayerDefinition[] = [
  { id: "artboard", name: "Artboard", visible: true, locked: true, exportable: true },
  { id: "original-image", name: "Original image", visible: true, locked: true, exportable: false },
  { id: "detection-overlay", name: "Detection overlay", visible: true, locked: false, exportable: false },
  { id: "corrected-faces", name: "Corrected faces", visible: true, locked: false, exportable: false },
  { id: "panel-geometry", name: "Panel geometry", visible: true, locked: false, exportable: true },
  { id: "cut-lines", name: "Cut lines", visible: true, locked: false, exportable: true },
  { id: "crease-lines", name: "Crease lines", visible: true, locked: false, exportable: true },
  { id: "perforation-lines", name: "Perforation lines", visible: true, locked: false, exportable: true },
  { id: "glue-flaps", name: "Glue flaps", visible: true, locked: false, exportable: true },
  { id: "bleed-area", name: "Bleed area", visible: true, locked: false, exportable: true },
  { id: "safe-area", name: "Safe area", visible: true, locked: false, exportable: true },
  { id: "measurements", name: "Measurements", visible: true, locked: false, exportable: true },
  { id: "labels", name: "Labels", visible: true, locked: false, exportable: true },
  { id: "guides", name: "Guides", visible: true, locked: false, exportable: false },
];
