# Deployment

## Sites

Run `npm ci`, `npm test`, `npm run lint`, and `npm run build`. Package the project with the bundled Sites packager, save an immutable project version, then deploy that exact version publicly. The app requires no D1 or R2 binding.

## Windows

Install Rust stable and Visual Studio 2022 Build Tools with the Desktop C++ workload. Run `npm run desktop:build`. Tauri produces an NSIS setup executable under `src-tauri/target/release/bundle/nsis/`. The configuration embeds the offline WebView2 installer, creates shortcuts/uninstall metadata, and associates `.pdgproj`.

Release automation should rename the setup to `Perspective-Dieline-Generator-Setup-v1.0.0.exe`, create SHA-256 checksums, zip the raw executable and fixed resources for the portable package, and sign updater artifacts with a secret Tauri updater key. Authenticode signing is intentionally absent in v1.
