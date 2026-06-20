param(
  [int] $Port = 4173
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

python -m http.server $Port
