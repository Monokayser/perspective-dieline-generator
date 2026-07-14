# Perspective Dieline Generator 1.1.0

Version 1.1.0 is a focused redesign of the local-first packaging workbench. It keeps the compatible project and export contracts from v1.0.2 while making the complete path from source image to production SVG clearer, faster to scan, and usable down to 360 px.

## Release highlights

- Five synchronized phases: Source, Analyze, Measure, Design, and Deliver.
- Premium near-black engineering UI with restrained violet/cyan focus treatment and an equivalent light theme.
- Self-hosted Inter Variable with robust system fallbacks, stable type sizes, 16 px mobile form controls, and tabular measurement numerals.
- Real bitmap preparation for rotation, horizontal/vertical flips, brightness, contrast, and saturation before display and analysis; the original project image remains untouched.
- Direct draggable annotation correction with misleading cosmetic tool modes removed.
- Labeled Properties, Layers, Validate, and Export tabs; phase navigation opens the relevant workspace and inspector state automatically.
- SVG remains the primary export, PDF/DXF are grouped as production formats, and preview/data formats are collapsed until needed.
- Native Windows project Open/Save/Save As and per-export destination pickers with least-privilege selected-file access.
- Windows Save dialogs accept any available drive/folder and edited filename, use native overwrite confirmation, and surface actionable path, permission, locked-file, and disk-space failures. Cancel writes nothing.
- Automated Chromium, Firefox, and WebKit checks at 360x800, 768x1024, 1440x900, and 1920x1080 plus full desktop SVG workflows.

## Windows package

The installer embeds the offline WebView2 runtime so a clean Windows system does not need a separate web-runtime setup. The attached installer and portable ZIP are **unsigned** because a trusted Authenticode certificate was not available. Windows SmartScreen may warn before launch. Verify `SHA256SUMS.txt` before running an artifact; no Authenticode claim is made for this release.

## Manufacturing and vision limitations

One photograph cannot reveal hidden dimensions. Real-photo accuracy depends on focus, occlusion, reflection, lens distortion, deformation, and manual correction. Confirm every required dimension and review a physical prototype before manufacturing.

See the [test report](docs/TEST_REPORT.md), [user guide](docs/USER_GUIDE.md), and [deployment guide](docs/DEPLOYMENT.md).
