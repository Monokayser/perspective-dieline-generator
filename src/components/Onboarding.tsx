"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Box, ScanLine, ShieldCheck, X } from "lucide-react";
import { createSamplePackageImage } from "../lib/sample-image";
import { useProjectStore } from "../store/project-store";

export function Onboarding() {
  const { imageDataUrl, setImage, runAnalysis } = useProjectStore();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(localStorage.getItem("pdg-onboarding-complete") !== "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  if (!visible || imageDataUrl) return null;
  const close = () => { localStorage.setItem("pdg-onboarding-complete", "true"); setVisible(false); };
  const sample = () => {
    setImage(createSamplePackageImage(), "sample-rectangular-carton.png", "image/png");
    close();
    window.setTimeout(() => void runAnalysis(), 50);
  };
  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <button className="onboarding-close" onClick={close} aria-label="Close onboarding"><X size={18} /></button>
        <div className="onboarding-mark"><div className="app-mark large"><span /><span /><span /></div></div>
        <span className="eyebrow">Professional local-first workspace</span>
        <h1 id="onboarding-title">Turn a perspective package image into an editable dieline.</h1>
        <p>Detect visible structure, correct uncertain geometry, confirm real measurements, and export a manufacturing-ready SVG without uploading private artwork.</p>
        <div className="onboarding-features">
          <div><ScanLine size={20} /><span><strong>Transparent detection</strong><small>Every result includes confidence and warnings.</small></span></div>
          <div><Box size={20} /><span><strong>Parametric templates</strong><small>Confirmed measurements drive exact vector geometry.</small></span></div>
          <div><ShieldCheck size={20} /><span><strong>Production validation</strong><small>Catch open paths, missing folds, and export errors.</small></span></div>
        </div>
        <div className="onboarding-actions">
          <button className="primary-button" onClick={sample}>Open guided sample <ArrowRight size={16} /></button>
          <button className="secondary-button" onClick={close}>Start with my image</button>
        </div>
        <small className="onboarding-footnote">No account required · Images stay on this device · Millimetres by default</small>
      </section>
    </div>
  );
}
