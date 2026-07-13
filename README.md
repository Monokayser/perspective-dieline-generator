# Perspective Dieline Generator

Local-first software for turning a perspective package photograph into confirmed measurements and an editable, 1:1 vector dieline. The same React/TypeScript workbench runs as a public Sites web app and a Tauri 2 Windows desktop app.

## What ships in v1

- Eight-stage workflow: Upload, Detect, Correct, Measure, Generate, Edit, Validate, Export.
- Cancellable local worker analysis with OpenCV.js Canny/contours, deterministic fallback analysis, normalized annotations, quality warnings, confidence scoring, previews, and quadrilateral rectification.
- Parametric rectangular carton, cube, straight tuck, reverse tuck, sleeve, mailer, triangular closure, and custom starting structures.
- Native SVG editing, stable semantic IDs, layers, selection transforms, undo/redo, validation, and 1:1 export.
- Mandatory editable SVG and safe `.pdgproj`; vector PDF, layered DXF, 300 dpi PNG/JPG, and JSON exports.
- IndexedDB recovery on web; Tauri local desktop shell with an offline WebView2 NSIS configuration.

Images are never sent to an application backend. A single image cannot reveal hidden dimensions, so inferred proportions never become confirmed manufacturing measurements automatically.

## Development

Requirements: Node.js 22.13+, npm, and—only for Windows packaging—Rust plus Visual Studio C++ Build Tools.

```bash
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run desktop:web
npm run desktop:build
```

The Sites build is emitted to `dist/`. The Tauri SPA is emitted to `desktop-dist/`; native artifacts are emitted below `src-tauri/target/release/bundle/`.

## Safety and data contracts

Canonical geometry uses double-precision millimetres. Image annotations are normalized to `[0,1]`. `.pdgproj` is a ZIP containing versioned `project.json`, an optional original image, and `manifest.json`; import rejects traversal, oversized expansion, malformed fields, and unsupported newer schemas.

See [User guide](docs/USER_GUIDE.md), [Calibration guide](docs/CALIBRATION_GUIDE.md), [Architecture](docs/ARCHITECTURE.md), [CV pipeline](docs/COMPUTER_VISION.md), [Templates](docs/TEMPLATES.md), [Deployment](docs/DEPLOYMENT.md), and [Privacy and limitations](docs/PRIVACY_AND_LIMITATIONS.md).

## Reference image

The supplied watermarked Alamy image was used only as private structural guidance. It is not included in the application, fixtures, samples, installers, or public deployment.

## License and release status

Source distribution is private by default. Public releases contain binaries, checksums, samples, and documentation. v1 Windows binaries are not Authenticode-signed, so Windows SmartScreen may display a reputation warning.
