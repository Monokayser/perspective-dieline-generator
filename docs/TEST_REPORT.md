# Production Readiness Test Report

Test date: 2026-07-14  
Environment: Windows 11 x64, Node.js 22+, local Sites runtime, in-app Chromium browser runtime, Tauri/WebView2 build toolchain.

## Automated results

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `tsc --noEmit` |
| Lint | Pass | zero warnings with `--max-warnings=0` |
| Unit/property tests | Pass | 36 tests across 5 files |
| Coverage | Pass | 72.98% statements, 77.50% lines |
| Sites build and render | Pass | local-first boot shell and metadata assertions |
| Dependency audit | Pass | zero advisories at low threshold |
| Initial JavaScript budget | Pass | largest non-worker chunk below 150 KiB gzip |
| CSS budget | Pass | aggregate CSS below 20 KiB gzip |
| CV isolation | Pass | OpenCV remains in a lazy worker and is absent from initial render |
| Desktop web build | Pass | production Tauri frontend compiled |

## Functional browser workflow

The guided sample was exercised from upload through local OpenCV initialization, candidate detection, measurement confirmation, rectangular-carton generation, editor selection tools, grid toggle, Image/Dieline/Print Preview views, validation, and JSON export. The analysis and export operations exposed semantic progress bars and completion messages. The generated model passed with zero validation errors and warnings. No horizontal page overflow was present at the measured 1280×720 viewport.

## Accessibility and responsive review

Verified semantic tab selection, progressbar roles, live status/error announcements, dialog focus traps and Escape behavior, drawer expanded/inert state, keyboard resizers, keyboard-operable layers, visible focus, reduced motion, forced colors, increased contrast, safe-area rules, and 44 px touch targets in compact breakpoints. Source includes compact drawer behavior below 1100 px and explicit layout rules for 320–2560 px ranges and 200% zoom resilience.

## Security and failure coverage

Tests cover traversal attempts, extreme compression ratios, malformed project geometry, newer read-only projects, missing geometry, cancelled saves, export progress, deterministic templates, unit conversion, and validation. Manual review covered corrupt image decode handling, 25 MiB/50 MP upload guards, 100 MP raster-export bounds, blocked invalid production export, and always-available recovery save.

## External verification still required

- Physical latest-two-version Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome device/browser matrix.
- Clean Windows 10 and Windows 11 virtual-machine install, upgrade, file-association, uninstall, and user-data preservation matrix.
- Production Authenticode chain and timestamp verification after the trusted PFX is supplied.
- Inkscape and available commercial vector-application import checks.
- Independent accessibility/security audit and real licensed-photo accuracy suite.

These items are not represented as passed until their required devices, credentials, certificates, or licensed fixtures are available.
