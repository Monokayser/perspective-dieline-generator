import type { PackageDimensions, PreprocessSettings } from "./types";
import { mm } from "./units";

export const createDefaultDimensions = (): PackageDimensions => ({
  width: mm(80),
  height: mm(120),
  depth: mm(35),
  topFlap: mm(32),
  bottomFlap: mm(32),
  glueFlap: mm(16),
  dustFlap: mm(18),
  lockingTab: mm(12),
  bleed: mm(3),
  safeMargin: mm(4),
  materialThickness: mm(0.45),
  foldAllowance: mm(0.6),
});

export const DEFAULT_PREPROCESS: PreprocessSettings = {
  rotation: 0,
  flipX: false,
  flipY: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  grayscale: false,
  threshold: false,
  edgePreview: false,
};

