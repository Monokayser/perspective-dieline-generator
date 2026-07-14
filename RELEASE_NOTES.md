# Perspective Dieline Generator 1.0.1

This patch release hardens Windows SVG export while retaining the local-first workflow from perspective package photography to confirmed measurements and editable 1:1 SVG geometry.

## Release highlights

- Lazy, cancellable computer-vision analysis with explicit initialization and processing progress.
- Deterministic parametric template generation with required-dimension confirmation.
- Accessible native-SVG editing, validation, responsive drawers, light/dark themes, and print preview.
- Async SVG, PDF, DXF, 300 dpi PNG/JPG, JSON, and `.pdgproj` exports with progress and format-specific outcomes.
- Native Windows project Open/Save/Save As and per-export destination pickers with least-privilege selected-file access.
- Windows Save dialogs accept any available drive/folder and an edited filename, enforce the expected extension, use native overwrite confirmation, and surface actionable path, permission, locked-file, and disk-space failures.
- Cancelling an export is a clean no-op and the completion message reports the actual selected filename and path.
- Hardened project import, newer-version read-only mode, recovery, dependency upgrades, CSP, and zero known npm advisories.
- Professional package/dieline icon applied to web metadata, executable, installer, shortcuts, and file association.

## Manufacturing and vision limitations

One photograph cannot reveal hidden dimensions. Real-photo accuracy depends on focus, occlusion, reflection, lens distortion, deformation, and manual correction. All required template dimensions must be confirmed, and physical prototypes must be reviewed before manufacturing.

The attached Windows packages are published as an **unsigned pre-release** because a trusted Authenticode certificate was not available. Windows SmartScreen may warn before launch; verify the attached `SHA256SUMS.txt` before running the installer. A signed production release remains gated on certificate-backed Authenticode verification. See [Test report](docs/TEST_REPORT.md) and [Deployment](docs/DEPLOYMENT.md).
