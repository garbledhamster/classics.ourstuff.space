param(
  [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
  [string[]] $Update,

  [int] $MaxWords = 4,
  [switch] $NoClipboard,
  [switch] $Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Help {
  Write-Host @"
Codex title helper

Creates a Codex chat title in this format:
  yyyy-MM-dd short update

The date counts as one title word, so this keeps the update to four words by default.

Examples:
  .\.codex\actions\codex-title.ps1 Codex Titles
  .\.codex\actions\codex-title.ps1 "Compendium List View"
  .\.codex\actions\codex-title.ps1 -MaxWords 3 "Fix dashboard spacing"

The result is printed and copied to the clipboard unless -NoClipboard is used.
"@
}

function Get-TitleWords {
  param(
    [string] $Text,
    [int] $Limit
  )

  $clean = ($Text -replace "[`r`n]+", " ").Trim()
  if ([string]::IsNullOrWhiteSpace($clean)) {
    return @()
  }

  return @($clean -split "\s+" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First $Limit)
}

if ($Help) {
  Show-Help
  exit 0
}

$rawUpdate = ($Update -join " ").Trim()
if ([string]::IsNullOrWhiteSpace($rawUpdate)) {
  $rawUpdate = (Read-Host "Short update, four words max").Trim()
}

$datePrefix = Get-Date -Format "yyyy-MM-dd"
$words = Get-TitleWords -Text $rawUpdate -Limit $MaxWords

if ($words.Count -eq 0) {
  Write-Error "No update text was provided."
}

$title = "$datePrefix $($words -join " ")"

Write-Host $title

if (-not $NoClipboard) {
  Set-Clipboard -Value $title
  Write-Host "Copied to clipboard."
}
