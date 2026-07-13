# Deployment

## Release gates

Run from a clean checkout with Node.js 22.13+:

```bash
npm ci
npm run check
npm run audit:release
npm run test:coverage
npm run desktop:web
```

The release is blocked by any lint warning, TypeScript error, failing unit/site test, dependency advisory, bundle-budget breach, invalid project fixture, or failed production build.

## Sites

Build with `npm run build`, package the exact validated source using the bundled Sites packager, save an immutable project version, then deploy that version publicly. No D1, R2, application API, credentials, or authentication are required at runtime. Verify the public URL with a fresh browser session, the guided sample, validation, SVG/JSON export, theme switch, offline-ready status, and a forced asset-failure check.

## Signed Windows build

Install Rust stable and Visual Studio 2022 Build Tools with the Desktop C++ workload. Store the trusted code-signing PFX outside the repository. Supply its location and password only through the process environment:

```powershell
$env:PDG_AUTHENTICODE_PFX = "C:\secure\codesigning.pfx"
$env:PDG_AUTHENTICODE_PASSWORD = Read-Host -AsSecureString | ConvertFrom-SecureString -AsPlainText
npm run release:signed
Remove-Item Env:PDG_AUTHENTICODE_PASSWORD
Remove-Item Env:PDG_AUTHENTICODE_PFX
```

`scripts/build-signed-windows.ps1` validates the certificate, uses a temporary ignored Tauri signing configuration, applies SHA-256 signatures with a trusted timestamp, removes temporary certificate state, verifies the application and installer signature chains, and runs `scripts/package-release.ps1`.

Tauri produces the NSIS setup below `src-tauri/target/release/bundle/nsis/`. The installer embeds the offline WebView2 bootstrapper, installs per-user, creates shortcuts and uninstall metadata, and associates `.pdgproj`. Release output contains:

- `Perspective-Dieline-Generator-Setup-v1.0.0.exe`
- portable ZIP with the signed executable and fixed runtime resources
- sample pack
- SHA-256 checksums
- updater manifest and signature when an updater signing key is supplied

Never publish an unsigned production artifact. `package-release.ps1 -AllowUnsigned` is reserved for isolated QA only.

## Windows verification

Use clean Windows 10 and Windows 11 x64 environments. Verify both Authenticode chains, install, launch, Start Menu and optional desktop shortcuts, `.pdgproj` association, offline analysis/export, upgrade preservation, uninstall, and preservation of user-selected project files. Updater-network failure must be non-blocking.

## GitHub release

Authenticate GitHub CLI to `Monokayser`, create the public MIT repository `Monokayser/perspective-dieline-generator`, push the validated commit, and publish the release only after Sites and Windows verification. Attach the signed installer, portable ZIP, sample pack, checksums, updater metadata, screenshots, release notes, and test report. Re-download every asset and verify its hash and signature before announcing the release.
