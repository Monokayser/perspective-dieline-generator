# Computer-vision pipeline

Analysis runs in a cancellable Web Worker. The original image is preserved; the working image is capped at 4096 px on its longest edge. The pipeline computes luminance, contrast, Laplacian edge energy, sampled-border foreground separation, OpenCV.js Gaussian blur/Canny/external contours, a deterministic fallback contour, normalized corner proposals, typed edges, a visible face, directional estimates, family rankings, confidence, and warnings.

Preview messages support rotation, flips, tonal filters, grayscale, threshold, and gradient edge views. Rectify messages solve an eight-parameter homography from four normalized points and resample a face locally. Analysis messages report progress, structured failure, results, and cancellation by job ID.

Confidence bands are High ≥ 0.80, Medium ≥ 0.55, Low ≥ 0.35, and Manual below 0.35. Low resolution, blur, weak contrast, crop, reflection, deformation, complex background, and no-object conditions are surfaced when their detectors fire. Difficult images always retain manual corner, edge, face, guide, calibration, and dimension controls.

This pipeline assists annotation; it does not infer hidden panels or certify manufacturing dimensions.
