export type ArtboardFitInput = {
  artboardWidth: number;
  artboardHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  padding: number;
  maxWidth?: number;
  maxHeight?: number;
};

export type ArtboardFit = {
  width: number;
  height: number;
  ratio: number;
};

const positive = (value: number, fallback: number) => Number.isFinite(value) && value > 0 ? value : fallback;

/** Fits an artboard inside the usable viewport without changing its geometry. */
export const calculateArtboardFit = ({
  artboardWidth,
  artboardHeight,
  viewportWidth,
  viewportHeight,
  padding,
  maxWidth = Number.POSITIVE_INFINITY,
  maxHeight = Number.POSITIVE_INFINITY,
}: ArtboardFitInput): ArtboardFit => {
  const width = positive(artboardWidth, 1);
  const height = positive(artboardHeight, 1);
  const availableWidth = Math.max(1, Math.min(Math.max(1, viewportWidth - padding * 2), maxWidth));
  const availableHeight = Math.max(1, Math.min(Math.max(1, viewportHeight - padding * 2), maxHeight));
  const scale = Math.min(availableWidth / width, availableHeight / height);

  return { width: width * scale, height: height * scale, ratio: width / height };
};

export const formatAspectRatio = (width: number, height: number) => `${(positive(width, 1) / positive(height, 1)).toFixed(2)}:1`;
