"use client";

import { CheckCircle2, CircleDashed, Cpu, Ruler, WifiOff } from "lucide-react";
import { confidenceLabel } from "../domain/types";
import { formatMeasurement } from "../domain/units";
import { validationSummary } from "../domain/validation";
import { useProjectStore } from "../store/project-store";

export function StatusBar() {
  const { unit, zoom, analysis, dimensions, validationIssues, dieline, operation, readOnly } = useProjectStore();
  const summary = validationSummary(validationIssues);
  return (
    <footer className="statusbar">
      <span><Ruler size={13} /> {unit} - output scale 1:1</span>
      <span>{formatMeasurement(dimensions.width.valueMm, unit, 1)} x {formatMeasurement(dimensions.height.valueMm, unit, 1)} x {formatMeasurement(dimensions.depth.valueMm, unit, 1)}</span>
      <span className="status-spacer" />
      <span><Cpu size={13} /> {analysis ? `${confidenceLabel(analysis.confidence)} confidence` : "analysis idle"}</span>
      <span className={summary.errors > 0 ? "status-error" : "status-good"}>{dieline && summary.errors === 0 ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />} {dieline ? `${summary.errors} errors · ${summary.warnings} warnings` : "not validated"}</span>
      <span><WifiOff size={13} /> {readOnly ? "read-only" : "offline ready"}</span>
      {operation && !["complete", "cancelled", "error"].includes(operation.phase) && <span>{operation.status} · {Math.round(operation.progress * 100)}%</span>}
      <span>view {Math.round(zoom * 100)}%</span>
    </footer>
  );
}
