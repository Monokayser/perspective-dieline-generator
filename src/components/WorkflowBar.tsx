"use client";

import { Check } from "lucide-react";
import { useProjectStore, WORKFLOW_PHASES } from "../store/project-store";

export function WorkflowBar() {
  const { phase, maxPhase, setPhase, setInspectorTab } = useProjectStore();
  const phaseIndex = WORKFLOW_PHASES.findIndex((item) => item.id === phase);
  const maxIndex = WORKFLOW_PHASES.findIndex((item) => item.id === maxPhase);
  return (
    <nav className="workflow-bar" aria-label="Project workflow">
      {WORKFLOW_PHASES.map((item, index) => {
        const complete = index < phaseIndex;
        const active = item.id === phase;
        const available = index <= maxIndex;
        return (
          <button key={item.id} className={`${complete ? "complete" : ""} ${active ? "active" : ""}`} disabled={!available} onClick={() => { setPhase(item.id); if (item.id === "deliver") setInspectorTab("validate"); }} aria-current={active ? "step" : undefined} title={item.description}>
            <span>{complete ? <Check size={12} /> : index + 1}</span>
            <b>{item.label}</b>
            <small>{item.description}</small>
          </button>
        );
      })}
    </nav>
  );
}

