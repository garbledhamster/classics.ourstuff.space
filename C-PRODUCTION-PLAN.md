# C reading workspace implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish Joe's approved C inline scrolling settings while preserving original content/data loading and Conversation Desk.

**Architecture:** Extend the current presentation shell and scoped CSS. Original controls stay authoritative inside their original view; original reading owner trees and index/root adjacency remain intact. CSS grids put controls above the left list while the right detail slot spans the full height.

**Tech Stack:** Static HTML, browser ES modules, CSS, Node built-in tests, actual-app localhost browser fixtures; existing GitHub Pages hosting.

**Spec:** [C-PRODUCTION-DESIGN.md](C-PRODUCTION-DESIGN.md)

## Global Constraints

- Every original page/content/dataset/loader URL/request/default/fallback/parsing and saved behavior stays unchanged.
- Conversation Desk, Firebase/account/auth/storage/sync, Notes, Glossary and Home stay unchanged.
- No cloned interactive controls or work-owner reparenting; preserve index/root sibling adjacency.
- No prototype boot/memory/auth substitutions or switcher in production.
- Existing manifest and preservation test are immutable; replace only intentionally obsolete layout expectations with equivalent approved behavior checks.
- Refresh the CSS content version; publish only after meaningful verification and independent review. Joe explicitly authorized publication, so no additional approval pause.

## Review Focus

1. Repeated filter rerenders and route changes must not duplicate or detach settings or break delegated original actions.
2. Empty searches and full/table view switches must recover, retain all columns and leave original table functionality reachable.
3. Keyboard focus must not land inside collapsed settings; Escape/editable arrows/higher overlays keep correct priority.
4. Short windows and phone selections must keep settings/list/reader reachable without outer or horizontal overflow.
5. Opening/closing/animation must not move the right pane or break its generated geometry and source cleanup.

### Task 1: Implement and verify C through the presentation seam

**Files:**
- Modify: `assets/js/classics/study-shell.js`, `assets/css/study-workspace.css`.
- Create if it makes the seam clearer: `assets/js/classics/browse-controls.js` (one focused lifecycle module).
- Modify `assets/js/classics/detail-presentation.js` only for geometry/lifecycle coordination proven necessary by the focused tests.
- Test: `tests/interface/contained-scroll.browser.html`, `tests/interface/study-shell.browser.html`; create a focused `tests/interface/inline-controls.browser.html` if it avoids bloating unrelated fixtures.
- Refresh: `index.html` stylesheet and changed directly loaded presentation-shell entry versions using the existing helper. Extend `scripts/version-interface-css.mjs` and `tests/interface/release-cache.test.mjs` to guard both content versions.

**Interfaces:**
- Consumes original `.studyBrowseControls`, `.studyDetailLayout`, `.detailIndex`, `.detailSlot`, original view/field/control IDs and presenter lifecycle.
- Produces C settings lifecycle with original controls, no duplicate mount/listeners, and behavior covered by actual-module fixtures. No data or storage API changes.

- [ ] Add the smallest actual-module failing browser assertions for pane rectangle invariance, inline-only settings bounds/scroll, original fields/options/filter/reset behavior, empty recovery, table mode/columns, phone Back/focus, keyboard/overlay priority, constrained-height reachability and repeated route/rerender cleanup.
- [ ] Tell the coordinator when the RED fixture is ready, before implementing; the coordinator runs it in the browser and returns its actual failure output. Use the preapproved design to decide routine presentation details.
- [ ] Implement the production lifecycle and C CSS using original nodes. Prevent shell rewrapping after moving controls; preserve index/root adjacency. Keep reader geometry stable through animation. Integrate all three browse views and table mode. Respect phone/reduced-motion requirements.
- [ ] Update only obsolete geometry/toolbar expectations in existing fixtures; record why each changed expectation follows the approved spec. Do not weaken source/content/action checks.
- [ ] Run focused checks, then `node --test tests/interface/*.test.mjs`, syntax checks and `git diff --check`. Refresh CSS version. Coordinator runs actual browser fixtures and bounded visuals; address genuine failures.
- [ ] Self-review and commit only task files. Write a detailed report in the supplied ignored workspace, with RED/GREEN evidence and limitations; return concise status/commit/test summary.

### Task 2: Review, release and durable handoff

**Owner:** Coordinator, supported by fresh task/final reviewers.

**Files:** `C-PRODUCTION-DESIGN.md`, this plan, `RELEASE.md`, `tests/interface/browser-parity.md` as needed; project overview, current daily and separate tracker boards via Obsidian/Pages MCP.

**Interfaces:** Consumes committed Task1 source and meaningful pass results; produces a guarded published snapshot and verified public release evidence.

- [ ] Run task review for both spec and code quality, resolve findings, then an independent whole-branch review against public baseline `ce8f0f4`.
- [ ] Verify final Node/preservation/browser checks, source diffs and one batched desktop/phone visual round plus one confirmation. Do not repeat passing checks without a new code/failure reason.
- [ ] Commit exact deployable source. Recheck public main; construct Git API tree using the existing snapshot helper with explicit current API base, require exact local tree equality, create a parented commit and update main non-force with expected-head guard.
- [ ] Wait for successful Pages build/deploy/report, run the existing committed-source public comparison, then confirm live C and cache version through ordinary browser navigation. No real reader-record writes.
- [ ] Save release evidence, recovery and remaining device/service limits. Update overview, daily, prototype verdict and separate Joe/AI boards. Keep Joe's comments/book work intact. Save post-release notes locally without a recordkeeping deployment.

## Joe's comments

C's refined inline behavior and agent build/publication are approved in the linked design. _Add feedback here._
