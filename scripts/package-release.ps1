param([string]$Version = "1.1.0", [switch]$AllowUnsigned)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$target = Join-Path $root "src-tauri\target\release"
$bundle = Join-Path $target "bundle\nsis"
$release = [System.IO.Path]::GetFullPath((Join-Path $root "release"))
$portable = Join-Path $release "portable"

if (-not (Test-Path -LiteralPath $target)) { throw "Run npm run desktop:build before packaging a release." }
if (-not (Test-Path -LiteralPath $bundle)) { throw "The NSIS bundle directory is missing." }

$rootPath = [System.IO.Path]::GetFullPath($root.Path) + [System.IO.Path]::DirectorySeparatorChar
if (-not $release.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to recreate a release directory outside the project workspace."
}
if (Test-Path -LiteralPath $release) { Remove-Item -LiteralPath $release -Recurse -Force }
New-Item -ItemType Directory -Force -Path $release, $portable | Out-Null
$setupSource = Get-ChildItem -LiteralPath $bundle -Filter "*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $setupSource) { throw "No NSIS setup executable was produced." }
$setupName = "Perspective-Dieline-Generator-Setup-v$Version.exe"
Copy-Item -LiteralPath $setupSource.FullName -Destination (Join-Path $release $setupName) -Force
$setupSignature = "$($setupSource.FullName).sig"
if (Test-Path -LiteralPath $setupSignature) {
  Copy-Item -LiteralPath $setupSignature -Destination (Join-Path $release "$setupName.sig") -Force
}

$appExe = Join-Path $target "perspective-dieline-generator.exe"
if (-not (Test-Path -LiteralPath $appExe)) { throw "The desktop executable is missing." }
$signatureTargets = @($appExe, $setupSource.FullName)
if (-not $AllowUnsigned) {
  foreach ($signatureTarget in $signatureTargets) {
    $signature = Get-AuthenticodeSignature -LiteralPath $signatureTarget
    if ($signature.Status -ne "Valid") { throw "Authenticode verification failed for ${signatureTarget}: $($signature.StatusMessage)" }
  }
}
Copy-Item -LiteralPath $appExe -Destination (Join-Path $portable "Perspective-Dieline-Generator.exe") -Force

$webViewInstaller = Get-ChildItem -LiteralPath (Join-Path $target "bundle") -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match "WebView2|MicrosoftEdge" } | Select-Object -First 1
if (-not $webViewInstaller) {
  $webViewInstaller = Get-ChildItem -LiteralPath (Join-Path $env:LOCALAPPDATA "tauri") -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq "MicrosoftEdgeWebView2RuntimeInstallerX64.exe" } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if ($webViewInstaller) { Copy-Item -LiteralPath $webViewInstaller.FullName -Destination $portable -Force }

Copy-Item -LiteralPath (Join-Path $root "README.md") -Destination $portable -Force
Copy-Item -LiteralPath (Join-Path $root "RELEASE_NOTES.md") -Destination $portable -Force
Copy-Item -LiteralPath (Join-Path $root "samples") -Destination $portable -Recurse -Force

$portableReadme = @"
Perspective Dieline Generator portable v$Version

Run Perspective-Dieline-Generator.exe. If WebView2 is not present, run the included offline WebView2 installer first. Images remain on this device. Save .pdgproj files outside this folder before replacing a portable release.
"@
Set-Content -LiteralPath (Join-Path $portable "PORTABLE.txt") -Value $portableReadme -Encoding UTF8

$zipName = "Perspective-Dieline-Generator-Portable-v$Version-win-x64.zip"
$zipPath = Join-Path $release $zipName
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -Path (Join-Path $portable "*") -DestinationPath $zipPath -CompressionLevel Optimal

$sampleZip = Join-Path $release "Perspective-Dieline-Generator-Sample-Pack-v$Version.zip"
if (Test-Path -LiteralPath $sampleZip) { Remove-Item -LiteralPath $sampleZip -Force }
Compress-Archive -Path (Join-Path $root "samples\*"), (Join-Path $root "docs\USER_GUIDE.md"), (Join-Path $root "docs\CALIBRATION_GUIDE.md"), (Join-Path $root "docs\TEMPLATES.md") -DestinationPath $sampleZip -CompressionLevel Optimal

$artifacts = Get-ChildItem -LiteralPath $release -File | Where-Object Extension -In ".exe", ".zip"
$checksums = foreach ($artifact in $artifacts) {
  $hash = Get-FileHash -LiteralPath $artifact.FullName -Algorithm SHA256
  "$($hash.Hash.ToLowerInvariant())  $($artifact.Name)"
}
Set-Content -LiteralPath (Join-Path $release "SHA256SUMS.txt") -Value $checksums -Encoding ASCII
Get-ChildItem -LiteralPath $release -File | Select-Object Name, Length
