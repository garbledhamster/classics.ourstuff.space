## Codex title helper action

This repo includes a local helper for creating date-prefixed Codex chat titles:

`.codex/actions/codex-title.ps1`

Use it to generate titles like `2026-05-29 Codex Titles`. The script prints the title and copies it to the clipboard.

```powershell
.\.codex\actions\codex-title.ps1 "Codex Titles"
```

## Project Local AI Brain

This repo has a project Local AI Brain. For non-trivial work, read `AGENTS.md`, run a narrow Local AI Brain `context-pack`, and check `project-context/pointers/000_ai-brain-quick-reference.txt` before broad scans.

Use `project-context/pointers` as the quick-reference index for durable terms, path ownership, workflows, and recurring traps. When using `$handoff`, save the handoff to the OS temp directory, then record a sanitized copy into the project Local AI Brain with `python -m local_ai_brain record-artifact --json-file <payload>`. The command template is in `project-context/pointers/001_handoff-to-brain-workflow.txt`.

Read `project-context/AGENT_ALIGNMENT.md` for the project-wide operating agreement before doing non-trivial work.
