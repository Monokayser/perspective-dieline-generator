# Production Readiness Test Report

Test date: 2026-07-14

Release: 1.1.0

Environment: Windows 11 x64, Node.js 22+, Playwright Chromium/Firefox/WebKit, Tauri 2/WebView2 toolchain.

## Automated results

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `tsc --noEmit` |
| Lint | Pass | zero warnings with `--max-warnings=0` |
| Unit/property tests | Pass | 47 tests across 6 files |
| Coverage | Pass | 72.98% statements, 77.50% lines |
| Browser matrix | Pass | Chromium, Firefox, WebKit at 360x800, 768x1024, 1440x900, 1920x1080 |
| Desktop SVG workflow | Pass | complete sample analysis, measurement, generation, validation, and SVG download in all three engines |
| Automated accessibility | Pass | no serious or critical WCAG 2 A/AA or WCAG 2.1 AA findings from axe-core |
| Responsive layout | Pass | no document-level horizontal overflow at all 12 browser/viewport combinations |
| Sites build and render | Pass | local-first boot shell, metadata, and bundle-budget assertions |
| Dependency audit | Pass | zero advisories at the low threshold |
| Initial JavaScript budget | Pass | largest non-worker chunk below 150 KiB gzip |
| CSS budget | Pass | aggregate CSS below 20 KiB gzip |
| CV isolation | Pass | OpenCV remains lazy in the analysis worker |
| Rust checks | Pass | offline lock refresh followed by `cargo check --locked` |
| Desktop web/native build | Pass | optimized x64 executable and offline-WebView2 NSIS installer |
| Windows installer QA | Pass | silent isolated install, launch, responsive process, and clean uninstall |

## Browser and workflow coverage

The five-phase workbench was rendered in Chromium, Firefox, and WebKit at every target viewport. Checks covered phase semantics, typography fallbacks, minimum body text size, and page overflow. Full desktop workflows loaded the guided sample, ran local analysis, confirmed measurements, generated a 1:1 dieline, validated zero errors/warnings, and downloaded an editable SVG.

WebKit initially exposed a missing worker `OffscreenCanvas` implementation. Version 1.1.0 now prepares transferable `ImageData` on the main thread when needed while keeping analysis in the worker. The complete WebKit SVG workflow passes after this compatibility fix.

Focused tests cover native Save dialog selection, extension preservation, selected-path reporting, cancellation as a clean no-op, path reuse, invalid target paths, permission failures, and export-job cancellation. Preparation tests cover rotation normalization, dimension swaps, and deterministic tone filters. Project, template, unit, validation, archive-hardening, and bundle-budget coverage remains green.

## Accessibility and responsive review

Automated axe-core review reports no serious or critical WCAG findings on the desktop workbench. Semantic phase navigation, labeled inspector tabs, progress roles, status/error announcements, focus-managed drawers/dialogs, visible focus, reduced motion, forced colors, increased contrast, safe-area rules, 16 px mobile inputs, and 44 px compact touch targets are covered by source contracts and browser checks.

The 360 px mobile workbench keeps the five-phase navigation horizontally contained and uses a full-height tool drawer without document overflow. Desktop, tablet, and wide views preserve stable canvas and inspector geometry.

## Windows package QA

The v1.1.0 Windows build completed in 502.3 seconds. The optimized application is 14,854,656 bytes and reports file/product version 1.1.0. The offline-WebView2 NSIS installer is 212,218,361 bytes. Silent isolated installation returned exit code 0, the launched application remained responsive at approximately 33.4 MB working set, and silent uninstall returned exit code 0 with the install directory removed.

Windows Graphics Capture is unavailable on this host (`0x80004002: No such interface supported`), so installed-window screenshot automation and a visual click-through of the native file dialog could not be recorded. The installed executable launch is verified independently, and the native dialog/file adapter is covered by focused automated tests. The executable and installer are unsigned because no trusted Authenticode certificate was available; checksums are supplied without an Authenticode claim.

Release artifact hashes:

- Installer: `e5549febd6b393dac97fb9947bf515dcdd74a1a864f9ac7e1fab71c0280c9924`
- Portable ZIP: `7dd14c9147ecb66ea23c1fe46b448092ab82fd0ec8fa816d352554cf101d3681`
- Sample pack: `192cb89c5c137fb13685e0d59c78ae0bbaaf78d7297b4dbd21079f359f65dfee`

## External verification still required

- Physical current-version Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome device testing beyond Playwright emulation.
- Clean Windows 10 and Windows 11 virtual-machine upgrade, file-association, and SmartScreen review.
- Production Authenticode chain and timestamp verification after a trusted certificate is supplied.
- Inkscape and available commercial vector-application import checks.
- Independent accessibility/security audit and real licensed-photo accuracy suite.

These external items are documented limitations and are not represented as passed.
