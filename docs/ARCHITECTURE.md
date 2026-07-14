# Architecture

The project has one React/TypeScript dependency graph and two build targets:

- `desktop/index.html` and `desktop/main.tsx` are the shared Vite entry.
- `vite.web.config.ts` emits the static GitHub Pages artifact to `dist/` and reads `PDG_BASE_PATH`.
- `vite.desktop.config.ts` emits relative offline assets to `desktop-dist/` for `src-tauri/`.
- `src/components/` implements the shared five-phase workbench.
- `src/styles/` owns semantic light/dark tokens, typography, responsive drawers, and accessibility preferences.
- `src/domain/` owns units, contracts, templates, validation, projects, image preparation, and exporters.
- `src/workers/` owns the versioned local analysis protocol and lazy OpenCV.js worker.
- `src/store/` owns project state and command history.
- `src-tauri/` owns the Windows shell, native dialogs/filesystem adapter, CSP, icon, associations, and NSIS bundle.

Image-derived values remain separate from manufacturing geometry. Analysis produces normalized candidates; calibration produces values with provenance; confirmed template parameters produce deterministic millimetre panels and paths. Direct topology edits enable custom mode while retaining semantic IDs where possible.

SVG export writes physical width and height, a millimetre viewBox, editable paths, and named layer groups. Project import treats ZIP and JSON content as untrusted and validates paths, expanded size, schema, and version before loading.

GitHub Pages serves only static assets. There is no application API, account system, database, or project synchronization service. Browser downloads use browser policy; the Tauri adapter grants access only to a path selected in a native dialog.
