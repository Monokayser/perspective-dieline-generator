# Deployment

## Release gates

From a clean checkout with Node.js 22.13+, Rust stable, and the Windows desktop toolchain:

```bash
npm ci
npm run check
npm run audit:release
npm run test:coverage
npm run test:e2e
npm run desktop:web
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

Any lint warning, TypeScript error, failing test, dependency advisory, budget breach, or failed native build blocks release.

## GitHub Pages

The `pages` job in `.github/workflows/ci.yml` runs only for non-PR events after both the complete web gate and Windows bundle gate pass. It sets `PDG_BASE_PATH=/perspective-dieline-generator/`, builds `dist/`, configures Pages with GitHub Actions as its source, uploads the static artifact, and deploys it with least-privilege `contents: read`, `pages: write`, and `id-token: write` permissions.

Canonical URL: https://monokayser.github.io/perspective-dieline-generator/

Verify the deployed root and hashed assets, refresh behavior, both themes, the guided sample, validation, SVG download, and 360 px layout in Chromium, Firefox, and WebKit. The app has no client-side routes, backend, credentials, or runtime cloud bindings.

## Windows build

Install Visual Studio 2022 Build Tools with the Desktop C++ workload. Run:

```powershell
npm run desktop:build
powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1 -Version 1.1.1 -AllowUnsigned
```

Tauri builds a current-user NSIS installer with offline WebView2, shortcuts, uninstall metadata, application/version icons, and `.pdgproj` association. The packaging script creates:

- `Perspective-Dieline-Generator-Setup-v1.1.1.exe`
- `Perspective-Dieline-Generator-Portable-v1.1.1-win-x64.zip`
- `Perspective-Dieline-Generator-Sample-Pack-v1.1.1.zip`
- `SHA256SUMS.txt`

Unsigned publication is allowed only when the release prominently states the SmartScreen limitation and supplies verified checksums. For Authenticode instructions, see `scripts/build-signed-windows.ps1`; signing credentials must remain outside the repository.

## Verification and release

Verify install, launch, native project dialogs, per-export Save As, extension preservation, cancellation, permission/path failures, clean uninstall, version metadata, icon resources, and checksums. Then push the validated commit, tag `v1.1.1`, create the GitHub Latest release, attach the installer, portable ZIP, sample pack, checksums, screenshots, release notes, and test report, and re-download each asset to verify size and SHA-256.

After GitHub Pages is confirmed publicly accessible, restrict the former hosted project to owner-only access and verify it no longer exposes the application anonymously.
