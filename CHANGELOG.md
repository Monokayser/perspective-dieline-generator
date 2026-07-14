# Changelog

## 1.1.2 - 2026-07-15

- Added consistent designer/developer attribution for S. M. Monowar Kayser to onboarding, Help/About, repository, web, package, Rust, and Windows metadata.
- Replaced the clipped mobile CSS mark with a shared square SVG component used by the top bar and onboarding.
- Preserved theme-aware face contrast while making compact and large marks scale independently at high device-pixel ratios.
- Replaced the legacy Windows icon with a high-contrast package-engineering mark generated for shortcut, taskbar, installer, and high-DPI sizes.
- Made editor and print-preview canvases preserve the generated artboard aspect ratio and display fitted-view metadata.
- Clarified the difference between fitted screen zoom and physical 1:1 production output.
- Expanded SVG dimension, mark geometry, responsive, high-density, and complete export regression coverage.
- Updated screenshots, documentation, Windows artifacts, checksums, and public release links for v1.1.2.

## 1.1.1 - 2026-07-15

- Replaced the low-contrast light-theme application mark with adaptive badge, face, border, and shadow tokens shared by the top bar and onboarding.
- Increased light-theme secondary-text and selected-accent contrast, and restored visible unselected dieline flap geometry on the white artboard.
- Made the shared Vite SPA the canonical static web build with `PDG_BASE_PATH` support for GitHub Pages and relative assets for offline Tauri use.
- Removed the obsolete Vinext, Next.js, Cloudflare worker, ChatGPT Sites wrapper, hosting manifest, and deployment-only dependencies.
- Added gated GitHub Pages deployment after the browser and Windows release jobs pass.
- Added both-theme mark contrast, axe-core, light-mode flap visibility, static metadata, asset path, and bundle regression checks.
- Updated the public URLs, screenshots, Windows artifacts, checksums, documentation, and release metadata for v1.1.1.

## 1.1.0 - 2026-07-14

- Redesigned the workbench as a premium dark-first engineering interface with an equivalent high-contrast light theme.
- Consolidated the workflow into Source, Analyze, Measure, Design, and Deliver phases with synchronized inspector and drawer state.
- Added deterministic bitmap preparation for rotation, flips, brightness, contrast, and saturation while preserving the original project image.
- Removed misleading tool modes, duplicated settings, duplicate project-export actions, and nonfunctional preparation controls.
- Reorganized exports around primary SVG, production PDF/DXF, and collapsed preview/data formats.
- Added Chromium, Firefox, and WebKit coverage at 360x800, 768x1024, 1440x900, and 1920x1080, plus complete desktop SVG workflows.
- Retained the native Windows Save As dialog and existing `.pdgproj` compatibility.

## 1.0.2 - 2026-07-14

- Removed the obsolete desktop updater endpoint and its broken v1.0.0 download link.
- Published release downloads through the verified GitHub release page.
- Retained the native Windows Save As export workflow and its focused failure handling.

## 1.0.1 - 2026-07-14

- Fixed Windows SVG export to always open the native Save dialog with drive, folder, and editable filename selection.
- Preserved the required export extension and reported the actual filename selected by the user.
- Added clean cancellation handling and actionable Windows errors for invalid paths, denied permissions, duplicate/locked files, missing folders, and full drives.
- Expanded native save and export pipeline coverage and re-ran the full web and desktop release gates.

## 1.0.0 - 2026-07-14

- Added the original eight-stage local-first reconstruction workflow and eight template/custom modes.
- Added lazy worker analysis, cancellation settlement, timeouts, structured failures, and quality warnings.
- Added unified progress, cancellation, success, and failure state across analysis, project I/O, validation, and exports.
- Added deterministic vector SVG/PDF/DXF plus guarded 300 dpi raster and versioned project exports.
- Hardened project schemas and ZIP imports; newer recoverable versions open read-only.
- Improved responsive drawers, touch targets, typography, tabs, focus management, forced colors, reduced motion, and screen-reader announcements.
- Removed unused authentication, API, D1/R2, database, and Drizzle starter scaffolding.
- Upgraded dependencies, removed all reported advisories, fixed stale render tests, and added bundle budgets.
- Added verified Authenticode release automation and retained the professional package/dieline icon across Windows artifacts.
