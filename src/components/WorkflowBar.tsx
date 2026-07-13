"use client";

import { Check } from "lucide-react";
import { useProjectStore, WORKFLOW_STAGES } from "../store/project-store";

export function WorkflowBar() {
  const { stage, maxStage, setStage } = useProjectStore();
  return (
    <nav className="workflow-bar" aria-label="Project workflow">
      {WORKFLOW_STAGES.map((label, index) => {
        const complete = index < stage;
        const active = index === stage;
        const available = index <= maxStage;
        return (
          <button key={label} className={`${complete ? "complete" : ""} ${active ? "active" : ""}`} disabled={!available} onClick={() => setStage(index)} aria-current={active ? "step" : undefined}>
            <span>{complete ? <Check size={12} /> : index + 1}</span>
            <b>{label}</b>
          </button>
        );
      })}
    </nav>
  );
}

