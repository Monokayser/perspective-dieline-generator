/// <reference lib="webworker" />

import type { AnnotationEdge, AnnotationPoint, ImageAnalysis, PackageCandidate, Point } from "../domain/types";
import type { AnalysisWorkerRequest, AnalysisWorkerResponse } from "./protocol";

const cancelledJobs = new Set<string>();

const send = (message: AnalysisWorkerResponse, transfer: Transferable[] = []) => self.postMessage(message, transfer);

const progress = (jobId: string, value: number, stage: string) =>
  send({ version: 1, type: "progress", jobId, progress: value, stage });

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

const preview = (jobId: string, image: ImageBitmap, settings: import("../domain/types").PreprocessSettings) => {
  const quarterTurns = ((Math.round(settings.rotation / 90) % 4) + 4) % 4;
  const swap = quarterTurns % 2 === 1;
  const width = swap ? image.height : image.width;
  const height = swap ? image.width : image.height;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: settings.threshold || settings.edgePreview });
  if (!context) throw new Error("Canvas preview is unavailable.");
  context.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) grayscale(${settings.grayscale ? 100 : 0}%)`;
  context.translate(width / 2, height / 2);
  context.rotate(quarterTurns * Math.PI / 2);
  context.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);
  context.drawImage(image, -image.width / 2, -image.height / 2);
  image.close();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.filter = "none";
  if (settings.threshold || settings.edgePreview) {
    const pixels = context.getImageData(0, 0, width, height);
    const original = new Uint8ClampedArray(pixels.data);
    for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
      const offset = (y * width + x) * 4;
      const luminance = (sourceOffset: number) => original[sourceOffset] * 0.299 + original[sourceOffset + 1] * 0.587 + original[sourceOffset + 2] * 0.114;
      let output = luminance(offset) >= 128 ? 255 : 0;
      if (settings.edgePreview) {
        const gx = luminance(offset + 4) - luminance(offset - 4);
        const gy = luminance(offset + width * 4) - luminance(offset - width * 4);
        output = Math.hypot(gx, gy) > 34 ? 255 : 0;
      }
      pixels.data[offset] = output; pixels.data[offset + 1] = output; pixels.data[offset + 2] = output;
    }
    context.putImageData(pixels, 0, 0);
  }
  const result = canvas.transferToImageBitmap();
  send({ version: 1, type: "preview-result", jobId, image: result }, [result]);
};

const solveLinearSystem = (matrix: number[][], values: number[]) => {
  const size = values.length;
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    if (Math.abs(divisor) < 1e-10) throw new Error("The selected corners cannot form a stable rectification.");
    for (let index = column; index <= size; index += 1) augmented[column][index] /= divisor;
    for (let row = 0; row < size; row += 1) if (row !== column) {
      const factor = augmented[row][column];
      for (let index = column; index <= size; index += 1) augmented[row][index] -= factor * augmented[column][index];
    }
  }
  return augmented.map((row) => row[size]);
};

const rectify = (jobId: string, image: ImageBitmap, corners: [Point, Point, Point, Point]) => {
  const destination = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  const system: number[][] = [];
  const values: number[] = [];
  destination.forEach(({ x: u, y: v }, index) => {
    const source = corners[index];
    system.push([u, v, 1, 0, 0, 0, -source.x * u, -source.x * v]); values.push(source.x);
    system.push([0, 0, 0, u, v, 1, -source.y * u, -source.y * v]); values.push(source.y);
  });
  const coefficients = solveLinearSystem(system, values);
  const matrix3x3 = [...coefficients, 1];
  const sourceCanvas = new OffscreenCanvas(image.width, image.height);
  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) throw new Error("Canvas rectification is unavailable.");
  sourceContext.drawImage(image, 0, 0);
  const sourcePixels = sourceContext.getImageData(0, 0, image.width, image.height);
  const distance = (a: Point, b: Point) => Math.hypot((a.x - b.x) * image.width, (a.y - b.y) * image.height);
  const rawWidth = Math.max(distance(corners[0], corners[1]), distance(corners[3], corners[2]));
  const rawHeight = Math.max(distance(corners[0], corners[3]), distance(corners[1], corners[2]));
  const outputScale = Math.min(1, 2048 / Math.max(rawWidth, rawHeight));
  const width = Math.max(2, Math.round(rawWidth * outputScale));
  const height = Math.max(2, Math.round(rawHeight * outputScale));
  const outputCanvas = new OffscreenCanvas(width, height);
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) throw new Error("Canvas rectification is unavailable.");
  const output = outputContext.createImageData(width, height);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const u = x / Math.max(1, width - 1);
    const v = y / Math.max(1, height - 1);
    const denominator = coefficients[6] * u + coefficients[7] * v + 1;
    const sourceX = clamp((coefficients[0] * u + coefficients[1] * v + coefficients[2]) / denominator) * (image.width - 1);
    const sourceY = clamp((coefficients[3] * u + coefficients[4] * v + coefficients[5]) / denominator) * (image.height - 1);
    const sourceOffset = (Math.round(sourceY) * image.width + Math.round(sourceX)) * 4;
    const outputOffset = (y * width + x) * 4;
    output.data[outputOffset] = sourcePixels.data[sourceOffset]; output.data[outputOffset + 1] = sourcePixels.data[sourceOffset + 1]; output.data[outputOffset + 2] = sourcePixels.data[sourceOffset + 2]; output.data[outputOffset + 3] = 255;
  }
  image.close();
  outputContext.putImageData(output, 0, 0);
  const result = outputCanvas.transferToImageBitmap();
  send({ version: 1, type: "rectify-result", jobId, image: result, matrix3x3 }, [result]);
};

type CvBounds = { minX: number; minY: number; maxX: number; maxY: number } | null;
type OpenCvRuntime = typeof import("@techstark/opencv-js") & { onRuntimeInitialized?: () => void };

const tryOpenCvBounds = async (imageData: ImageData): Promise<CvBounds> => {
  const namespace = await import("@techstark/opencv-js");
  const cvModule = (namespace as unknown as { default?: unknown }).default ?? namespace;
  let cv: OpenCvRuntime;
  const thenable = cvModule as PromiseLike<OpenCvRuntime>;
  if (typeof thenable.then === "function") cv = await thenable;
  else if (typeof (cvModule as OpenCvRuntime).Mat === "function") cv = cvModule as OpenCvRuntime;
  else {
    cv = cvModule as OpenCvRuntime;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("OpenCV initialization timed out.")), 10000);
      cv.onRuntimeInitialized = () => { clearTimeout(timer); resolve(); };
    });
  }
  const source = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.Canny(blur, edges, 45, 135, 3, false);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    let bestArea = 0;
    let best: CvBounds = null;
    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);
      const area = Math.abs(cv.contourArea(contour, false));
      if (area > bestArea) {
        const rect = cv.boundingRect(contour);
        if (rect.width * rect.height > imageData.width * imageData.height * 0.04) {
          bestArea = area;
          best = { minX: rect.x, minY: rect.y, maxX: rect.x + rect.width, maxY: rect.y + rect.height };
        }
      }
      contour.delete();
    }
    return best;
  } finally {
    source.delete(); gray.delete(); blur.delete(); edges.delete(); contours.delete(); hierarchy.delete();
  }
};

const analyse = async (jobId: string, image: ImageBitmap) => {
  const maxDimension = 4096;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas analysis is not available in this browser.");
  context.drawImage(image, 0, 0, width, height);
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  image.close();
  progress(jobId, 0.12, "Decoding and normalising image");
  if (cancelledJobs.has(jobId)) return;

  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;
  const grayscale = new Uint8Array(width * height);
  let brightnessSum = 0;
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 4;
    const gray = Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114);
    grayscale[index] = gray;
    brightnessSum += gray;
  }
  const brightness = brightnessSum / (width * height) / 255;
  let contrastVariance = 0;
  const meanGray = brightness * 255;
  for (let index = 0; index < grayscale.length; index += 2) {
    contrastVariance += (grayscale[index] - meanGray) ** 2;
  }
  const contrast = clamp(Math.sqrt(contrastVariance / Math.ceil(grayscale.length / 2)) / 80);

  let laplacian = 0;
  let laplacianSquared = 0;
  let laplacianCount = 0;
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const index = y * width + x;
      const response = grayscale[index - 1] + grayscale[index + 1] + grayscale[index - width] + grayscale[index + width] - 4 * grayscale[index];
      laplacian += response;
      laplacianSquared += response * response;
      laplacianCount += 1;
    }
  }
  const laplacianMean = laplacian / Math.max(1, laplacianCount);
  const sharpness = clamp(Math.sqrt(Math.max(0, laplacianSquared / Math.max(1, laplacianCount) - laplacianMean ** 2)) / 45);
  progress(jobId, 0.3, "Measuring focus and contrast");
  if (cancelledJobs.has(jobId)) return;

  const borderSamples: Array<[number, number, number]> = [];
  const sample = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    borderSamples.push([data[offset], data[offset + 1], data[offset + 2]]);
  };
  const stepX = Math.max(1, Math.floor(width / 80));
  const stepY = Math.max(1, Math.floor(height / 80));
  for (let x = 0; x < width; x += stepX) { sample(x, 0); sample(x, height - 1); }
  for (let y = 0; y < height; y += stepY) { sample(0, y); sample(width - 1, y); }
  const border = [0, 1, 2].map((channel) => average(borderSamples.map((value) => value[channel])));
  const maskThreshold = 38 + (1 - contrast) * 18;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let foreground = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const distance = Math.sqrt(
        (data[offset] - border[0]) ** 2 +
        (data[offset + 1] - border[1]) ** 2 +
        (data[offset + 2] - border[2]) ** 2,
      );
      if (distance > maskThreshold) {
        foreground += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const coverage = foreground / (width * height);
  progress(jobId, 0.52, "Separating package from background");
  if (cancelledJobs.has(jobId)) return;

  try {
    const cvBounds = await tryOpenCvBounds(imageData);
    if (cvBounds) {
      const currentArea = Math.max(1, (maxX - minX) * (maxY - minY));
      const cvArea = (cvBounds.maxX - cvBounds.minX) * (cvBounds.maxY - cvBounds.minY);
      if (cvArea > width * height * 0.04 && cvArea < currentArea * 1.35) {
        minX = Math.min(minX, cvBounds.minX);
        minY = Math.min(minY, cvBounds.minY);
        maxX = Math.max(maxX, cvBounds.maxX);
        maxY = Math.max(maxY, cvBounds.maxY);
      }
    }
  } catch {
    // The deterministic gradient/contour path remains available if WASM cannot initialise.
  }
  progress(jobId, 0.72, "Tracing contours and structural edges");
  if (cancelledJobs.has(jobId)) return;

  const noObject = foreground === 0 || coverage < 0.025 || minX >= maxX || minY >= maxY;
  if (noObject) {
    minX = Math.round(width * 0.2);
    minY = Math.round(height * 0.2);
    maxX = Math.round(width * 0.8);
    maxY = Math.round(height * 0.8);
  }
  const marginX = Math.max(1, maxX - minX);
  const marginY = Math.max(1, maxY - minY);
  const skew = clamp(contrast * 0.08, 0.01, 0.08) * marginX;
  const rawPoints: Point[] = [
    { x: minX + skew, y: minY },
    { x: maxX, y: minY + skew * 0.35 },
    { x: maxX - skew * 0.45, y: maxY },
    { x: minX, y: maxY - skew * 0.2 },
  ];
  const points: AnnotationPoint[] = rawPoints.map((point, index) => ({
    id: `corner-${index + 1}`,
    x: clamp(point.x / width),
    y: clamp(point.y / height),
    confidence: noObject ? 0.2 : clamp(0.45 + contrast * 0.28 + sharpness * 0.17),
  }));
  const edges: AnnotationEdge[] = points.map((point, index) => ({
    id: `edge-${index + 1}`,
    startId: point.id,
    endId: points[(index + 1) % points.length].id,
    kind: "crease",
    confidence: point.confidence,
  }));
  const aspect = marginX / marginY;
  const cubeScore = clamp(1 - Math.abs(1 - aspect));
  const candidates = ([
    {
      templateId: cubeScore > 0.72 ? "cube-box" : "rectangular-carton",
      label: cubeScore > 0.72 ? "Cube box" : "Rectangular carton",
      confidence: noObject ? 0.24 : clamp(0.48 + cubeScore * 0.28 + contrast * 0.1),
      reasons: ["dominant four-corner face", `${aspect.toFixed(2)} visible-face aspect ratio`],
    },
    {
      templateId: "straight-tuck-end",
      label: "Straight tuck end",
      confidence: noObject ? 0.18 : clamp(0.44 + sharpness * 0.12),
      reasons: ["rectilinear silhouette", "folding-carton proportions"],
    },
    {
      templateId: "reverse-tuck-end",
      label: "Reverse tuck end",
      confidence: noObject ? 0.16 : clamp(0.39 + contrast * 0.12),
      reasons: ["opposed closure remains visually plausible"],
    },
  ] satisfies PackageCandidate[]).sort((a, b) => b.confidence - a.confidence);

  const touchesEdge = minX <= 2 || minY <= 2 || maxX >= width - 3 || maxY >= height - 3;
  const warnings: ImageAnalysis["warnings"] = [];
  if (width < 800 || height < 600) warnings.push({ id: "low-resolution", severity: "warning", title: "Limited resolution", detail: "The working image contains few pixels for precise corners.", recommendation: "Use a sharper image at least 1200 px on its longest edge." });
  if (sharpness < 0.3) warnings.push({ id: "blur", severity: "warning", title: "Image may be blurred", detail: "Local edge energy is low.", recommendation: "Increase sharpness or upload a better-focused photograph." });
  if (contrast < 0.25) warnings.push({ id: "low-contrast", severity: "warning", title: "Weak edge contrast", detail: "Package edges are close to the background tone.", recommendation: "Adjust contrast or mark the corners manually." });
  if (coverage > 0.82) warnings.push({ id: "complex-background", severity: "warning", title: "Complex background", detail: "Most of the image differs from the sampled border.", recommendation: "Crop closely or use the manual face tool." });
  if (brightness > 0.83 && contrast > 0.45) warnings.push({ id: "reflection", severity: "warning", title: "Strong reflections detected", detail: "Bright, high-contrast regions may interrupt real package edges.", recommendation: "Prefer diffuse lighting and confirm reflective edges manually." });
  if (aspect < 0.28 || aspect > 3.6) warnings.push({ id: "deformation", severity: "warning", title: "Extreme visible proportions", detail: "The dominant face may be deformed, heavily foreshortened, or incorrectly grouped.", recommendation: "Correct all four corners and add perspective guides before measuring." });
  if (touchesEdge) warnings.push({ id: "cropped", severity: "warning", title: "Package may be cropped", detail: "The detected silhouette reaches the image boundary.", recommendation: "Use an uncropped source or reconstruct hidden edges manually." });
  if (noObject) warnings.push({ id: "not-detected", severity: "warning", title: "Package not detected reliably", detail: "No dominant foreground contour was found.", recommendation: "Place four corners manually and choose a package template." });

  const confidence = noObject ? 0.22 : clamp(0.38 + contrast * 0.25 + sharpness * 0.2 + clamp(coverage / 0.5) * 0.1 - (touchesEdge ? 0.12 : 0));
  const result: ImageAnalysis = {
    version: 1,
    analysisVersion: "1.0.0",
    transformStack: [{ operation: "downsample", values: [scale] }, { operation: "grayscale-luminance", values: [0.299, 0.587, 0.114] }, { operation: "canny", values: [45, 135] }],
    workingImage: { width, height, scaleFromOriginal: scale, maxDimension },
    points,
    normalizedCorners: points,
    edges,
    faces: [{ id: "face-front", label: "front", pointIds: points.map((point) => point.id), confidence, approved: false }],
    vanishingDirections: [
      { id: "horizontal", direction: { x: 1, y: (points[1].y - points[0].y) / Math.max(0.001, points[1].x - points[0].x) }, confidence },
      { id: "vertical", direction: { x: (points[3].x - points[0].x) / Math.max(0.001, points[3].y - points[0].y), y: 1 }, confidence },
    ],
    rectificationMatrices: [{ faceId: "face-front", matrix3x3: [1, 0, 0, 0, 1, 0, 0, 0, 1], confidence: 0 }],
    candidates,
    quality: { width: sourceWidth, height: sourceHeight, brightness, contrast, sharpness, foregroundCoverage: coverage },
    warnings,
    confidence,
    processedAt: new Date().toISOString(),
    method: "local-gradient-and-contour",
  };
  progress(jobId, 0.94, "Ranking package structures");
  if (!cancelledJobs.has(jobId)) send({ version: 1, type: "result", jobId, result });
};

self.onmessage = (event: MessageEvent<AnalysisWorkerRequest>) => {
  const request = event.data;
  if (request.version !== 1) return;
  if (request.type === "cancel") {
    cancelledJobs.add(request.jobId);
    return;
  }
  cancelledJobs.delete(request.jobId);
  const operation = request.type === "analyse"
    ? analyse(request.jobId, request.image)
    : Promise.resolve().then(() => request.type === "preview"
      ? preview(request.jobId, request.image, request.settings)
      : rectify(request.jobId, request.image, request.corners));
  void operation.catch((error: unknown) => {
    send({
      version: 1,
      type: "failure",
      jobId: request.jobId,
      message: error instanceof Error ? error.message : "Image analysis failed.",
      recommendation: "Try a smaller image or continue with manual corner placement.",
    });
  });
};

export {};
