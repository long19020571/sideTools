<#
.SYNOPSIS
  Cai dat extension "Side Tools" vao Illustrator (CEP extension, chua ky).

.DESCRIPTION
  - Doc ExtensionBundleId tu CSXS/manifest.xml
  - Tao junction trong %APPDATA%\Adobe\CEP\extensions\<Id> tro ve thu muc nay
    (junction tu update code -> khong can khoi dong lai Illustrator moi lan sua code,
    chi can dong/mo lai panel hoac restart Illustrator)
  - Bat PlayerDebugMode=1 cho cac ban CSXS (de Illustrator cho load extension chua ky)

.NOTES
  Chay lai script nay bat ky luc nao de cai dat lai (idempotent).
  Dung "install.ps1 -Uninstall" de go extension.
#>

param(
  [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifestPath = Join-Path $repoRoot "CSXS\manifest.xml"

if (-not (Test-Path $manifestPath)) {
  Write-Error "Khong tim thay manifest.xml tai: $manifestPath"
  exit 1
}

[xml]$manifest = Get-Content $manifestPath
$extensionId = $manifest.ExtensionManifest.ExtensionBundleId
$extensionName = $manifest.ExtensionManifest.ExtensionBundleName

if (-not $extensionId) {
  Write-Error "Khong doc duoc ExtensionBundleId tu manifest.xml"
  exit 1
}

$cepExtensionsDir = Join-Path $env:APPDATA "Adobe\CEP\extensions"
$targetPath = Join-Path $cepExtensionsDir $extensionId

if ($Uninstall) {
  if (Test-Path $targetPath) {
    (Get-Item $targetPath).Delete()
    Write-Host "Da go lien ket: $targetPath"
  } else {
    Write-Host "Khong co gi de go tai: $targetPath"
  }
  exit 0
}

if (-not (Test-Path $cepExtensionsDir)) {
  New-Item -ItemType Directory -Path $cepExtensionsDir -Force | Out-Null
}

if (Test-Path $targetPath) {
  $item = Get-Item $targetPath
  if ($item.LinkType -eq "Junction" -or $item.LinkType -eq "SymbolicLink") {
    $item.Delete()
  } else {
    Write-Error "Da ton tai thu muc (khong phai junction) tai $targetPath. Hay xoa thu cong roi chay lai script."
    exit 1
  }
}

New-Item -ItemType Junction -Path $targetPath -Target $repoRoot | Out-Null
Write-Host "Da lien ket extension '$extensionName' ($extensionId):"
Write-Host "  $targetPath  ->  $repoRoot"

# Bat PlayerDebugMode cho cac phien ban CSXS de Illustrator cho phep extension chua ky
foreach ($ver in 4..12) {
  $regPath = "HKCU:\Software\Adobe\CSXS.$ver"
  if (-not (Test-Path $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
  }
  Set-ItemProperty -Path $regPath -Name "PlayerDebugMode" -Value "1" -Type String
}
Write-Host "Da bat PlayerDebugMode=1 cho CSXS.4 - CSXS.12"

Write-Host ""
Write-Host "Xong! Khoi dong lai Illustrator, mo menu Window > Extensions > $extensionName"
