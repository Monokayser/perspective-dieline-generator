import type { ImageAnalysis } from "../domain/types";
import type { Point, PreprocessSettings } from "../domain/types";

export type AnalysisRequest = {
  version: 1;
  type: "analyse";
  jobId: string;
  image: ImageBitmap;
};

export type CancelRequest = { version: 1; type: "cancel"; jobId: string };
export type PreviewRequest = { version: 1; type: "preview"; jobId: string; image: ImageBitmap; settings: PreprocessSettings };
export type RectifyRequest = { version: 1; type: "rectify"; jobId: string; image: ImageBitmap; corners: [Point, Point, Point, Point] };

export type AnalysisWorkerRequest = AnalysisRequest | PreviewRequest | RectifyRequest | CancelRequest;

export type AnalysisWorkerResponse =
  | { version: 1; type: "progress"; jobId: string; progress: number; stage: string }
  | { version: 1; type: "result"; jobId: string; result: ImageAnalysis }
  | { version: 1; type: "preview-result"; jobId: string; image: ImageBitmap }
  | { version: 1; type: "rectify-result"; jobId: string; image: ImageBitmap; matrix3x3: number[] }
  | { version: 1; type: "failure"; jobId: string; message: string; recommendation: string };
