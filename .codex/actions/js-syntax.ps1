Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

$files = Get-ChildItem -Path ".\src\js" -Recurse -Filter "*.js" | Sort-Object FullName
foreach ($file in $files) {
  node --check $file.FullName
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

Write-Host "JS syntax ok ($($files.Count) files)."
