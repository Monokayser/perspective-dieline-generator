# Changelog

## 1.0.2 - 2026-07-14

- Removed the obsolete desktop updater endpoint and its broken v1.0.0 download link.
- Published release downloads through the verified GitHub release page.
- Retained the native Windows Save As export workflow and its focused failure handling.

## 1.0.1 - 2026-07-14

- Fixed Windows SVG export to always open the native Save dialog with drive, folder, and editable filename selection.
- Preserved the required export extension and reported the actual filename selected by the user.
- Added clean cancellation handling and actionable Windows errors for invalid paths, denied permissions, duplicate/locked files, missing folders, and full drives.
- Expanded native save and export pipeline coverage and re-ran the full web and desktop release gates.

## 1.0.0 — 2026-07-14

- Added the eight-stage local-first reconstruction workflow and eight template/custom modes.
- Added lazy worker analysis, cancellation settlement, timeouts, structured failures, and quality warnings.
- Added unified progress, cancellation, success, and failure state across analysis, project I/O, validation, and exports.
- Added deterministic vector SVG/PDF/DXF plus guarded 300 dpi raster and versioned project exports.
- Hardened project schemas and ZIP imports; newer recoverable versions open read-only.
- Improved responsive drawers, touch targets, typography, tabs, focus management, forced colors, reduced motion, and screen-reader announcements.
- Removed unused authentication, API, D1/R2, database, and Drizzle starter scaffolding.
- Upgraded dependencies, removed all reported advisories, fixed stale render tests, and added bundle budgets.
- Added verified Authenticode release automation and retained the professional package/dieline icon across Windows artifacts.
