import type { DielineModel, Point, ValidationIssue, VectorPath } from "./types";

const issue = (
  severity: ValidationIssue["severity"],
  ruleId: string,
  title: string,
  message: string,
  repair: string,
  objectIds: string[] = [],
): ValidationIssue => ({ id: `${ruleId}-${objectIds.join("-") || "project"}`, severity, ruleId, title, message, repair, objectIds });

const orientation = (a: Point, b: Point, c: Point) =>
  Math.sign((b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y));

const segmentsIntersect = (a: Point, b: Point, c: Point, d: Point) => {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 !== o2 && o3 !== o4;
};

const hasSelfIntersection = (path: VectorPath) => {
  if (!path.closed || path.points.length < 4) return false;
  const segments = path.points.map((point, index) => [point, path.points[(index + 1) % path.points.length]] as const);
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 2; j < segments.length; j += 1) {
      if (i === 0 && j === segments.length - 1) continue;
      if (segmentsIntersect(segments[i][0], segments[i][1], segments[j][0], segments[j][1])) return true;
    }
  }
  return false;
};

const pointKey = (point: Point) => `${point.x.toFixed(4)},${point.y.toFixed(4)}`;

export const validateDieline = (model: DielineModel | null): ValidationIssue[] => {
  if (!model) {
    return [issue("information", "NO_DIELINE", "Generate a dieline", "No vector structure exists yet.", "Confirm dimensions and generate a dieline.")];
  }

  const issues: ValidationIssue[] = [];
  if (model.artboard.widthMm <= 0 || model.artboard.heightMm <= 0) {
    issues.push(issue("error", "INVALID_ARTBOARD", "Invalid artboard", "The artboard has a non-positive dimension.", "Regenerate with valid package measurements.", [model.id]));
  }

  const ids = new Set<string>();
  for (const object of [...model.panels, ...model.paths]) {
    if (ids.has(object.id)) {
      issues.push(issue("error", "DUPLICATE_ID", "Duplicate geometry identifier", `${object.id} is used more than once.`, "Regenerate or rename the duplicated object.", [object.id]));
    }
    ids.add(object.id);
  }

  const cutPaths = model.paths.filter((path) => path.kind === "cut");
  const creasePaths = model.paths.filter((path) => path.kind === "crease");
  if (cutPaths.length === 0) {
    issues.push(issue("error", "MISSING_CUT", "Missing cut path", "No die-cut path is defined.", "Add or regenerate the external cut path."));
  }
  if (creasePaths.length === 0 && model.templateId !== "simple-sleeve") {
    issues.push(issue("error", "MISSING_CREASE", "Missing crease paths", "The structure has no fold relationships.", "Add fold lines between connected panels."));
  }

  for (const path of model.paths) {
    if (path.points.length < 2) {
      issues.push(issue("error", "EMPTY_PATH", "Incomplete path", `${path.name} contains too few points.`, "Delete or redraw the path.", [path.id]));
    }
    if (hasSelfIntersection(path)) {
      issues.push(issue("error", "SELF_INTERSECTION", "Self-intersecting path", `${path.name} crosses itself.`, "Move the highlighted nodes until the path no longer crosses.", [path.id]));
    }
    for (const point of path.points) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        issues.push(issue("error", "INVALID_COORDINATE", "Invalid coordinate", `${path.name} contains a non-finite coordinate.`, "Regenerate the affected geometry.", [path.id]));
        break;
      }
      if (point.x < -0.01 || point.y < -0.01 || point.x > model.artboard.widthMm + 0.01 || point.y > model.artboard.heightMm + 0.01) {
        issues.push(issue("warning", "OUTSIDE_ARTBOARD", "Object outside artboard", `${path.name} extends outside the artboard.`, "Resize the artboard or move the object inside it.", [path.id]));
        break;
      }
    }
  }

  const pathSignatures = new Map<string, string>();
  for (const path of model.paths) {
    const signature = `${path.kind}:${path.points.map(pointKey).join("|")}`;
    const previous = pathSignatures.get(signature);
    if (previous) {
      issues.push(issue("warning", "DUPLICATE_PATH", "Duplicate vector path", `${path.name} duplicates another path.`, "Delete the duplicate to keep exported geometry clean.", [previous, path.id]));
    } else {
      pathSignatures.set(signature, path.id);
    }
  }

  const glue = model.panels.find((panel) => panel.role === "glue");
  if (!glue && model.templateId !== "basic-mailer") {
    issues.push(issue("warning", "MISSING_GLUE", "No glue flap", "This closed carton does not include a glue flap.", "Add a glue flap or choose an open structure."));
  }

  const safeAreas = model.paths.filter((path) => path.kind === "safe");
  if (safeAreas.length === 0) {
    issues.push(issue("recommendation", "NO_SAFE_AREA", "Safe area is hidden", "No printable safe-area guides were generated.", "Set a positive safe margin and regenerate."));
  }

  if (issues.every((entry) => entry.severity !== "error" && entry.severity !== "warning")) {
    issues.push(issue("information", "VALID", "Production checks passed", "The dieline is connected, dimensioned, and exportable.", "Review the physical prototype before manufacturing.", [model.id]));
  }
  return issues;
};

export const validationSummary = (issues: ValidationIssue[]) => ({
  errors: issues.filter((entry) => entry.severity === "error").length,
  warnings: issues.filter((entry) => entry.severity === "warning").length,
  recommendations: issues.filter((entry) => entry.severity === "recommendation").length,
});

