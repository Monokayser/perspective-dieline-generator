import type { DielineModel, PanelGeometry, Point, Unit, VectorPath } from "./types";
import { fromMillimetres } from "./units";

const escapeXml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const pointsToPath = (points: Point[], closed: boolean) => {
  if (points.length === 0) return "";
  const commands = [`M ${points[0].x.toFixed(4)} ${points[0].y.toFixed(4)}`];
  points.slice(1).forEach((point) => commands.push(`L ${point.x.toFixed(4)} ${point.y.toFixed(4)}`));
  if (closed) commands.push("Z");
  return commands.join(" ");
};

const styles: Record<VectorPath["kind"], { stroke: string; width: number; dash?: string }> = {
  cut: { stroke: "#111111", width: 0.25 },
  crease: { stroke: "#246bfd", width: 0.22, dash: "4 2" },
  perforation: { stroke: "#7c3aed", width: 0.22, dash: "0.5 1.5" },
  guide: { stroke: "#64748b", width: 0.18, dash: "6 2 1 2" },
  hidden: { stroke: "#94a3b8", width: 0.18, dash: "2 2" },
  bleed: { stroke: "#db2777", width: 0.18, dash: "6 2 1 2" },
  safe: { stroke: "#16a34a", width: 0.18, dash: "2 2" },
  measurement: { stroke: "#64748b", width: 0.16 },
  artboard: { stroke: "#94a3b8", width: 0.12, dash: "1 2" },
};

const groupIdForKind: Record<VectorPath["kind"], string> = {
  cut: "cut-lines",
  crease: "crease-lines",
  perforation: "perforation-lines",
  guide: "guides",
  hidden: "guides",
  bleed: "bleed-area",
  safe: "safe-area",
  measurement: "measurements",
  artboard: "artboard",
};

const panelCentroid = (panel: PanelGeometry) => ({
  x: panel.points.reduce((sum, point) => sum + point.x, 0) / panel.points.length,
  y: panel.points.reduce((sum, point) => sum + point.y, 0) / panel.points.length,
});

export type SvgExportOptions = {
  unit: Unit;
  includeMeasurements: boolean;
  includeLabels: boolean;
  includeBleed: boolean;
  includeSafeArea: boolean;
  includeGuides: boolean;
  includeLegend: boolean;
  includeArtboard: boolean;
};

export const DEFAULT_SVG_OPTIONS: SvgExportOptions = {
  unit: "mm",
  includeMeasurements: true,
  includeLabels: true,
  includeBleed: true,
  includeSafeArea: true,
  includeGuides: false,
  includeLegend: true,
  includeArtboard: true,
};

