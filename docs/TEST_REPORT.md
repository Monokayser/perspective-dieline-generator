# Production Readiness Test Report

Test date: 2026-07-15

Release: 1.1.1

Environment: Windows 11 x64, Node.js 22+, Playwright Chromium/Firefox/WebKit, Rust stable, Tauri 2, and WebView2 toolchain.

## Automated results

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `tsc --noEmit` |
| Lint | Pass | zero warnings with `--max-warnings=0` |
| Unit/property tests | Pass | 47 tests across 6 files |
| Coverage | Pass | 72.98% statements, 77.50% lines |
| Browser matrix | Pass | Chromium, Firefox, WebKit at 360x800, 768x1024, 1440x900, and 1920x1080 |
| Desktop SVG workflow | Pass | complete sample analysis through SVG download in all three engines |
| Theme and mark contrast | Pass | adaptive mark assertions in both themes at all 12 browser/viewport combinations |
| Automated accessibility | Pass | no serious or critical axe-core findings in light or dark mode |
| Responsive layout | Pass | zero document-level horizontal overflow in all 12 combinations |
| Static GitHub Pages build | Pass | metadata, canonical URL, hashed asset, repository-base, boot-shell, and budget checks |
| Dependency audit | Pass | zero advisories at the low threshold |
| Initial JavaScript budget | Pass | largest non-worker chunk 118.72 KiB gzip, below 150 KiB |
| CSS budget | Pass | 16.13 KiB gzip, below 20 KiB |
| CV isolation | Pass | OpenCV remains lazy in the analysis worker |
| Rust checks | Pass | `cargo check --locked` |
| Windows build | Pass | optimized v1.1.1 x64 executable and offline-WebView2 NSIS installer |
| Windows installer QA | Pass | isolated silent install, responsive launch, and clean silent uninstall |

## Browser and UI coverage

The five-phase workbench rendered in Chromium, Firefox, and WebKit at each target viewport. Checks cover phase semantics, font fallbacks, body text size, mark visibility, light/dark switching, flap visibility on the light artboard, and page overflow. Full desktop workflows load the guided sample, run local analysis, confirm measurements, generate a 1:1 dieline, validate zero errors/warnings, and download editable SVG in all three engines.

The initial v1.1.1 matrix exposed light-theme secondary text at 3.89-4.14:1 and a selected accent at 4.41:1. The semantic text/accent tokens were corrected and the complete matrix passed. Adaptive mark face/background contrast is at least 3:1, and unselected panel strokes remain visible at 0.24 model units.

Focused tests retain native Save dialog selection, extension preservation, selected-path reporting, cancellation as a no-op, path reuse, invalid targets, permission failures, and export cancellation. Preparation tests retain rotation normalization, dimension swaps, tone filters, cancellation, original-image preservation, and prepared analysis input. Project, template, units, validation, archive-hardening, and output contracts remain green.

## Windows package QA

The v1.1.1 native build completed successfully in both clean and final-source passes. The optimized executable is 17,030,144 bytes and reports file/product version 1.1.1. The final offline-WebView2 NSIS installer is 214,421,443 bytes. Isolated silent installation returned 0; the installed application remained running and responsive at approximately 35.3 MB working set; silent uninstall returned 0 and removed the installation directory.

Windows Graphics Capture is unavailable on this host (`0x80004002: No such interface supported`), so an installed-window screenshot and visual native-dialog click-through could not be recorded. Launch behavior is independently verified and the native dialog/filesystem adapter has focused automated coverage. The executable and installer are unsigned because no trusted Authenticode certificate was supplied.

Release hashes:

- Installer: `8d67106c2cba2057602f618fd41b96d1c0e045766102f2382f74633ad56b7b95`
- Portable ZIP: `57d99f9bdbfce98251fdb2a99145305cd8ff79f5aa12e6de7b14e4ebe1dcca90`
- Sample pack: `192cb89c5c137fb13685e0d59c78ae0bbaaf78d7297b4dbd21079f359f65dfee`

## External limitations

- Physical-device testing beyond Playwright browser engines and viewport emulation.
- Clean Windows 10 and Windows 11 VM upgrade, file-association, and SmartScreen review.
- Authenticode chain and timestamp verification after a trusted certificate is supplied.
- Commercial vector-application certification and an independent accessibility/security audit.
- Real licensed-photo accuracy suite and physical manufacturing prototype review.

These items are documented limits and are not represented as passed.
