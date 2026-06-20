# Agent Instructions

## Codex Project Guide

This repo is a static classics reading app for `classics.ourstuff.space`.

Read `project-context/AGENT_ALIGNMENT.md` after this file for the project-wide agent operating agreement.

- App shell: `index.html`
- JavaScript modules: `src/js`
- CSS modules: `src/css`
- Views: `src/js/views`
- Components: `src/js/components`
- Data files: `library.json`, `bookclub.json`, `greatbooks.csv`, `glossary_app.json`, `syntopicon_terms.json`
- Product/design docs: `project-context/PRODUCT.md`, `project-context/DESIGN.md`, `README.md`

Use a local HTTP server for browser testing. Do not rely on double-clicking `index.html` for ES module behavior.

```powershell
python -m http.server 4173
```

Primary quick checks:

```powershell
$files = Get-ChildItem -Path ".\src\js" -Recurse -Filter "*.js" | Sort-Object FullName
foreach ($file in $files) { node --check $file.FullName }
```

Codex setup lives in `.codex\environments\environment.toml`. Keep it specific to this static classics app. Do not reintroduce stale actions for unrelated Ourstuff surfaces unless those folders and checks are present and relevant.

<!-- LOCAL_AI_BRAIN_PROJECT_START -->
## Project Local AI Brain

This project has its own Local AI Brain. Use the Local AI Brain skills or commander CLI.
Use it before non-trivial repo, debugging, UI, deployment, planning, or multi-agent work that may depend on relevant history.

- Project root: `C:\Github\classics.ourstuff.space`
- Brain scope: `project`
- Commander: `C:\Github\classics.ourstuff.space\localaibrain.py`
- Python module path: `C:\Github\classics.ourstuff.space\localaibrain\scripts`
- Local AI Brain package: `C:\Github\classics.ourstuff.space\localaibrain\scripts\local_ai_brain`
- Runtime data path: `C:\Github\classics.ourstuff.space\localaibrain\brain`
- SQLite database path: `C:\Github\classics.ourstuff.space\localaibrain\brain\brain.db`
- Artifact path: `C:\Github\classics.ourstuff.space\localaibrain\brain\artifacts`
- Plans path: `C:\Github\classics.ourstuff.space\localaibrain\plans`


Use Python only. Do not write SQLite directly.

Agent software and model allocation:

- Keep a clear divide between model roles. Operator and Engineer lanes are lightweight coding agents for repo reads, local edits, tests, terminal work, MCP calls, and linear implementation. Larger architecture models such as GPT-5.5 are for innovation, system design, product architecture, strategy, and reviewing the shape of major decisions.
- Do not spend large architecture models on routine coding work when Copilot CLI, OpenCode, Codex coding lanes, or Claude Code can execute the task through their tools.
- When orchestrating multiple agents, assign linear implementation tickets to Operator/Engineer agents first, then escalate only the design question, architecture tradeoff, or unresolved blocker to a larger architecture model.
- Local AI Brain MCP startup registration is intentionally disabled. Use the skills or commander CLI below.

Full access command labels for agent software:

```yaml
full_access_commands:
  copilot: "copilot --allow-all"
  copilot_tools_only: "copilot --allow-all-tools"
  opencode: "opencode --dangerously-skip-permissions"
  codex: "codex --dangerously-bypass-approvals-and-sandbox"
  claude: "claude --permission-mode bypassPermissions"
  claude_alt: "claude --dangerously-skip-permissions"
one_shot_commands:
  copilot: "copilot -p "<task>" --allow-all"
  opencode: "opencode run --dir "C:\Github\classics.ourstuff.space" --dangerously-skip-permissions "<task>""
  codex: "codex exec --cd "C:\Github\classics.ourstuff.space" --dangerously-bypass-approvals-and-sandbox "<task>""
  claude: "cd "C:\Github\classics.ourstuff.space"; claude -p "<task>" --permission-mode bypassPermissions"
```

Project commander:

```powershell
python "C:\Github\classics.ourstuff.space\localaibrain.py" deploy --brain-scope project
python "C:\Github\classics.ourstuff.space\localaibrain.py" install-skills --brain-scope project
python "C:\Github\classics.ourstuff.space\localaibrain.py" run --brain-scope project context-pack --repo "C:\Github\classics.ourstuff.space" --query "<topic>" --limit 5
python "C:\Github\classics.ourstuff.space\localaibrain.py" run --brain-scope project search --repo "C:\Github\classics.ourstuff.space" --query "<topic>" --limit 10
python "C:\Github\classics.ourstuff.space\localaibrain.py" run --brain-scope project doctor
python "C:\Github\classics.ourstuff.space\localaibrain.py" terminal --brain-scope project
```

Project work file naming:

- Keep project plans in `C:\Github\classics.ourstuff.space\localaibrain\plans`.
- Name plan, phase, task, milestone, and similar work-tracking files as `NNN_slug.ext`, for example `001_file-use-name.md`.
- Use the next available 3-digit number, an underscore, and a short lowercase hyphenated slug that reads like the file topic.
- Preserve the file extension, such as `.md` or `.txt`.
- Do not apply this naming rule inside `localaibrain, scripts, artifacts, archive, brain, mcp, meetings, tools`.

PowerShell:

