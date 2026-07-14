import type { ImageAnalysis } from "../domain/types";
import type { AnalysisWorkerResponse } from "../workers/protocol";

let worker: Worker | null = null;
let activeJob: { id: string; reject: (error: Error) => void; timer: number } | null = null;

export class AnalysisCancelledError extends Error {
  constructor() {
    super("Image analysis was cancelled.");
    this.name = "AnalysisCancelledError";
  }
}

const getWorker = () => {
  if (!worker) worker = new Worker(new URL("../workers/analysis.worker.ts", import.meta.url), { type: "module" });
  return worker;
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const analysisRequest = (jobId: string, image: ImageBitmap) => {
  if (typeof OffscreenCanvas !== "undefined") {
    return {
      message: { version: 1 as const, type: "analyse" as const, jobId, image },
      transfer: [image] satisfies Transferable[],
    };
  }

  const maxDimension = 4096;
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas analysis is not available in this browser.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return {
    message: {
      version: 1 as const,
      type: "analyse" as const,
      jobId,
      imageData,
      sourceWidth,
      sourceHeight,
    },
    transfer: [imageData.data.buffer as ArrayBuffer] satisfies Transferable[],
  };
};

export const analyseImage = async (
  imageDataUrl: string,
  onProgress: (progress: number, stage: string) => void,
): Promise<ImageAnalysis> => {
  if (activeJob) cancelAnalysis();
  const jobId = crypto.randomUUID();
  onProgress(0.03, "Loading local vision engine");
  const image = await createImageBitmap(await dataUrlToBlob(imageDataUrl), { imageOrientation: "from-image" });
  const analysisWorker = getWorker();
  const request = analysisRequest(jobId, image);
  return new Promise<ImageAnalysis>((resolve, reject) => {
    const cleanup = () => {
      analysisWorker.removeEventListener("message", handleMessage);
      analysisWorker.removeEventListener("error", handleError);
      if (activeJob?.id === jobId) {
        window.clearTimeout(activeJob.timer);
        activeJob = null;
      }
    };
    const handleMessage = (event: MessageEvent<AnalysisWorkerResponse>) => {
      const message = event.data;
      if (message.jobId !== jobId) return;
      if (message.type === "progress") onProgress(message.progress, message.stage);
      if (message.type === "result") {
        cleanup();
        resolve(message.result);
      }
      if (message.type === "failure") {
        cleanup();
        reject(new Error(`${message.message} ${message.recommendation}`));
      }
    };
    const handleError = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message || "The local analysis worker stopped unexpectedly."));
    };
    analysisWorker.addEventListener("message", handleMessage);
    analysisWorker.addEventListener("error", handleError);
    const timer = window.setTimeout(() => {
      analysisWorker.postMessage({ version: 1, type: "cancel", jobId });
      cleanup();
      reject(new Error("Local analysis exceeded the two-minute safety timeout. Try a smaller image or continue manually."));
    }, 120_000);
    activeJob = { id: jobId, reject: (error) => { cleanup(); reject(error); }, timer };
    analysisWorker.postMessage(request.message, request.transfer);
  });
};

export const cancelAnalysis = () => {
  if (!activeJob || !worker) return false;
  const job = activeJob;
  worker.postMessage({ version: 1, type: "cancel", jobId: job.id });
  job.reject(new AnalysisCancelledError());
  return true;
};
