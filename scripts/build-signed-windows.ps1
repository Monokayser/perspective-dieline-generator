param(
  [string]$Version = "1.1.2",
  [string]$PfxPath = $env:PDG_AUTHENTICODE_PFX,
  [string]$PasswordEnvironmentVariable = "PDG_AUTHENTICODE_PASSWORD",
  [string]$TimestampUrl = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
if (-not $PfxPath -or -not (Test-Path -LiteralPath $PfxPath)) {
  throw "Set PDG_AUTHENTICODE_PFX to the trusted code-signing PFX path. The certificate must remain outside the repository."
}
$passwordText = [Environment]::GetEnvironmentVariable($PasswordEnvironmentVariable)
if (-not $passwordText) { throw "Set $PasswordEnvironmentVariable in the current process before building the signed release." }

$securePassword = ConvertTo-SecureString $passwordText -AsPlainText -Force
$ephemeral = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
  (Resolve-Path -LiteralPath $PfxPath),
  $passwordText,
  [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::EphemeralKeySet
)
$thumbprint = $ephemeral.Thumbprint
$ephemeral.Dispose()
$existing = Get-ChildItem Cert:\CurrentUser\My | Where-Object Thumbprint -eq $thumbprint | Select-Object -First 1
$imported = $false

try {
  if (-not $existing) {
    Import-PfxCertificate -FilePath $PfxPath -CertStoreLocation Cert:\CurrentUser\My -Password $securePassword | Out-Null
    $imported = $true
  }
  $work = Join-Path $root "work"
  New-Item -ItemType Directory -Force -Path $work | Out-Null
  $configPath = Join-Path $work "tauri-signing-config.json"
  $config = @{
    bundle = @{
      windows = @{
        certificateThumbprint = $thumbprint
        digestAlgorithm = "sha256"
        timestampUrl = $TimestampUrl
      }
    }
  } | ConvertTo-Json -Depth 6
  Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8

  Push-Location $root
  try {
    & npm.cmd run desktop:build -- --config $configPath
    if ($LASTEXITCODE -ne 0) { throw "The signed Tauri build failed." }
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "package-release.ps1") -Version $Version
    if ($LASTEXITCODE -ne 0) { throw "Release packaging failed." }
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item Env:\$PasswordEnvironmentVariable -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath (Join-Path $root "work\tauri-signing-config.json") -Force -ErrorAction SilentlyContinue
  if ($imported) { Remove-Item -LiteralPath "Cert:\CurrentUser\My\$thumbprint" -Force -ErrorAction SilentlyContinue }
}