```powershell
$env:PYTHONPATH = "C:\Github\classics.ourstuff.space\localaibrain\scripts"
$env:LOCAL_AI_BRAIN_HOME = "C:\Github\classics.ourstuff.space\localaibrain\brain"
python -m local_ai_brain context-pack --repo "C:\Github\classics.ourstuff.space" --query "<topic>" --limit 5
python -m local_ai_brain search --repo "C:\Github\classics.ourstuff.space" --query "<topic>" --limit 10
python -m local_ai_brain proof-start --repo "C:\Github\classics.ourstuff.space" --surface "<surface>" --summary "<scrubbed task>" --json
python -m local_ai_brain proof-finish --session "<proof-session-uid>" --json-file ".local\proof-finish.json"
python -m local_ai_brain proof-report --repo "C:\Github\classics.ourstuff.space" --json
python -m local_ai_brain optimize --apply
```

macOS/Linux:

```sh
PYTHONPATH="C:\Github\classics.ourstuff.space\localaibrain\scripts" LOCAL_AI_BRAIN_HOME="C:\Github\classics.ourstuff.space\localaibrain\brain" python -m local_ai_brain context-pack --repo "C:\Github\classics.ourstuff.space" --query "<topic>" --limit 5
PYTHONPATH="C:\Github\classics.ourstuff.space\localaibrain\scripts" LOCAL_AI_BRAIN_HOME="C:\Github\classics.ourstuff.space\localaibrain\brain" python -m local_ai_brain search --repo "C:\Github\classics.ourstuff.space" --query "<topic>" --limit 10
PYTHONPATH="C:\Github\classics.ourstuff.space\localaibrain\scripts" LOCAL_AI_BRAIN_HOME="C:\Github\classics.ourstuff.space\localaibrain\brain" python -m local_ai_brain proof-start --repo "C:\Github\classics.ourstuff.space" --surface "<surface>" --summary "<scrubbed task>" --json
PYTHONPATH="C:\Github\classics.ourstuff.space\localaibrain\scripts" LOCAL_AI_BRAIN_HOME="C:\Github\classics.ourstuff.space\localaibrain\brain" python -m local_ai_brain proof-finish --session "<proof-session-uid>" --json-file ".local/proof-finish.json"
PYTHONPATH="C:\Github\classics.ourstuff.space\localaibrain\scripts" LOCAL_AI_BRAIN_HOME="C:\Github\classics.ourstuff.space\localaibrain\brain" python -m local_ai_brain proof-report --repo "C:\Github\classics.ourstuff.space" --json
PYTHONPATH="C:\Github\classics.ourstuff.space\localaibrain\scripts" LOCAL_AI_BRAIN_HOME="C:\Github\classics.ourstuff.space\localaibrain\brain" python -m local_ai_brain optimize --apply
```

For token conservation, prefer `context-pack --limit 5` with a specific `--query` and `--surface` before broad scans. Use `search --limit 10` when you need more matches.
For proof that the brain helped, start a proof session before the first lookup, set `LOCAL_AI_BRAIN_PROOF_SESSION` to the returned id, classify useful/stale/irrelevant hits in `proof-finish`, and check `proof-report` before making speed or token-savings claims.
For deterministic maintenance, run `python -m local_ai_brain optimize --apply`; it finds the project `brain.db`, backs it up, removes transient cleanup candidates, rebuilds FTS, and compacts SQLite.

<!-- LOCAL_AI_BRAIN_PROJECT_END -->

## Project Context Pointers

Use `C:\Github\classics.ourstuff.space\project-context\pointers` as the quick-reference index for where durable project knowledge lives.

- Start with `project-context\pointers\000_ai-brain-quick-reference.txt` before broad repo scans.
- Use `project-context\pointers\002_system-map.json` for machine-readable path, term, and workflow pointers.
- Add or update a pointer when you discover a durable term, subsystem owner, workflow, generated artifact location, or recurring trap that future agents should find quickly.
- Prefer `.txt` or `.json` for pointer files because this repo currently ignores `*.md`.
- Keep pointer entries short. Link to canonical files instead of duplicating their contents.

## Grill With Docs Workflow

For non-trivial planning, terminology, architecture, or documentation work, use `$grill-with-docs` together with the Local AI Brain.

- First query the Local AI Brain with a narrow `context-pack --limit 5` query.
- Then check the pointer index for known terms and path ownership.
- If a question can be answered by repo exploration, answer it from the code/docs instead of asking the user.
- Ask unresolved design questions one at a time and include the recommended answer.
- If a term is resolved, update `project-context/CONTEXT.md` only as a glossary. Do not put implementation details there.
- Create ADRs only for decisions that are hard to reverse, surprising without context, and the result of a real trade-off.

## Handoff To Brain Workflow

When using `$handoff`, save the handoff document to the OS temp directory as the skill requires, then immediately record a sanitized copy into the project Local AI Brain with `record-artifact`.

- Use artifact type `handoff`.
- Use target surface `handoff`.
- Include suggested skills in the handoff.
- Reference existing artifacts, plans, ADRs, issues, and diffs by path instead of duplicating their contents.
- Redact secrets, credentials, private account data, and raw PII.
- Do not write SQLite directly. Use `python -m local_ai_brain record-artifact --json-file <payload>`.
- See `project-context\pointers\001_handoff-to-brain-workflow.txt` for the command template.
