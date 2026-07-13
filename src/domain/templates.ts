import {
  DEFAULT_LAYERS,
  type DielineModel,
  type PackageDimensions,
  type PanelGeometry,
  type Point,
  type TemplateDefinition,
  type TemplateId,
  type VectorPath,
} from "./types";

const id = (prefix: string, value: string | number) => `${prefix}-${value}`;

const rectPoints = (x: number, y: number, width: number, height: number): Point[] => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

const line = (
  pathId: string,
  name: string,
  kind: VectorPath["kind"],
  a: Point,
  b: Point,
  panelId?: string,
): VectorPath => ({ id: pathId, name, kind, points: [a, b], closed: false, panelId });

const value = (dimensions: PackageDimensions, key: keyof PackageDimensions) =>
  dimensions[key].valueMm;

const dimensionsValid = (dimensions: PackageDimensions, required: Array<keyof PackageDimensions>) => {
  const errors: string[] = [];
  for (const key of required) {
    const item = dimensions[key];
    if (!Number.isFinite(item.valueMm) || item.valueMm <= 0) {
      errors.push(`${key} must be greater than zero.`);
    }
  }
  if (value(dimensions, "bleed") > 20) errors.push("Bleed should not exceed 20 mm.");
  if (value(dimensions, "safeMargin") * 2 >= value(dimensions, "width")) {
    errors.push("Safe margin is too large for the front panel.");
  }
  return errors;
};

type GeneratorOptions = {
  templateId: TemplateId;
  equalSides?: boolean;
  sleeve?: boolean;
  reverseBottom?: boolean;
  mailer?: boolean;
  triangular?: boolean;
};

