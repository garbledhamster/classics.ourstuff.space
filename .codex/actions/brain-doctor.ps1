Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Resolve-Path (Join-Path $PSScriptRoot "..\.."))

$env:PYTHONPATH = Join-Path (Get-Location) "localaibrain\scripts"
$env:LOCAL_AI_BRAIN_HOME = Join-Path (Get-Location) "localaibrain\brain"

python -m local_ai_brain doctor
