# Production Readiness Test Report

Test date: 2026-07-14  
Environment: Windows 11 x64, Node.js 22+, local Sites runtime, in-app Chromium browser runtime, Tauri/WebView2 build toolchain.

## Automated results

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript | Pass | `tsc --noEmit` |
| Lint | Pass | zero warnings with `--max-warnings=0` |
| Unit/property tests | Pass | 44 tests across 5 files, including native picker/read/write path behavior |
| Coverage | Pass | 72.98% statements, 77.50% lines |
| Sites build and render | Pass | local-first boot shell and metadata assertions |
| Dependency audit | Pass | zero advisories at low threshold |
| Initial JavaScript budget | Pass | largest non-worker chunk below 150 KiB gzip |
| CSS budget | Pass | aggregate CSS below 20 KiB gzip |
| CV isolation | Pass | OpenCV remains in a lazy worker and is absent from initial render |
| Desktop web build | Pass | production Tauri frontend compiled |
| Native Windows build | Pass | optimized x64 Tauri executable and offline-WebView2 NSIS bundle produced |
| Windows 11 installer QA | Pass | silent isolated install, launch, responsive process, and clean uninstall |
| Public Sites deployment | Pass | version 9 deployed and live workflow/export re-verified |

## Functional browser workflow

The guided sample was exercised from upload through local OpenCV initialization, candidate detection, measurement confirmation, rectangular-carton generation, editor selection tools, grid toggle, Image/Dieline/Print Preview views, validation, and JSON export. The analysis and export operations exposed semantic progress bars and completion messages. The generated model passed with zero validation errors and warnings. No horizontal page overflow was present at the measured 1280×720 viewport.

The same analysis/generation path was repeated on the public production deployment, followed by an editable SVG export. The live application reported zero validation errors and warnings, local/offline-ready status, 100% export completion, and a format-specific success announcement.

## Accessibility and responsive review

Verified semantic tab selection, progressbar roles, live status/error announcements, dialog focus traps and Escape behavior, drawer expanded/inert state, keyboard resizers, keyboard-operable layers, visible focus, reduced motion, forced colors, increased contrast, safe-area rules, and 44 px touch targets in compact breakpoints. Source includes compact drawer behavior below 1100 px and explicit layout rules for 320–2560 px ranges and 200% zoom resilience.

## Security and failure coverage

Tests cover traversal attempts, extreme compression ratios, malformed project geometry, newer read-only projects, missing geometry, cancelled saves, export progress, deterministic templates, unit conversion, and validation. Manual review covered corrupt image decode handling, 25 MiB/50 MP upload guards, 100 MP raster-export bounds, blocked invalid production export, and always-available recovery save.

## Windows package QA

The final v1.0.2 Windows build completed in 475.5 seconds and produced a 14,852,608-byte application plus a 212,218,348-byte NSIS installer containing the offline WebView2 runtime. File and product version metadata both report 1.0.2. The QA installer returned exit code 0, installed the application and uninstaller to an isolated per-user location, launched one responsive process at approximately 33.3 MB working set, and uninstalled with exit code 0. A user-data sentinel outside the install directory was preserved. Tauri capability validation confirms that only read/write commands for dialog-selected files are enabled; the dialog supplies runtime scope for the exact selected path. The obsolete updater plugin, capability, UI control, manifest, and broken v1.0.0 download path were removed.

Windows Graphics Capture could not snapshot the Tauri window on this host (`0x80004002: No such interface supported`), so visible installed-window capture is explicitly unverified. Browser and desktop-web surfaces were visually verified separately. The executable and installer are unsigned because no trusted Authenticode certificate was available; the release and README state this limitation and provide checksum verification instead of claiming Authenticode verification.

Published v1.0.2 artifact hashes:

- Installer: `81cfa92ee7eaa9b7b3f10fb4fbbb067813ffecebe1e70c71d8d482bf46e4cbd1`
- Portable ZIP: `1f53ed07a48024afd89c23ff045bd6da567b2bc5f3b5d5e3fdc54a16f743209e`
- Sample pack: `e1b30dfcef87ae23dae69bd3f1936d1ecb37ab00b616e8481d053e45fd2a2770`

## External verification still required

- Physical latest-two-version Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome device/browser matrix.
- Clean Windows 10 and Windows 11 virtual-machine install, upgrade, file-association, uninstall, and user-data preservation matrix.
- Production Authenticode chain and timestamp verification after the trusted PFX is supplied.
- Inkscape and available commercial vector-application import checks.
- Independent accessibility/security audit and real licensed-photo accuracy suite.

These items are not represented as passed until their required devices, credentials, certificates, or licensed fixtures are available.