const createCarton = (dimensions: PackageDimensions, options: GeneratorOptions): DielineModel => {
  const width = value(dimensions, "width");
  const height = options.equalSides ? width : value(dimensions, "height");
  const depth = options.equalSides ? width : value(dimensions, "depth");
  const glue = value(dimensions, "glueFlap");
  const topFlap = options.sleeve ? 0 : Math.min(value(dimensions, "topFlap"), Math.max(width, depth));
  const bottomFlap = options.sleeve ? 0 : Math.min(value(dimensions, "bottomFlap"), Math.max(width, depth));
  const bleed = value(dimensions, "bleed");
  const safe = value(dimensions, "safeMargin");
  const panelWidths = options.mailer ? [height * 0.45, width, height, width, height * 0.45] : [depth, width, depth, width];
  const roles: PanelGeometry["role"][] = options.mailer
    ? ["flap", "front", "bottom", "back", "flap"]
    : ["left", "front", "right", "back"];
  const bodyY = bleed + topFlap;
  const bodyX = bleed + glue;
  const panels: PanelGeometry[] = [];
  const paths: VectorPath[] = [];
  const starts: number[] = [];
  let x = bodyX;

  panelWidths.forEach((panelWidth, index) => {
    starts.push(x);
    const panelId = id("panel", `${roles[index]}-${index + 1}`);
    panels.push({
      id: panelId,
      name: roles[index][0].toUpperCase() + roles[index].slice(1) + " panel",
      role: roles[index],
      points: rectPoints(x, bodyY, panelWidth, height),
      locked: false,
    });

    if (index > 0) {
      paths.push(
        line(
          id("crease", `body-${index}`),
          "Body fold",
          "crease",
          { x, y: bodyY },
          { x, y: bodyY + height },
        ),
      );
    }

    if (!options.sleeve) {
      const topRole: PanelGeometry["role"] = index % 2 === 1 ? "top" : "flap";
      const bottomRole: PanelGeometry["role"] = index % 2 === 1 ? "bottom" : "flap";
      const tapered = options.triangular || (!options.mailer && index % 2 === 0);
      const inset = tapered ? Math.min(panelWidth * 0.18, 8) : 0;
      const topPoints = options.triangular
        ? [
            { x, y: bodyY },
            { x: x + panelWidth / 2, y: bodyY - topFlap },
            { x: x + panelWidth, y: bodyY },
          ]
        : [
            { x, y: bodyY },
            { x: x + inset, y: bodyY - topFlap },
            { x: x + panelWidth - inset, y: bodyY - topFlap },
            { x: x + panelWidth, y: bodyY },
          ];
      const bottomInset = options.reverseBottom && index % 2 === 1 ? Math.min(panelWidth * 0.18, 8) : inset;
      const bottomPoints = [
        { x, y: bodyY + height },
        { x: x + panelWidth, y: bodyY + height },
        { x: x + panelWidth - bottomInset, y: bodyY + height + bottomFlap },
        { x: x + bottomInset, y: bodyY + height + bottomFlap },
      ];
      panels.push({
        id: id("top-flap", index),
        name: index % 2 === 1 ? "Closing flap" : "Dust flap",
        role: topRole,
        points: topPoints,
        locked: false,
      });
      panels.push({
        id: id("bottom-flap", index),
        name: index % 2 === 1 ? "Bottom closing flap" : "Bottom dust flap",
        role: bottomRole,
        points: bottomPoints,
        locked: false,
      });
      paths.push(
        line(id("crease", `top-${index}`), "Top fold", "crease", { x, y: bodyY }, { x: x + panelWidth, y: bodyY }),
        line(
          id("crease", `bottom-${index}`),
          "Bottom fold",
          "crease",
          { x, y: bodyY + height },
          { x: x + panelWidth, y: bodyY + height },
        ),
      );
    }

    const safeWidth = Math.max(0, panelWidth - safe * 2);
    if (safeWidth > 0 && height > safe * 2) {
      paths.push({
        id: id("safe", index),
        name: `${roles[index]} safe area`,
        kind: "safe",
        points: rectPoints(x + safe, bodyY + safe, safeWidth, height - safe * 2),
        closed: true,
        panelId,
      });
    }
    x += panelWidth;
  });

  const bodyEndX = x;
  const gluePoints: Point[] = [
    { x: bleed, y: bodyY + 5 },
    { x: bodyX, y: bodyY },
    { x: bodyX, y: bodyY + height },
    { x: bleed, y: bodyY + height - 5 },
  ];
  panels.push({ id: "glue-flap", name: "Glue flap", role: "glue", points: gluePoints, locked: false });
  paths.push(
    line("crease-glue", "Glue fold", "crease", { x: bodyX, y: bodyY }, { x: bodyX, y: bodyY + height }),
  );

  const topBoundary = options.sleeve ? bodyY : bodyY - topFlap;
  const bottomBoundary = options.sleeve ? bodyY + height : bodyY + height + bottomFlap;
  const silhouette: Point[] = options.sleeve
    ? [
        { x: bleed, y: bodyY + 5 },
        { x: bodyX, y: bodyY },
        { x: bodyEndX, y: bodyY },
        { x: bodyEndX, y: bodyY + height },
        { x: bodyX, y: bodyY + height },
        { x: bleed, y: bodyY + height - 5 },
      ]
    : [
        { x: bleed, y: bodyY + 5 },
        { x: bodyX, y: bodyY },
        { x: bodyX, y: topBoundary },
        { x: bodyEndX, y: topBoundary },
        { x: bodyEndX, y: bottomBoundary },
        { x: bodyX, y: bottomBoundary },
        { x: bodyX, y: bodyY + height },
        { x: bleed, y: bodyY + height - 5 },
      ];
  paths.push({ id: "cut-outline", name: "External die cut", kind: "cut", points: silhouette, closed: true });

  const artboardWidth = bodyEndX + bleed;
  const artboardHeight = bottomBoundary + bleed;
  paths.push({
    id: "bleed-outline",
    name: "Bleed boundary",
    kind: "bleed",
    points: rectPoints(0, 0, artboardWidth, artboardHeight),
    closed: true,
  });
  paths.push({
    id: "artboard-outline",
    name: "Artboard",
    kind: "artboard",
    points: rectPoints(0, 0, artboardWidth, artboardHeight),
    closed: true,
  });

  starts.forEach((start, index) => {
    const panelWidth = panelWidths[index];
    paths.push(
      line(
        id("measure-width", index),
        `${roles[index]} width`,
        "measurement",
        { x: start, y: artboardHeight - bleed / 2 },
        { x: start + panelWidth, y: artboardHeight - bleed / 2 },
        id("panel", `${roles[index]}-${index + 1}`),
      ),
    );
  });

  return {
    version: 1,
    id: `dieline-${options.templateId}`,
    templateId: options.templateId,
    templateVersion: 1,
    customMode: options.templateId === "custom",
    parameters: structuredClone(dimensions),
    nonstructuralOverrides: {},
    panels,
    paths,
    layers: DEFAULT_LAYERS.map((layer) => ({ ...layer })),
    artboard: { widthMm: artboardWidth, heightMm: artboardHeight, paddingMm: bleed },
    scale: 1,
    generatedAt: new Date().toISOString(),
  };
};

