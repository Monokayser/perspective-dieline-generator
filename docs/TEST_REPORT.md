# Production Readiness Test Report

Test date: 2026-07-15

Release: 1.1.2

Environment: Windows 11 x64, Node.js 22+, Playwright Chromium/Firefox/WebKit, Rust stable, Tauri 2, and WebView2 toolchain.

## Automated results

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `tsc --noEmit` |
| Lint | Pass | zero warnings with `--max-warnings=0` |
| Unit/property tests | Pass | 50 tests across 7 files |
| Coverage | Pass | 72.98% statements, 77.50% lines |
| Browser matrix | Pass | Chromium, Firefox, WebKit at 360x800, 768x1024, 1440x900, and 1920x1080 |
| Desktop SVG workflow | Pass | complete sample analysis through SVG download in all three engines |
| Theme and mark contrast | Pass | SVG face contrast and viewBox bounds in both themes at all 12 browser/viewport combinations |
| Automated accessibility | Pass | no serious or critical axe-core findings in light or dark mode |
| Responsive layout | Pass | zero document-level horizontal overflow in all 12 combinations |
| Static GitHub Pages build | Pass | metadata, canonical URL, hashed asset, repository-base, boot-shell, and budget checks |
| Dependency audit | Pass | zero advisories at the low threshold |
| Initial JavaScript budget | Pass | largest non-worker chunk 119.32 KiB gzip, below 150 KiB |
| CSS budget | Pass | 16.23 KiB gzip, below 20 KiB |
| CV isolation | Pass | OpenCV remains lazy in the analysis worker |
| Rust checks | Pass | `cargo check --locked` |
| Windows build | Pass | optimized v1.1.2 x64 executable and offline-WebView2 NSIS installer |
| Windows installer QA | Pass | isolated silent install, responsive launch, and clean silent uninstall |

## Browser and UI coverage

The five-phase workbench rendered in Chromium, Firefox, and WebKit at each target viewport. The matrix executed 29 scoped checks with 31 intentional project skips. Checks cover phase semantics, font fallbacks, body text size, scalable mark bounds, light/dark switching, flap visibility on the light artboard, artboard ratio, and page overflow. Full desktop workflows load the guided sample, run local analysis, confirm measurements, generate production-scale geometry, validate zero errors/warnings, and download editable SVG in all three engines.

The compact SVG application mark remains square and unclipped at 360x800, 768x1024, 1440x900, and 1920x1080, including a 3x device-pixel-ratio phone. Every face stays inside the fixed viewBox and meets the non-text contrast assertion in both themes. Wide, tall, and square artboard contain-fit tests preserve exact model ratios; editor and print-preview metadata distinguish fitted screen views from physical 1:1 output.

Focused tests retain native Save dialog selection, extension preservation, selected-path reporting, cancellation as a no-op, path reuse, invalid targets, permission failures, and export cancellation. Preparation tests retain rotation normalization, dimension swaps, tone filters, cancellation, original-image preservation, and prepared analysis input. Project, template, units, validation, archive-hardening, and output contracts remain green.

## Windows package QA

The v1.1.2 native build completed successfully after invalidating the application resource cache. The optimized executable is 17,039,360 bytes, reports file/product version 1.1.2, and contains the verified new package-engineering icon. The final offline-WebView2 NSIS installer is 214,429,216 bytes. Isolated silent installation returned 0; the installed application remained running and responsive at approximately 35.2 MiB working set; silent uninstall returned 0 and removed the installation directory.

Windows Graphics Capture is unavailable on this host (`0x80004002: No such interface supported`), so an installed-window screenshot and visual native-dialog click-through could not be recorded. Launch behavior is independently verified and the native dialog/filesystem adapter has focused automated coverage. The executable and installer are unsigned because no trusted Authenticode certificate was supplied.

Release hashes:

- Installer: `ea631d13861b309b6fe5c60d3e52be662ac5ff2d393cce3a8adb66ee57aeb870`
- Portable ZIP: `4df83dbd51407e47aae88b63a4bfcce7953f6921c0984ad9f26414a5d51336de`
- Sample pack: `192cb89c5c137fb13685e0d59c78ae0bbaaf78d7297b4dbd21079f359f65dfee`

## External limitations

- Physical-device testing beyond Playwright browser engines and viewport emulation.
- Clean Windows 10 and Windows 11 VM upgrade, file-association, and SmartScreen review.
- Authenticode chain and timestamp verification after a trusted certificate is supplied.
- Commercial vector-application certification and an independent accessibility/security audit.
- Real licensed-photo accuracy suite and physical manufacturing prototype review.

These items are documented limits and are not represented as passed.
