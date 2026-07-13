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
| Native Windows build | Pass | optimized x64 Tauri executable and offline-WebView2 NSIS bundle produced |
| Windows 11 installer QA | Pass | silent isolated install, launch, responsive process, and clean uninstall |
| Public Sites deployment | Pass | version 5 deployed and live workflow/export re-verified |

## Functional browser workflow

The guided sample was exercised from upload through local OpenCV initialization, candidate detection, measurement confirmation, rectangular-carton generation, editor selection tools, grid toggle, Image/Dieline/Print Preview views, validation, and JSON export. The analysis and export operations exposed semantic progress bars and completion messages. The generated model passed with zero validation errors and warnings. No horizontal page overflow was present at the measured 1280×720 viewport.

The same analysis/generation path was repeated on the public production deployment, followed by an editable SVG export. The live application reported zero validation errors and warnings, local/offline-ready status, 100% export completion, and a format-specific success announcement.

## Accessibility and responsive review

Verified semantic tab selection, progressbar roles, live status/error announcements, dialog focus traps and Escape behavior, drawer expanded/inert state, keyboard resizers, keyboard-operable layers, visible focus, reduced motion, forced colors, increased contrast, safe-area rules, and 44 px touch targets in compact breakpoints. Source includes compact drawer behavior below 1100 px and explicit layout rules for 320–2560 px ranges and 200% zoom resilience.

## Security and failure coverage

Tests cover traversal attempts, extreme compression ratios, malformed project geometry, newer read-only projects, missing geometry, cancelled saves, export progress, deterministic templates, unit conversion, and validation. Manual review covered corrupt image decode handling, 25 MiB/50 MP upload guards, 100 MP raster-export bounds, blocked invalid production export, and always-available recovery save.

## Windows package QA

The optimized Windows build completed in 466.6 seconds and produced an 18,159,104-byte application plus a 213,238,743-byte NSIS installer containing the offline WebView2 runtime. The QA installer returned exit code 0, installed the application and uninstaller to an isolated per-user location, launched one responsive application process at approximately 40 MB idle working set, and uninstalled with exit code 0. The test location no longer existed afterward.

Windows Graphics Capture could not snapshot the Tauri window on this host (`0x80004002: No such interface supported`), so visible installed-window capture is explicitly unverified. Browser and desktop-web surfaces were visually verified separately. The QA executable and installer are unsigned by design; the release script correctly blocks them from production packaging without `-AllowUnsigned`.

Unsigned QA artifact hashes (not production release hashes):

- Installer: `aac25fb6555a96900458e3d1a575e1b79439c373c4aae727727f36f2d990335e`
- Portable ZIP: `7ccbf3ea5a73fad4c8b82f0575ac73a192f0b8d9a68409d4ab3c2fda6443fde8`
- Sample pack: `2a34ed37676f8b3330277ff2f1d099c328dc60ebfbb7f4d3420ca67ea96baccb`

## External verification still required

- Physical latest-two-version Chrome, Edge, Firefox, Safari, iOS Safari, and Android Chrome device/browser matrix.
- Clean Windows 10 and Windows 11 virtual-machine install, upgrade, file-association, uninstall, and user-data preservation matrix.
- Production Authenticode chain and timestamp verification after the trusted PFX is supplied.
- Inkscape and available commercial vector-application import checks.
- Independent accessibility/security audit and real licensed-photo accuracy suite.

These items are not represented as passed until their required devices, credentials, certificates, or licensed fixtures are available.
