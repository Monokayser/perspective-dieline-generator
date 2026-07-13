# Architecture

The project is one dependency graph with two shells:

- `app/` is the Sites/vinext shell.
- `desktop/` is the Vite SPA entry consumed by `src-tauri/`.
- `src/domain/` contains units, contracts, templates, validation, project archives, and exporters.
- `src/workers/` owns the versioned local analysis protocol and OpenCV.js worker.
- `src/store/` provides the command history and project state.
- `src/components/` implements the shared Precision Workshop workbench.

Image-derived values are separated from manufacturing geometry. Analysis produces normalized candidates; calibration produces measurement values with provenance; confirmed template parameters produce deterministic millimetre panels and paths. Direct topology edits flip `customMode`, preserving semantic IDs where possible.

SVG export writes physical `width`/`height`, a millimetre `viewBox`, editable paths, and named layer groups. Project import treats ZIP and JSON content as untrusted and validates paths, expanded size, schema, and version before loading.
