import type { PreprocessSettings } from "../domain/types";

export type PreparedImage = {
  url: string;
  width: number;
  height: number;
  revoke(): void;
};

export const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;

export const preparedDimensions = (width: number, height: number, rotation: number) => {
  const normalized = normalizeRotation(rotation);
  return normalized === 90 || normalized === 270
    ? { width: height, height: width }
    : { width, height };
};

export const preparationFilter = (settings: Pick<PreprocessSettings, "brightness" | "contrast" | "saturation">) =>
  `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%)`;

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Image preparation was cancelled.", "AbortError");
};

const canvasBlob = (canvas: HTMLCanvasElement, signal?: AbortSignal) => new Promise<Blob>((resolve, reject) => {
  throwIfAborted(signal);
  canvas.toBlob((blob) => {
    if (!blob) reject(new Error("The prepared image could not be encoded."));
    else resolve(blob);
  }, "image/png");
});

export async function prepareImage(sourceDataUrl: string, settings: PreprocessSettings, signal?: AbortSignal): Promise<PreparedImage> {
  throwIfAborted(signal);
  const source = await fetch(sourceDataUrl, { signal });
  if (!source.ok) throw new Error("The source image could not be prepared.");
  const sourceBlob = await source.blob();
  const bitmap = await createImageBitmap(sourceBlob, { imageOrientation: "from-image" });

  try {
    throwIfAborted(signal);
    const dimensions = preparedDimensions(bitmap.width, bitmap.height, settings.rotation);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("This browser cannot prepare the source image.");

    context.save();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(normalizeRotation(settings.rotation) * Math.PI / 180);
    context.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);
    context.filter = preparationFilter(settings);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    context.restore();

    const blob = await canvasBlob(canvas, signal);
    throwIfAborted(signal);
    const url = URL.createObjectURL(blob);
    return { url, ...dimensions, revoke: () => URL.revokeObjectURL(url) };
  } finally {
    bitmap.close();
  }
}