const makeTemplate = (
  idValue: TemplateId,
  name: string,
  description: string,
  family: string,
  options: Omit<GeneratorOptions, "templateId"> = {},
): TemplateDefinition => {
  const required: Array<keyof PackageDimensions> = [
    "width",
    "height",
    "depth",
    "glueFlap",
    "bleed",
    "safeMargin",
    "materialThickness",
    "foldAllowance",
  ];
  if (!options.sleeve) required.push("topFlap", "bottomFlap");
  return {
    id: idValue,
    version: 1,
    name,
    description,
    family,
    parameterSchema: Object.fromEntries(required.map((key) => [key, { label: key.replace(/([A-Z])/g, " $1"), minMm: 0.01, maxMm: 10000 }])) as TemplateDefinition["parameterSchema"],
    constraints: ["All required dimensions must be confirmed and greater than zero.", "Bleed must not exceed 20 mm.", "Safe areas must remain inside printable panels."],
    required,
    scoreCandidate: (analysis) => analysis.candidates.find((candidate) => candidate.templateId === idValue)?.confidence ?? 0,
    generate: (dimensions) => createCarton(dimensions, { ...options, templateId: idValue }),
    validateDimensions: (dimensions) => dimensionsValid(dimensions, required),
  };
};

export const TEMPLATES: TemplateDefinition[] = [
  makeTemplate("rectangular-carton", "Rectangular carton", "Four-panel carton with balanced closing flaps.", "Folding carton"),
  makeTemplate("cube-box", "Cube box", "Equal-sided carton with symmetric closures.", "Folding carton", { equalSides: true }),
  makeTemplate("straight-tuck-end", "Straight tuck end", "Top and bottom tuck in the same direction.", "Tuck carton"),
  makeTemplate("reverse-tuck-end", "Reverse tuck end", "Opposed top and bottom tuck closures.", "Tuck carton", { reverseBottom: true }),
  makeTemplate("simple-sleeve", "Simple sleeve", "Open-ended four-panel sleeve with glue seam.", "Sleeve", { sleeve: true }),
  makeTemplate("basic-mailer", "Basic mailer", "Hinged mailer-style net with protective side flaps.", "Mailer", { mailer: true }),
  makeTemplate("triangular-closure", "Triangular closure", "Reference-inspired triangular petal closure carton.", "Specialty", { triangular: true }),
  makeTemplate("custom", "Custom polygon", "Editable starting structure for irregular packaging.", "Custom"),
];

export const getTemplate = (templateId: TemplateId) =>
  TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];

export const generateDieline = (templateId: TemplateId, dimensions: PackageDimensions) =>
  getTemplate(templateId).generate(dimensions);
