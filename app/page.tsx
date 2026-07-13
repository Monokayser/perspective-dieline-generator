import type { Metadata } from "next";
import { Workbench } from "../src/components/Workbench";

export const metadata: Metadata = {
  title: "Perspective Package Image to 2D Dieline Generator",
  description: "Local-first package analysis, measurement confirmation, parametric reconstruction, vector editing, validation, and professional SVG export.",
};

export default function Home() {
  return <Workbench />;
}

