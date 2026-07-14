# Perspective Dieline Generator 1.1.1

Version 1.1.1 is a compatibility and publishing release. It preserves v1.1.0 project, geometry, export, and native Save As contracts while making GitHub Pages the canonical public host and correcting light-theme contrast issues reported from the production UI.

## Highlights

- Adaptive package mark with theme-specific background, three faces, border, and shadow; the existing blue raster icon remains on Windows, shortcuts, file associations, and favicons.
- Clear unselected flap and panel geometry on the light artboard, plus stronger secondary-text and selected-tab contrast.
- A single Vite SPA build shared by the web app and Tauri desktop shell.
- Repository-aware `PDG_BASE_PATH` for GitHub Pages and relative offline asset URLs for Windows.
- Removed the retired Vinext/Next/Cloudflare deployment wrapper and its dependencies.
- GitHub Pages deployment is gated on lint, TypeScript, unit/coverage, static build, bundle budgets, dependency audit, Chromium/Firefox/WebKit workflows, and Windows bundling.
- Native Windows SVG Save As remains unchanged: choose any available drive/folder and filename, confirm or cancel, and receive actionable path or permission errors.

## Downloads

- Live app: https://monokayser.github.io/perspective-dieline-generator/
- Release: https://github.com/Monokayser/perspective-dieline-generator/releases/tag/v1.1.1
- Installer: `Perspective-Dieline-Generator-Setup-v1.1.1.exe`
- Portable: `Perspective-Dieline-Generator-Portable-v1.1.1-win-x64.zip`
- Sample pack and `SHA256SUMS.txt` are attached to the release.

The Windows artifacts include offline WebView2 and are **unsigned** because no trusted Authenticode certificate was supplied. Windows SmartScreen may warn. Verify `SHA256SUMS.txt`; no Authenticode claim is made.

## Limitations

A single photograph cannot reveal hidden dimensions. Confirm all required dimensions and inspect a physical prototype before manufacturing. Web downloads follow browser settings; unrestricted drive/folder selection remains exclusive to the Windows app.
