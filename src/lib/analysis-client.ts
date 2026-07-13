import type { ImageAnalysis } from "../domain/types";
import type { AnalysisWorkerResponse } from "../workers/protocol";

let worker: Worker | null = null;
let activeJobId: string | null = null;

const getWorker = () => {
  if (!worker) worker = new Worker(new URL("../workers/analysis.worker.ts", import.meta.url), { type: "module" });
  return worker;
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export const analyseImage = async (
  imageDataUrl: string,
  onProgress: (progress: number, stage: string) => void,
): Promise<ImageAnalysis> => {
  const jobId = crypto.randomUUID();
  activeJobId = jobId;
  const image = await createImageBitmap(await dataUrlToBlob(imageDataUrl), { imageOrientation: "from-image" });
  const analysisWorker = getWorker();
  return new Promise<ImageAnalysis>((resolve, reject) => {
    const handleMessage = (event: MessageEvent<AnalysisWorkerResponse>) => {
      const message = event.data;
      if (message.jobId !== jobId) return;
      if (message.type === "progress") onProgress(message.progress, message.stage);
      if (message.type === "result") {
        analysisWorker.removeEventListener("message", handleMessage);
        activeJobId = null;
        resolve(message.result);
      }
      if (message.type === "failure") {
        analysisWorker.removeEventListener("message", handleMessage);
        activeJobId = null;
        reject(new Error(`${message.message} ${message.recommendation}`));
      }
    };
    analysisWorker.addEventListener("message", handleMessage);
    analysisWorker.postMessage({ version: 1, type: "analyse", jobId, image }, [image]);
  });
};

export const cancelAnalysis = () => {
  if (!activeJobId || !worker) return;
  worker.postMessage({ version: 1, type: "cancel", jobId: activeJobId });
  activeJobId = null;
};

