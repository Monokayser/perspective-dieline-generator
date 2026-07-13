"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Box, ScanLine, ShieldCheck, X } from "lucide-react";
import { createSamplePackageImage } from "../lib/sample-image";
import { useProjectStore } from "../store/project-store";

export function Onboarding() {
  const { imageDataUrl, setImage, runAnalysis } = useProjectStore();
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setVisible(localStorage.getItem("pdg-onboarding-complete") !== "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!visible || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>("button,[href],[tabindex]:not([tabindex='-1'])"));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        localStorage.setItem("pdg-onboarding-complete", "true");
        setVisible(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [visible]);
  if (!visible || imageDataUrl) return null;
  const close = () => { localStorage.setItem("pdg-onboarding-complete", "true"); setVisible(false); };
  const sample = () => {
    setImage(createSamplePackageImage(), "sample-rectangular-carton.png", "image/png");
    close();
    window.setTimeout(() => void runAnalysis(), 50);
  };
  return (
    <div className="onboarding-backdrop">
      <section ref={dialogRef} className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
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