export const exportSvg = (model: DielineModel, options: SvgExportOptions = DEFAULT_SVG_OPTIONS) => {
  const width = fromMillimetres(model.artboard.widthMm, options.unit);
  const height = fromMillimetres(model.artboard.heightMm, options.unit);
  const orderedGroups = [
    "artboard",
    "panel-geometry",
    "cut-lines",
    "crease-lines",
    "perforation-lines",
    "glue-flaps",
    "bleed-area",
    "safe-area",
    "measurements",
    "labels",
    "guides",
  ];
  const groups = new Map<string, string[]>();
  orderedGroups.forEach((group) => groups.set(group, []));

  model.panels.forEach((panel) => {
    const target = panel.role === "glue" ? "glue-flaps" : "panel-geometry";
    groups.get(target)?.push(
      `<path id="${escapeXml(panel.id)}" data-role="${panel.role}" d="${pointsToPath(panel.points, true)}" fill="none" stroke="none"/>`,
    );
    if (options.includeLabels) {
      const center = panelCentroid(panel);
      groups.get("labels")?.push(
        `<text id="label-${escapeXml(panel.id)}" x="${center.x.toFixed(3)}" y="${center.y.toFixed(3)}" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="3.2" fill="#334155">${escapeXml(panel.name)}</text>`,
      );
    }
  });

  model.paths.forEach((path) => {
    if (path.kind === "bleed" && !options.includeBleed) return;
    if (path.kind === "safe" && !options.includeSafeArea) return;
    if (path.kind === "measurement" && !options.includeMeasurements) return;
    if ((path.kind === "guide" || path.kind === "hidden") && !options.includeGuides) return;
    if (path.kind === "artboard" && !options.includeArtboard) return;
    const style = styles[path.kind];
    const dash = style.dash ? ` stroke-dasharray="${style.dash}"` : "";
    groups.get(groupIdForKind[path.kind])?.push(
      `<path id="${escapeXml(path.id)}" data-line-type="${path.kind}" d="${pointsToPath(path.points, path.closed)}" fill="none" stroke="${style.stroke}" stroke-width="${style.width}"${dash} stroke-linecap="round" stroke-linejoin="round"/>`,
    );
  });

  if (options.includeLegend) {
    groups.get("labels")?.push(
      `<g id="line-style-legend" transform="translate(6 8)" font-family="Inter,Arial,sans-serif" font-size="2.8" fill="#334155">` +
        `<path d="M0 0 H12" stroke="#111" stroke-width="0.25"/><text x="14" y="1">CUT</text>` +
        `<path d="M28 0 H40" stroke="#246bfd" stroke-width="0.22" stroke-dasharray="4 2"/><text x="42" y="1">CREASE</text>` +
        `<path d="M62 0 H74" stroke="#7c3aed" stroke-width="0.22" stroke-dasharray="0.5 1.5"/><text x="76" y="1">PERFORATION</text></g>`,
    );
  }

  const groupMarkup = orderedGroups
    .map((group) => `<g id="${group}" inkscape:groupmode="layer" inkscape:label="${group}">${groups.get(group)?.join("") ?? ""}</g>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${width.toFixed(4)}${options.unit}" height="${height.toFixed(4)}${options.unit}" viewBox="0 0 ${model.artboard.widthMm.toFixed(4)} ${model.artboard.heightMm.toFixed(4)}" version="1.1">` +
    `<title>Perspective Dieline Generator — ${escapeXml(model.templateId)}</title>` +
    `<metadata><pdg:document xmlns:pdg="https://perspective-dieline.app/schema" version="1" scale="1" unit="mm" generated="${escapeXml(model.generatedAt)}"/></metadata>` +
    groupMarkup +
    `</svg>`;
};

const dxfLayer = (kind: VectorPath["kind"]) => groupIdForKind[kind].toUpperCase().replaceAll("-", "_");

export const exportDxf = (model: DielineModel) => {
  const entities: string[] = [];
  model.paths.forEach((path) => {
    const points = path.closed ? [...path.points, path.points[0]] : path.points;
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      entities.push(`0\nLINE\n8\n${dxfLayer(path.kind)}\n10\n${a.x}\n20\n${-a.y}\n30\n0\n11\n${b.x}\n21\n${-b.y}\n31\n0`);
    }
  });
  return `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${entities.join("\n")}\n0\nENDSEC\n0\nEOF`;
};

const pdfLine = (a: Point, b: Point, height: number) => `${a.x.toFixed(3)} ${(height - a.y).toFixed(3)} m ${b.x.toFixed(3)} ${(height - b.y).toFixed(3)} l S`;

export const exportMinimalVectorPdf = (model: DielineModel) => {
  const scale = 72 / 25.4;
  const width = model.artboard.widthMm * scale;
  const height = model.artboard.heightMm * scale;
  const commands: string[] = ["0.35 w", "0 0 0 RG"];
  model.paths.filter((path) => path.kind === "cut" || path.kind === "crease").forEach((path) => {
    if (path.kind === "crease") commands.push("[8 4] 0 d", "0.14 0.42 0.99 RG");
    else commands.push("[] 0 d", "0 0 0 RG");
    const points = path.points.map((point) => ({ x: point.x * scale, y: point.y * scale }));
    const pairs = path.closed ? [...points, points[0]] : points;
    for (let i = 0; i < pairs.length - 1; i += 1) commands.push(pdfLine(pairs[i], pairs[i + 1], height));
  });
  const stream = commands.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(3)} ${height.toFixed(3)}] /Contents 4 0 R >> endobj`,
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadText = (content: string, filename: string, type: string) =>
  downloadBlob(new Blob([content], { type }), filename);

export const exportRasterPreview = async (
  model: DielineModel,
  format: "png" | "jpeg",
  dpi = 300,
) => {
  const svg = exportSvg(model, DEFAULT_SVG_OPTIONS);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const scale = dpi / 25.4;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(model.artboard.widthMm * scale));
    canvas.height = Math.max(1, Math.round(model.artboard.heightMm * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Raster export is unavailable.");
    if (format === "jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Raster encoding failed.")), `image/${format}`, format === "jpeg" ? 0.92 : undefined));
  } finally {
    URL.revokeObjectURL(url);
  }
};
