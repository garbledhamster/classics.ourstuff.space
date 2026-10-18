# Quiet reading panes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build Joe's selected A quiet reading-pane interface without changing content, loading or Conversation Desk.
**Architecture:** Extend the existing production presenter to keep full original owners in the reading body and generated identity buttons in the left index. Separate shell/Home/Glossary presentation from original controllers.
**Tech Stack:** Existing vanilla JavaScript modules, CSS, static HTML, Node tests and local actual-module browser harnesses.
**Spec:** [QUIET-PANES-DESIGN.md](QUIET-PANES-DESIGN.md)

## Global Constraints

- Keep all the existing pages, content, and what gets loaded exactly the same.
- Leave Conversation Desk as it is: its controller, markup, styles, saves, autosave, preview, resizing and records remain unchanged.
- Preserve all six original datasets, order, exact text/selections, original source URLs, parameters, fallbacks, parsing, Firebase/reCAPTCHA boot, authentication, storage and sync behavior.
- Keep original owner/control nodes and their IDs, datasets and delegation ancestry. Bookclub owners stay inside their original readingBlock; never clone interactive content.
- Use the reviewed production rebuild at 084a1bb on interface/study-desk-a; keep the prototype separate. Do not copy prototype storage/runtime substitutions, removed cloud boot, variant switcher or B/C code.
- Keep the existing preservation manifest and preservation.test.mjs unchanged. New behavior checks supplement the original-action parity checks.
- Preserve all original table modes, fields, options, tools and existing local-mode fallbacks.
- Build and verify locally on the Mac; disposable writes use localhost fixtures with backup/restore. VPN checks are read-only. A viewport check does not establish physical-phone use.
- No merge, push or publication is authorized by this implementation request.

## Review Focus

1. Identical-data rerenders must not leave proxy buttons bound to detached owners — Task 1.
2. Bookclub searches depend on readingBlock ancestry; nested controls must act on the original occurrence — Tasks 1 and 3.
3. Phone selection, page changes and original dialogs must preserve visible focus and release body locks — Tasks 1 and 2.
4. Home first actions must visibly open one original editor/draft and preserve existing empty-state copy — Task 2.
5. Lazy Glossary mounts, all five panels and navigation away must preserve content, requests and scrolling — Tasks 2 and 3.

### Task 1: Build the shared A index and full reading body

**Files:** modify assets/js/classics/detail-presentation.js and assets/css/study-workspace.css; extend tests/interface/detail-presentation.browser.html and bookclub-presentation.browser.js. Keep renderers and original action logic unchanged.
**Interfaces:** keep presentShelfDetails(root), presentPlanDetails(root, enabled) and connectDetailPresentation(options) -> {sync,close,destroy}. Library/Authors selectors remain .libCard/.libHead/.libDrawer; Bookclub remains div.workRow/.workMain/.workDrawer with readingBlock context.

- [x] Extend the actual-module fixtures first. Assert a generated plain title/author index grouped by Bookclub year, Library author and Authors initial letter, full original selected owner fixed on desktop, no metadata/ideas in book rows, independent bounded overflow, original identity/ancestry and no writes. Assert Back/Escape focus returns to the visible matching proxy.
- [x] Add an identical-data owner replacement case: rerender, activate the new proxy, assert the new original owner opens and the detached owner is restored. Retain source cycling, delayed content, cleanup, nested actions, table disablement, phone dialog/focus, overlay priority, route and destroy assertions. Update only old layout assertions that required a fixed inner drawer.
- [x] Run the focused browser fixtures on localhost via CUA and record the expected failing behavior before implementing.
- [x] Extend the presenter using original header clicks and full-owner positioning. Keep ancestors untouched; restore generated DOM/attributes/styles and locks on replacement/destroy/hidden view. Preserve existing real keyboard and overlay behavior. Style only the selected A reading-list treatment; handle long titles and phone width.
- [x] Re-run both focused browser fixtures, node --test, changed-JS syntax and git diff --check. Record results and self-review the diff; commit the task.

### Task 2: Apply the selected shell, Home and Glossary presentation

**Files:** modify index.html, assets/js/classics/study-home.js, narrow Home adapters in reader-routes.js, study-workspace.css and study-home.browser.html; create assets/js/classics/study-shell.js and tests/interface/study-shell.browser.html.
**Interfaces:** study-shell.js initializes presentation only after DOM is available and observes the existing lazy Glossary mount. Home wireStudyHome callbacks add startNote() and startWriting(), routed to existing openDrawer/startNewNote and openConversationDesk exports. Original writing-desks.js, conversation-desk.js, conversation-desk.css and main.js remain unchanged.

- [x] Add failing actual-module checks for Notes immediately after Night Mode, visible Home label/icon, all original controls in reachable compact disclosures, and Home Start now opening a visible original Notes editor or exactly one existing Desk draft. Preserve existing Home zero-record/read-only checks and original empty copy.
- [x] Add failing Glossary checks for independent index/body bounds, full selected term/header and original next/previous/close controls, all five panels, phone semantics/Back/focus, nested original overlays and release when leaving the page. Use the existing original local-mode fallbacks, without new fetch or persistence.
- [x] Run new focused browser checks and record failures. Implement static header/disclosure markup and small presentation initialization; add Home-only creation callbacks. Initialize the new shell module from index.html while retaining every original script/head-resource and Firebase bridge unchanged.
- [x] Scope new CSS to browsing/Glossary/shell/Home; do not alter Desk selectors. The Glossary enhancement must not replace or modify its original controller or loaders. Keep overlay precedence, keyboard, resize and lazy-mount cleanup usable.
- [x] Run focused browser fixtures, node --test, changed-JS syntax and git diff --check. Self-review; commit the task.

### Task 3: Verify whole-site parity and the selected A result

**Files:** tests/interface/browser-parity.md and narrowly justified new interaction assertions in whole-site.browser.js; only evidenced defect fixes within earlier task scope.
**Interfaces:** consumes the original preservation manifest, original-action digest and Tasks 1–2's presentation. Produces the verification record and reviewable diff.

- [x] Run node --test and syntax checks for all changed/new modules and browser fixtures. Keep the original preservation manifest/test byte-identical.
- [x] Run every actual-module browser harness. Preserve the original old/new saved/export action digest comparison; verify exact datasets, loader snapshots, Firebase/reCAPTCHA bridge and byte-identical Desk controller/styles/markup and writing-desks/main.
- [x] Inspect desktop plus 390px phone A in one batch: Library, Bookclub, Authors and Glossary lists/bodies; Home icon/empty actions; dark mode, long content, keyboard, nested Notes/dialogs, independent scrolling and table tools. Keep this as the single visual inspection budget; report the findings to the controller for one coordinated correction batch and at most one confirmation. Functional checks may be rerun when a defect fix requires them.
- [x] Open the Mac VPN preview read-only; record original cloud mode and any existing domain warning without changing configuration. Physical-phone use and live-service/release checks stay pending when unavailable.
- [x] Write verified counts, any limitation and exact repeat commands in browser-parity.md, preserving earlier historical evidence and Joe's comments. Self-review and commit. Report defects as findings for a scoped fix, never silently weaken checks.

## Joe's comments

Joe selected A and explicitly authorized agent implementation with content/loading preserved and Conversation Desk unchanged on October 17, 2026.

_Add feedback on the production result here._
