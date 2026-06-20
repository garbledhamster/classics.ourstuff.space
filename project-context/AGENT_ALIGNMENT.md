# Agent Alignment

## Purpose

This document is the shared operating agreement for agents working in `C:\Github\classics.ourstuff.space`.

The goal is to keep future agents aligned on what this project is, where durable knowledge lives, how to use the Local AI Brain, and how to avoid creating parallel or stale instruction systems.

## Project Identity

This repo is a static classics reading app for `classics.ourstuff.space`.

Primary surfaces:

- App shell: `index.html`
- JavaScript modules: `src/js`
- CSS modules: `src/css`
- Views: `src/js/views`
- Components: `src/js/components`
- Data files: `library.json`, `bookclub.json`, `greatbooks.csv`, `glossary_app.json`, `syntopicon_terms.json`
- Product/design docs: `project-context/PRODUCT.md`, `project-context/DESIGN.md`, `README.md`

The app should remain a static, no-build-root web app unless the user explicitly asks for a build system.

## Product Alignment

The product is a guided Great Conversation reading desk, not a teaching website. Its job is to help a serious reader follow a ten-year Great Books path, track progress, keep notes, and quickly open outside research resources without losing the thread of the reading.

Preserve the user's intent that the app points readers toward books, authors, notes, terms, and outside resources rather than replacing direct reading with internal lessons. Conversation Desk work should help the reader shape their own voice from their notes and reading context.

## Source Of Truth Order

For non-trivial work, use sources in this order:

1. `AGENTS.md`
2. `project-context/AGENT_ALIGNMENT.md`
3. Local AI Brain `context-pack --limit 5`
4. `project-context/pointers/002_system-map.json`
5. The smallest canonical product, design, source, or pointer file that owns the surface
6. Broader repo scans only after the narrow sources fail

Do not treat `LLM.md` as automatically current. It contains useful historical notes, but some paths reference an older Ourstuff layout and must be verified against the current repo.

## Local AI Brain Agreement

Use the project Local AI Brain before non-trivial repo, debugging, UI, deployment, planning, documentation, or multi-agent work.

Rules:

- Use Python CLI commands only.
- Do not write SQLite directly.
- Prefer `context-pack --limit 5` with a specific query before broad scans.
- Use proof sessions when claiming the brain helped.
- Record durable handoffs and important artifacts with `record-artifact`.
- Keep `localaibrain/brain` local runtime state; do not commit it unless the user explicitly asks for a portable brain snapshot.

PowerShell setup:

```powershell
$env:PYTHONPATH = "C:\Github\classics.ourstuff.space\localaibrain\scripts"
$env:LOCAL_AI_BRAIN_HOME = "C:\Github\classics.ourstuff.space\localaibrain\brain"
```

## Pointer Agreement

Use `project-context/pointers` as the quick-reference index.

Pointers should:

- Be short.
- Prefer `.txt` or `.json`.
- Link to canonical files instead of duplicating them.
- Capture durable path ownership, recurring traps, workflow conventions, and key terms.
- Be updated when an agent discovers something future agents should find quickly.

The machine-readable pointer map is `project-context/pointers/002_system-map.json`.

## Grill With Docs Agreement

Use `$grill-with-docs` for non-trivial planning, terminology, architecture, and documentation alignment.

Rules:

- Check Local AI Brain and pointers first.
- Answer from code/docs when the repo can answer the question.
- Ask unresolved questions one at a time and include the recommended answer.
- Update `project-context/CONTEXT.md` only for resolved domain glossary terms.
- Do not put implementation details in `project-context/CONTEXT.md`.
- Create ADRs only for decisions that are hard to reverse, surprising without context, and true trade-offs.

No `project-context/CONTEXT.md` or ADR is required just to record agent operating policy.

## Handoff Agreement

When using `$handoff`:

- Save the handoff document to the OS temp directory.
- Include a suggested skills section.
- Redact secrets, credentials, private account data, and raw PII.
- Reference existing artifacts by path instead of duplicating them.
- Record a sanitized copy into Local AI Brain with artifact type `handoff`.

The command template is `project-context/pointers/001_handoff-to-brain-workflow.txt`.

## Codex Agreement

Codex setup lives under `.codex`.

- Local instructions: `.codex/AGENTS.md`
- Environment: `.codex/environments/environment.toml`
- Actions: `.codex/actions`

Do not add stale actions for unrelated Ourstuff surfaces. Actions should match files that exist in this repo and checks that are safe for this static classics app.

Current quick checks:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\actions\js-syntax.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\actions\brain-doctor.ps1
```

Use a local server for browser testing:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\actions\serve-static.ps1
```

## Git And Runtime Agreement

Track reusable operating assets:

- `AGENTS.md`
- `project-context/AGENT_ALIGNMENT.md`
- `.codex/AGENTS.md`
- `.codex/actions`
- `.codex/environments`
- `.agents/skills`
- `.claude/skills`
- `localaibrain.py`
- `localaibrain/scripts`
- `project-context/pointers`

Keep runtime/generated state local:

- `localaibrain/brain`
- `localaibrain/brain/brain.db`
- `localaibrain/brain/artifacts`
- Python bytecode and `__pycache__`
- generated validation artifacts

## Change Discipline

Preserve existing user work in the working tree. Do not revert unrelated changes.

For frontend work:

- Preserve the static app shape.
- Keep modules under `src/js`.
- Keep styles under `src/css`.
- Run JavaScript syntax checks after code edits.
- Use a local HTTP server for browser behavior checks.

For documentation or workflow changes:

- Update the narrow owning instruction or pointer file.
- Record important alignment artifacts into Local AI Brain.
- Keep root files purposeful; do not scatter duplicate guidance.

## Escalation Agreement

Use lightweight coding agents for routine implementation, repo reads, local edits, tests, and terminal work.

Escalate only design questions, architecture trade-offs, product strategy, or unresolved blockers that cannot be answered from code, docs, or the Local AI Brain.
