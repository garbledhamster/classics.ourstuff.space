# Classics preservation baseline

Captured October 17, 2026 from public commit `96892acf65e079a1efda1d35a6f8499bd59923e4`, before the interface rebuild. The payload is this checkout's root. The isolated branch is `interface/study-desk-a`; it is separate from the throwaway prototype.

At baseline capture, the public README described a private workspace with `src/` and npm commands, while this checkout had neither `src/` nor `package.json`. Joe resolved that source question on October 17: use current GitHub, ignore the old Gitea side, and proceed without the unavailable laptop. The coordinator fetched GitHub main and confirmed it still points to `96892acf65e079a1efda1d35a6f8499bd59923e4`, matching this baseline. This public checkout is authoritative for the rebuild; absent private npm checks are not blockers. The manifest retains its original capture metadata. Release verification remains a separate task.

## How to repeat the check

```sh
node --test tests/interface/preservation.test.mjs
python3 -m http.server 4319 --bind 0.0.0.0 --directory "$PWD"
```

Open `http://localhost:4319/` in a disposable browser context. `localhost` selects the existing local reader simulation. The VPN IP selects cloud mode in the original runtime, so it must not be used to seed or change test records. The preview serves `index.html`, `assets/`, and `data/` directly; it does not substitute a prototype host.

The JSON manifest records original bytes, requests, markup, options, and public text. Tests inspect the current production source as well as the manifest. The browser checks below cover representative rendered behavior. Source checks cannot establish that every control remains visible, reachable, or correctly wired after a redesign; repeat the browser checklist as implementation proceeds.

## Browser checks completed on the original app

A background Codex in-app browser opened a fresh localhost context. It initially showed no notes and unsigned account controls. No real sign-in, payment, publication, profile reset, or cloud write was performed. Only the disposable records described below were created. The QA tab was closed afterward; unrelated tabs were preserved.

| Surface | Verified original baseline | Repeat after rebuild |
| --- | --- | --- |
| Library | `libraryView` / `tabLibrary`; title Library; 243 works; first page 1–10; page sizes 10 and 50. First record The Wealth of Nations, Adam Smith; 0/2 done, Incomplete, Notes 0, Not Started; occurrences Y1 #17 and Y8 #14. | [ ] Search, idea filter, alphabet, pagination, occurrence links, full selected card |
| Bookclub | `planView` / `tabPlan`; heading Great Conversation Bookclub; Year 1; 0/26 done. First work Apology (399 BCE), Plato, Year 1 / Order 1 / Core. Republic retains Selection: Book I–II. | [ ] Year stepper/all years, filters, full/table views, columns, selected work context |
| Great Authors | `authorsView` / `tabAuthors`; title Great Authors. Adam Smith: 0/2 done, Incomplete, 1 work, Notes 0, linked The Wealth of Nations. Aeschylus links Agamemnon, Choephoroe, Eumenides, Prometheus Bound. | [ ] Search, alphabet, reset, pagination, full selected author and work links |
| Conversation Desk | `deskView` / `tabDesk`; My Articles, Working Drafts, Published by Me, Published Reader Index, private article workspace, Reading Pane. Local article saved and Markdown preview updated. | [ ] Reopen private draft, fields, sources, themes, Markdown tools and copy |
| Glossary | Generated `glossaryView` / `tabGlossary`; search, All Letters selector and alphabet. Justice opened all five panels, listed below. | [ ] Search, letters, modal navigation, idea links, related-work navigation |
| Get Started | Generated `getStartedView` / `tabGetStarted`; The Great Conversation; “A Twenty-Five-Century Dialogue You Are Invited to Join”; Inside This Edition; At a Glance: 10 years, 103 Great Ideas, ~130 works, 2500+ years of ideas. | [ ] Complete original article, contents links and entry actions remain reachable |
| Notes Drawer | `notesDrawer` / `openNotesBtn`; new/close, search, book filter, six type checkboxes, Export JSON, Import JSON, Show Archived, Select, Filter by Bookclub. Sample note saved, exported and still present after reload. | [ ] Reopen/edit/archive sample; import/export; selection and bulk controls |

### Disposable save and export results

- In Bookclub, Apology's Reading status changed from `not_started` / Not Started to `in_progress` / In Progress. After reloading and reopening Bookclub, the selected option remained In Progress. The original header pill continued to show Not Started immediately after the change; do not treat that pill as evidence that saving failed.
- A note was created through Notes Drawer → New Note. Title: `Preservation fixture — Apology`; book tag: `Apology`; author: `Plato`; year: `1`; selection: `Disposable baseline record`; type: Note. Body: `Disposable preservation fixture. The question is whether a reader can examine an argument without losing the thread.` The rendered note and its fields were still present after reload.
- Notes Export JSON downloaded `reading-notes-export-2026-10-17.json`. Parsed output has `exported_at` and `notes`, with one disposable note. It retains `id`, `title`, `book_tag`, `year`, `author`, `selection`, `body`, `note_type`, `created_at`, and `updated_at`. No export was imported into Joe's records.
- Bookclub Export → JSON downloaded `classics-progress-2026-10-17.json`. Parsed output has `exported_at`, `plan_name`, and 243 `entries`. The Apology row retained Plato, Year 1, core, status In Progress, No Action, empty dates, all three reading-stage flags false, `notes_count: 1`, and the sample note text. The export modal offered Cancel, CSV, and JSON; CSV was inventoried from source but not downloaded.
- Conversation Desk saved a private, unpublished article titled `Disposable preservation article`, central question `How do I keep the question attached to the work?`, body `# Disposable baseline` followed by `A local article for interface preservation checks.` The Working Drafts list and Reading Pane showed those changes. Request Publish was not used.
- Clicking the first Bookclub work's New note control did not visibly open the drawer in this check. The global Notes Drawer route worked. This is an original-app observation, not a rebuild regression or a request to change saving logic.

### Glossary: Justice

| Panel | Verified text and behavior |
| --- | --- |
| References, 1 of 5 | “See” begins `CH 42: Justice; and Constitution 5a; Democracy 3a, 4a(2)`; “See Also” begins `Aristocracy 1b; Constitution 2b; Government 1c`. Complete reference content remains in the protected public data. |
| Idea Map, 2 of 5 | Term Justice → 26 mapped ideas → 18 related works; Mapped Great Ideas; Mapping Rule. |
| Dictionary, 3 of 5 | `Local mode: Dictionary enrichment needs a remote service. References, idea map, and related library still work.` |
| Wikipedia, 4 of 5 | Wikipedia Summary; `Local mode: Wikipedia enrichment needs a remote service. References, idea map, and related library still work.` |
| Related Library, 5 of 5 | 18 results with Matched by context. First: American State Papers — The Federalist Papers; Aristocracy, Constitution, Government, Law, Liberty, Slavery, State. Plato — Republic and Adam Smith — The Wealth of Nations remain among the matches. |

The modal's previous/next buttons advance through the existing ordered panel registry; close returns to Glossary. Remote enrichment was deliberately left at the original local-mode fallback. This does not verify live remote services.

## Complete source-backed inventory

`preservation-manifest.json` is the detailed inventory: six data hashes; six page triples; Notes Drawer; five Glossary panel renderers; 13 control groups; 203 emitted IDs; 116 action/control attributes; original select markup; 407 literal markup text entries; 45 link targets; 30 head-resource/reCAPTCHA guards; 22 loader and fallback snapshots; six protected module hashes; the exact inline Firebase bridge; saving, timer and export source guards.

| Group | Preserve |
| --- | --- |
| Library | Title/author/ideas/tags search; Great Idea; A–Z/#; 10/50 pagination; dates; five statuses; eight reading actions; external searches; notes; desk; occurrence links |
| Bookclub | Title/author search; Year 1–10 and All Years; Great Idea; status filters; full/table mode; column picker; reset filters; progress export; completion; three reading stages; dates/status/action; learning links; notes/desk/library |
| Authors | Search; reset; A–Z/#; pagination; name; done/incomplete/work/note counts; author-work links; reference and study actions |
| Notes | Search; book filter; Note, Quote, Excerpt, Reflection, Essay, Great Idea; note title/book/type/year/author/selection/body; save/delete/archive/cancel; import/export; archive view; selection and bulk controls |
| Conversation | Article rail; own/published groups; title; visibility; publication status; linked work/author; central question; Markdown body and preview; source title/URL/note; themes; save/copy/delete; publication request controls |
| Glossary | Search; letter selector/grid; term list; term/qualifier; five modal panels; previous/next/close; reference text; idea mapping; dictionary and Wikipedia caches/fallbacks; related work matching |
| Get Started | Complete original introductory article, section navigation, FAQ and entry actions |
| Account | Sign-in/profile; email/password; Google; sign-up/name/password confirmation; provider linking; sign-out; manual sync; sync/payment summary; reset profile |
| Timer | Open/close; presets; custom minutes/seconds; set/start/reset; display; alarm options; volume; test sound; settings/state persistence and restoration |
| Export | Progress Cancel/CSV/JSON; note JSON export/import; exact filenames and output fields |
| Donation | Open/close/cancel; preset/custom amount; validation; checkout control; local simulation; cloud worker request construction |
| Legal | EULA text, acceptance checkbox, accept/decline/close controls. No agreement accepted during QA. |
| Shared | Dark mode; learning-goal menus; search settings/preview, title/author/selected works/custom terms; alert/confirm/prompt dialogs |

Reading statuses remain Not Started, In Progress, On Hold, Complete, Skipped. Reading actions remain No Action; Period Documentary; Author Documentary/Biography; Pre-reading Breakdown; Reading 1 — Inspectional; Summary of Book or Works; Lecture/Discussion; Reading 2 — Analytical. Bookclub's status filter options remain — All —, Book → In-Progress, Book → Complete, Book → Not Started, Book → Skipped. Conversation visibility remains Private and Logged-in users after approval.

### Expanded sections and selected-owner context

Preserve Black Box Thinking's inputs, central work/selection and outputs; linked-note titles/previews and navigation; Book Information and its source cycling/fallbacks; Before reading, During reading and After reading guidance with their original links and completion flags.

The original card owner context sits outside some control drawers. Library uses `.libHead`, `.libTitle`, `.libAuthor`, `.tagRow`, `.ideaTagRow`, and `.occList` before `.libDrawer`. Bookclub uses `.workMain`, `.workTitle`, `.workSub`, status/year/order/tier/note pills, idea/custom tags, and selection text before `.workDrawer`. Great Authors includes the author heading, counts and Works (click to view in library) links before its action drawer. A phone overlay must retain the full selected owner's original nodes, content and relationships; moving only the control drawer would omit required context.

### Exact requests and protected behavior

The six original data paths are `./data/library.json`, `./data/bookclub.json`, `./data/greatbooks.csv`, `./data/syntopicon_terms.json`, `./data/glossary_app.json`, and `./data/manifest.json`. Preserve raw bytes, including BOMs. Catalog/plan/CSV/glossary requests retain `cache:"no-store"`, their loading order, result handling and fallbacks.

The manifest contains exact source for Open Library's encoded title/author, limit and fields; Gutendex's joined query; Wikipedia search then first-hit summary; dictionary/Wikipedia candidate keys, cache behavior, local/offline gates and fallbacks. It also captures the browser manifest link, original font/icon/CSS resources and reCAPTCHA construction.

Firebase's SDK/configuration/bridge, account module, cloud sync, storage keys and normalization, runtime host detection, local simulation and data-path module remain byte-identical. Existing worker calls remain the donation POST and authenticated payment-summary GET at `https://stripe-worker-api.jrice.workers.dev`, with the same JSON fields, authorization, response defaults and error handling. No cloud requests were exercised to verify mutations.

## Task 2: shell and read-only Home verification

October 17, 2026. Node overview and preservation checks pass with the original manifest unchanged. Home shows the real 287 plan occurrences; stale checked keys are excluded, archived notes are excluded, legacy string/array note types retain their behavior, and continuation uses existing occurrence keys. A selected occurrence takes precedence while unfinished readings remain; all-complete returns no continuation. All-years completed progress retains its actual population.

The real-root preview ran at `localhost:4319` (worker session 59449); the coordinator also retained `localhost:4320` (session 77597). Browser QA completed on `http://127.0.0.1:4319/`, another local-simulation origin. The first in-app browser displayed the changed shell with an empty Home and no logged console errors; a developer reload call stalled, was interrupted, and that browser became unavailable. Its exact cause was not established. A fresh Brave task tab rendered current Home correctly; no production cache, loader, URL, or runtime change was made to address the diagnostic issue.

- All six original pages passed Home → page → Home with exactly one `.view.on`; direct Desk → Glossary and Desk → Get Started also hide Desk.
- Empty Home's Writings metric opened the existing empty Desk and returned with zero drafts. The original Desk tab still creates its first draft as before. A disposable writing edited through the existing UI reopened from Home with the same ID and exact title/body; no duplicate appeared.
- Search, Great Idea, and status filters hiding Apology cleared only as necessary; the exact original occurrence `y1|o1|core|plato|apology` opened through `.workMain`'s existing toggle. Year and visible controls matched.
- The local-only [browser harness](study-home.browser.html) imports actual app modules inside the real app iframe, uses temporary in-memory fixtures, rejects/counts storage writes, restores state and guards in `finally`, and reports **29/29 passed**. It covers tier exclusion (no tier control exists in the current HTML), task/action sorting retention (sorting does not exclude readings), matching filters, original note/draft IDs and text, metrics, dynamic page exclusivity, unchanged fixture records/completions, and **zero storage-write attempts**, including any caught attempts.
- At desktop width 1512 and emulated phone width 390, the page had no horizontal overflow. All eight main navigation entries, original account controls, and Home metrics remained reachable. Dark mode used existing ink/paper variables and was visually checked; QA restored light mode and the default viewport. Enter activated the finished-readings metric and Home tab correctly.

Repeat the checks:

```sh
node --test
# Serve the real root; visit only a localhost/127.0.0.1 origin:
# http://127.0.0.1:4319/tests/interface/study-home.browser.html
```

This is Task 2 verification only. Original detail presentation, whole-site action parity, physical phone testing, and release remain in later tasks. No sign-in, cloud write, payment, publication, or real reader-data change occurred.

## Task 3: Library and Great Authors detail presentation

October 17, 2026. The original Library/Authors grids retain their cards, headers, detail nodes, datasets and delegated handlers. Desktop places the active original drawer over a right-side slot. Phone presents the complete original owner, including its title/author, tags, occurrence links or author-work links. Close invokes the original header toggle and book-detail cleanup.

The local-only [detail browser harness](detail-presentation.browser.html) passes **47 checks** against the real modules. It verifies node identity and ancestry; desktop geometry and long titles; metadata and learning-control dimensions; close/reopen/cleanup; Enter/Escape and focus return; replacement/filter/pagination behavior; actual source cycling with temporary Open Library/Gutenberg/Wikipedia source content; phone context, focus wrapping, overflow and dark mode; the original Notes, author-work, idea-filter and occurrence routes; modal priority; hidden-view body-scroll/focus cleanup; generic no-detail table skipping; and complete destruction/replacement attribute restoration. It counts and rejects storage writes: **zero attempts** during these presentation/navigation checks. Temporary state and theme are restored afterward.

Native browser checks also covered Enter, Space and Escape, the original reading-action dropdown, Search Settings above the detail panel, and a phone Desk action. The Desk action intentionally exercised its existing save behavior on `127.0.0.1:4322`: it created a disposable private draft titled `On The Wealth of Nations`, with the original work/author context, and displayed Conversation Desk with no phone overlay and restored body scrolling. No publication or cloud-origin action occurred.

Visual checks used desktop width 1512 and phone emulation at 390 × 844. The list remained visible beside desktop details; phone retained all selected-owner context. Browser screenshots were inspected in-tool. This is emulation, not a physical-phone check.

The initial browser RED was the original 309px static drawer inside a 337px card, with no detail slot. Subsequent focused regressions caught and corrected generated detail-ID cleanup, Notes modal semantics, hidden-view focus return, narrow metadata controls, tall nested learning controls, detached original styles, and the empty-slot accessibility prompt. Final `node --test` passed **15/15**, all Classics module syntax checks and `git diff --check` passed, with the original manifest and preservation guards unchanged.

The parent preview remains port 4320. Worker verification used a temporary no-store development server at port 4322 to avoid stale nested-iframe module responses; no production caching, loader or URL changed. Repeat the harness on any localhost/127.0.0.1 real-root preview. Remote enrichment remains locally gated: the test verifies the original cycler using temporary attached source data, not live remote-source responses. Original request construction and parsing remain guarded by the unchanged preservation suite. Reading-plan presentation is Task 4 and is untouched here.

## Task 5: final local parity and release preparation

October 17, 2026. The final tree passes **15 Node checks** and **204 actual-module browser checks**: Home 29, shared detail presenter 52, Bookclub 53, whole-site 70. All Classics modules, `main.js`, and the standalone browser harness scripts pass `node --check`; `git diff --check` passes. The original preservation manifest and its tests were not changed or regenerated. The six protected data files and original runtime/account/storage/sync modules remain byte-identical; the loader guards retain request URLs, parameters, defaults, parsing, order and fallbacks.

The final fix is limited to the detail presenter. On phone, closing an original overlay now returns focus to the visible selected details when its close control becomes hidden. Notes and Search Settings retain focus and modal priority while open. A real failing check reproduced the missing Notes return before the fix; both original close controls pass afterward. Native browser Enter opened the original Library header, Enter closed Notes and focused `detailClose`, and Escape returned focus to `libHead` with body scrolling restored.

### Original-action comparison

The [whole-site harness](whole-site.browser.html) runs identical original actions on the archived `96892ac` app and the rebuilt app, at localhost only. It uses fixed disposable note IDs and a fixed fixture clock so record comparisons are exact. The parent host owns the storage snapshot and cleanup before seeding. It removes the test frame before restoring and verifying exact prior localStorage on completion, module/iframe errors, early assertion failure, host navigation or a 60-second deadline. The child restores its temporary in-memory changes in `finally`.

Both versions produced:

```text
notes/timer/content SHA256
c4371c49d861d389b5c050f3fdff8e213376a22f09eb223f7ae281fff5cc28ed
```

The compared snapshots cover existing-note edits; archive/unarchive; bulk archive/unarchive; cancelled, single and bulk deletion; original deletion tombstones; object and array imports with existing-ID merges and legacy/invalid type normalization; full JSON note exports; timer state/settings; the five Justice panel texts; and the complete Get Started text/link targets. Malformed JSON reports the original error without replacing records. The original four timer presets, custom duration, start/pause, saved paused-time restoration, Resume and volume/alarm setting restoration also pass. Restoration uses saved fixture records present before the normal app load. The harness's attempted second-frame reload was unreliable and was replaced by this startup check; no application loader changed.

The Bookclub harness still produces the exact previously captured progress/export digest:

```text
b0b98c9d81f70ae8a81aac4c15249998c87e62c89abad42e218f6cc06b5c1f39
```

That comparison covers occurrence completion/stages, work-level status/tasks/dates, and original JSON/CSV exports. Its final run also verifies original note fields/types, Desk save identity/body/context, preview, resize and phone transition cleanup.

### Rendered coverage and limits

At iframe widths 1200 and 390, the whole-site checks open Library, Bookclub, Great Authors, Glossary and Get Started through their original navigation. The Home harness separately covers all six original page routes, Desk, Notes and route exclusivity. The detail and Bookclub harnesses cover the original expanded sections, complete selected-owner context, table/full views, no-match replacement, long titles, async attached-source completion/cycling, dark mode, keyboard focus and phone overflow.

Glossary checks open all five Justice panels in order, move backward, close, search for a term and show the empty-search state. The Related Library panel retains Republic and The Wealth of Nations. Dictionary and Wikipedia display their existing local-service fallback. Full intro text and link targets match the baseline. This verifies representative rendered content plus the complete protected-source inventory; it is not a claim that every catalog record, every external link or every asynchronous network failure was individually exercised.

Sign-in fields, Google entry, signup fields, legal text and its unchecked/disabled acceptance controls, donation presets (5, 10, 15, 20, 25, 50, 100), custom amount, checkout entry, reset entry and signed-out sync indicators remain available at both widths. Authenticated profile/manual-sync controls are retained in the original markup and byte-identical account/sync code; a signed-in live profile session was not exercised. No credentials, agreement acceptance, profile reset, checkout, publication or cloud mutation was submitted. Alarm audio and notification permission behavior were not exercised.

The Mac preview at `http://10.200.0.59:4320/` loaded the real app with Home and 287 plan readings. Desktop 1512 × 982 and phone emulation 390 × 844 screenshots were inspected. Phone Home had no horizontal overflow and retained all navigation/account entries. This address selects the original **cloud mode**; access and layout were checked read-only. The coordinator then reproduced the reCAPTCHA message **“ERROR for site owner: Invalid domain for site key”** on both this build and the untouched `96892ac` app at the VPN origin. This is a pre-existing VPN/cloud-origin configuration limit; the interface rebuild does not resolve it, and auth/configuration were not changed. **Physical-phone verification remains pending.** Viewport emulation does not satisfy that check.

### Review and release checklist

- [x] Current GitHub source is authoritative; original baseline is `96892acf65e079a1efda1d35a6f8499bd59923e4`.
- [x] All four local browser harnesses, full Node suite, syntax and whitespace checks pass on the final production tree.
- [x] Protected data, original loaders, account/runtime/storage contracts and unchanged preservation guards pass.
- [x] Recovery bundle verified at `.superpowers/sdd/INTERFACE-REBUILD-PLAN/pre-release-baseline.bundle`; it contains `main` at the original baseline and complete history. `git bundle verify` succeeds. The working branch retains every implementation commit.
- [x] `CNAME` remains `classics.ourstuff.space`. No checked-in deployment workflow was added. The full prototype remains on `prototype/study-workspace`.
- [x] Independent Task 5 and whole-branch reviews passed at `1379aea`, with no outstanding findings.
- [ ] Joe reviews the rebuilt preview and chooses how to integrate the branch.
- [ ] Physical phone over the VPN: navigation, selected details, original Notes/Desk fields, keyboard, dark mode and scrolling.
- [ ] Confirm the current host's deployment mechanism and release authorization; no push, merge or deployment was performed in this task.
- [ ] After an authorized release, verify deployed pages, protected data and original content/load paths. Live sign-in/profile/sync, remote enrichment, payment and publication need an appropriate authorized test scope; no live behavior is claimed from local simulation.

Temporary QA tabs were closed, viewport overrides reset and the worker's localhost server on 4324 stopped. The coordinator's server on 4320 remains running. Disposable writes stayed on localhost/127.0.0.1; My Vault and Joe's reader records were not changed.

Repeat the local harnesses by serving this repository root and opening:

```text
/tests/interface/study-home.browser.html
/tests/interface/detail-presentation.browser.html
/tests/interface/bookclub-presentation.browser.html
/tests/interface/whole-site.browser.html
```

For an original-action rerun, extract `git archive 96892ac` into ignored `.superpowers/sdd/task5-baseline/`, then append `?baseline` to the whole-site harness URL. The committed expected digest remains fixed. The baseline extraction and recovery bundle are review support, not production files.

## Selected A production acceptance — October 17, 2026

Task 3 started at `72e7c1412bc3853b27d46d47593d4439b7859598` on `interface/study-desk-a`, after the shared presenter and shell/Home tasks passed independent review. Fresh final acceptance passes **15/15 Node checks** and **300/300 rebuilt actual-module browser checks**: Home **35**, shell/Glossary **59**, Library/Authors **63**, Bookclub **62**, whole-site **81**. The whole-site count includes its original **70 unchanged assertions** and **11 supplemental selected-A presentation assertions**. A fresh archived-original run separately passed **70/70**.

### Original content, saves and Desk

The archived `96892ac` app and rebuilt app both produced this exact notes/timer/content digest in this task:

```text
original: c4371c49d861d389b5c050f3fdff8e213376a22f09eb223f7ae281fff5cc28ed
rebuilt:  c4371c49d861d389b5c050f3fdff8e213376a22f09eb223f7ae281fff5cc28ed
```

The pre-change Bookclub progress/export digest retained in the original assertion and this task's rebuilt output also match exactly:

```text
original capture: b0b98c9d81f70ae8a81aac4c15249998c87e62c89abad42e218f6cc06b5c1f39
rebuilt:          b0b98c9d81f70ae8a81aac4c15249998c87e62c89abad42e218f6cc06b5c1f39
```

These comparisons retain exact note records and JSON exports, progress JSON/CSV, occurrence completion/stages, shared-work status/tasks/dates, tombstones/imports, timer state/settings, five original Justice panel bodies and the complete Get Started text/link targets. The six original data hashes, six protected runtime/account/storage modules, 22 loader/fallback snapshots, original URLs/parameters/parsing and inline Firebase/reCAPTCHA bridge pass the unchanged preservation suite. The real populations remain **243 Library works** and **287 plan occurrences**.

The preservation manifest and test remain byte-identical to reviewed `084a1bb`:

```text
23b85899d2ba05d0d707b46143e5de096947d086525120548722b830c9bcf3dc  preservation-manifest.json
4cbe0ad737754dea763c138686e947cb0a63bb4c5080f7517ee79c3bc8cf387e  preservation.test.mjs
```

Conversation Desk's controller, styles and complete `deskView` section match original `96892ac` byte for byte; `main.js` also matches the original. The controller hash is `0d90757e629ee6da2a78f252db219172ebfc1a3bd6b2f6bc01f6897f98849a81`, styles `8f3ae92f25aaa0dde2945ebf7edfe1d5e86a6e3eb9aae7f5a17b7e1a9cde5fc5`, and section markup `e45399885849f7d0af5b8a3e91612933abb1a488cef07f6acce0b2b628674ae4`. `writing-desks.js` matches reviewed `084a1bb` at `7386771f624c18e8941b86d19e7066d35747bb8d2635cdf006b1af7945d1d524`; its earlier approved note-type extraction and page-exclusivity edits predate this selected-A work. It is not byte-identical to public `96892ac`. `main.js` is `4d4c7c9d35b39d64b371b02a52938d9481fadd0f897e78bb4c0faf8b24d4e8b1`.

Bookclub's actual-module checks retain original owner/control identity and readingBlock/year ancestry, all full/table/year modes, original column hide/restore, fields/options, note save/reopen, and unchanged Desk draft identity, work/author context, autosave, preview, resizing and phone-transition cleanup. Home's Start now opens the original unsaved Notes editor without a record and creates exactly one original Desk draft. Presentation-only navigation still attempts zero writes.

### One visual pass and one correction

One batched CUA visual pass compared production with selected A at `http://10.200.0.59:4325/?variant=A`, using desktop and **390px** phone width. It covered Library, Bookclub, Authors and Glossary index/body pairs, Home icon/empty actions, dark mode, long title/content, Enter/Escape, nested Notes, independent reading scroll, compact disclosures and original table tools. The complete selected owner remained available. A native reading-pane scroll advanced from 0 to 620.5 while its index stayed at 0.

The batch found four presentation defects: a rectangular labelled Notes masthead control; oversized desktop indices and regular proxy titles; wrapped heavy Library/Authors alphabet controls; and duplicated generated author-toolbar text. Eleven focused geometry/behavior assertions all failed before the correction; the red fixture restored exact prior localhost storage. One coordinated correction made Notes a square icon with its original accessible label and handler, set desktop browse indices to 240px with compact bold proxy text, retained all alphabet buttons in one horizontally scrolling phone row, and deduplicated only the generated toolbar text. Original owner content, action controllers, requests and saved behavior were preserved.

The one allowed confirmation inspected the corrected desktop Library/Bookclub/Authors/Glossary and phone shell, Library and selected Bookclub/Authors bodies. No remaining finding from that batch was observed. All affected functional harnesses were rerun after the correction. This was a bounded acceptance pass; no further visual polish loop was performed.

### Environment, cleanup and limits

Fixtures used the parent-owned no-store server at `http://localhost:4329/`. Existing backup/finally restoration paths were retained. Whole-site original, red and green runs each reported **parent restored exact prior localhost storage**. Home reported **localStorage restored and verified**; Bookclub reported its original finally restoration. The ignored visual host also restored and verified its prior storage before closure. Agent-created Brave QA/reference/VPN tabs were closed, the temporary viewport override was reset, and unrelated user tabs were preserved. The parent server remains running.

The separate `http://10.200.0.59:4329/` view loaded Home and all 287 plan readings read-only. This address retains original **cloud mode** under the protected host detector. No domain warning was visible in this task's current Home view. The earlier verified **“ERROR for site owner: Invalid domain for site key”** warning on the VPN/cloud origin remains an existing configuration limitation; this task did not change auth/configuration or re-establish live authentication.

The bounded layout detector exited **0**, stdout **`[]`**, stderr **empty**. Earlier session scans lacked optional `htmlparser2`, `css-select`, `css-tree` and `domutils`; preserve that limitation separately from this run's observed output. The scan is **degraded evidence**, not layout certification. Rendered and behavior checks supply the substantive layout evidence. No context setup script, skill update, CDP, Runtime/Network or dev-log diagnostics were used.

**Physical-phone use remains pending.** Phone-width browser checks do not establish access from Joe's phone. Local fixtures do not verify live sign-in/profile/sync, enrichment, payments, publication or release. Original local-mode Dictionary/Wikipedia/book-information fallbacks remain expected. No merge, push or publication occurred.

### Repeat commands

From this checkout root, with the parent no-store server serving the same root:

```sh
node --test
find assets/js/classics -name '*.js' -exec node --check {} \;
node --check assets/js/main.js
node --check tests/interface/bookclub-presentation.browser.js
node --check tests/interface/whole-site.browser.js
git diff --check
```

All **24 module scripts** and **five inline browser fixture scripts** passed syntax checks. Inline scripts can be repeated without writing temporary files:

```sh
python3 - <<'PYTHON'
from pathlib import Path
import re, subprocess
for path in Path('tests/interface').glob('*.html'):
    for match in re.finditer(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>', path.read_text()):
        if match.group(1).strip():
            subprocess.run(['node', '--check', '--input-type=module'], input=match.group(1), text=True, check=True)
PYTHON
```

Open each local-only fixture through CUA and read its `#result` after completion:

```text
http://localhost:4329/tests/interface/study-home.browser.html
http://localhost:4329/tests/interface/study-shell.browser.html
http://localhost:4329/tests/interface/detail-presentation.browser.html
http://localhost:4329/tests/interface/bookclub-presentation.browser.html
http://localhost:4329/tests/interface/whole-site.browser.html
http://localhost:4329/tests/interface/whole-site.browser.html?baseline
```

The baseline URL uses the existing ignored `git archive 96892ac` extraction at `.superpowers/sdd/task5-baseline/`. Do not run disposable writing fixtures against the VPN/cloud origin. Supplemental selected-A assertions run only against the production-root frame, leaving archived-original action parity at its original 70 checks and digest.

## Final branch review: empty shelf searches — October 17, 2026

The final review of `aacfce9dc7fadec84ea3878a8a416c63ed6d13b4` found one empty-search regression. Library and Authors still rendered their original **No matches** cards, but the selected-A layout hid them and left the desktop selection prompt visible. `presentShelfDetails` now disables the shelf layout while no original `.libDrawer` exists. Clearing the filter re-enables the same presenter and original action nodes. No renderer, content, action, loader or CSS changed.

The focused [Library/Authors fixture](detail-presentation.browser.html) retains all **63** prior assertions and adds **24** checks across both shelves at **1200px** and **390px**. Before the production edit, the new checks showed **six expected failures**: original feedback hidden on both shelves at both widths, plus misleading selection prompts on desktop. Recovery assertions already passed. After the one-line correction, the fixture passed **87/87**, including original identity/order/ancestry, loaders/source cycling, routes, overlay priority, cleanup and zero presentation-write assertions. New checks cover original visible feedback, prompt absence, released selection/body scrolling, ordered index recovery, original owner selection and Back focus. Both RED and GREEN reported **FINALLY parent restored exact prior localhost storage**. The fixture host now snapshots storage before app startup, removes the child before restoration, verifies equality, and handles completion, failures, page exit and timeout.

Fresh checks on the corrected source: **15/15 `node --test`**, `node --check assets/js/classics/detail-presentation.js`, syntax of the changed fixture's host and injected module scripts, and `git diff --check`. Direct byte comparisons to `aacfce9` also passed for `library-shelf.js`, `authors-atlas.js`, `main.js`, `writing-desks.js`, the preservation manifest and preservation test. The unchanged Node guards cover protected data/runtime/account/storage and original loader contracts. No assertion was removed or weakened.

**Code-head distinction:** the previous **300/300 rebuilt** checks (Home 35, shell/Glossary 59, Library/Authors 63, Bookclub 62, whole-site 81), **70/70 archived-original** checks, both exact saved-output digests, and **24 module + five inline script** syntax results remain evidence from `aacfce9`. This fix reran only the affected **87-check Library/Authors fixture**, the full **15-check Node suite**, and changed-script syntax/whitespace checks. It does not claim a fresh 324-check whole-site run. The tested correction was the working tree on `aacfce9`; its committed production source blob is `887454c6be58ae05fa88e53b7295f56817bc0876`, and fixture blob is `57b5ec6f609b77769904c70133b8d83a7d4890c8`. The final-fix commit contains those exact tested blobs.

CUA used fresh Brave QA tabs at **localhost:4329** only. Both owned tabs were closed after reading their final cleanup results; no viewport override, CDP, Runtime/Network or dev-log diagnostic calls were used. No user preview tab was claimed or changed. The parent server remains running. This was a focused functional correction; no further visual polish or unrelated browser suite was run. Physical-phone and live-service checks remain pending as described above. No merge, push, publication, project tracker, README or daily-note change occurred in this fix.

## Selected A review and handoff — October 17, 2026

All three tasks in [QUIET-PANES-PLAN.md](../../QUIET-PANES-PLAN.md) passed independent spec and quality review. The complete `96892ac..aacfce9` branch review found one Important empty-search feedback regression and no other findings. The single correction wave at `91aae7c` passed scoped independent re-review: original finding addressed, no new breakage or out-of-scope observations. No unresolved review findings, deferred items or controller rulings remain.

The implementation is retained on `interface/study-desk-a` at `91aae7c`; the plan and this record hold the durable handoff. [Production Mac/VPN preview](http://10.200.0.59:4329/). Joe's original prototype remains open separately at port 4325. The production preview retains original cloud mode; disposable tests stayed on localhost with exact storage restoration. At coordinator handoff, the refreshed VPN Home showed the existing reCAPTCHA message “ERROR for site owner: Invalid domain for site key”. This was previously reproduced on the untouched public original as well; configuration/authentication remain unchanged. No merge, push or publication occurred. Joe's preview review, physical-phone use, live services, timer audio/notification permissions and deployment verification remain outside completed local acceptance.


## Contained workspace refinement — October 17, 2026

Joe clarified that lists and text may scroll while the outer page stays still. The non-Desk shell now owns the viewport. Existing controls sit in a bounded group above the original reading layout; the original paginator uses its natural width. Phone masthead controls share rows, preserving text, type, order and 44px targets. Complete lists, selected owners, Home and Get Started remain available through their designated internal scrollers. Presenter heights use visible layout/work bounds, including the footer, rather than a hidden phone slot or viewport-only floor. Conversation Desk retains the incumbent wrapper/body flow.

### Tested source and results

All results below apply to the working tree on `552b0e16f1cdeccdb5eacf4e1c1d6c2f2cddddf4` with these exact production blobs:

```text
19378e61469793cabf7935256b19e21b49d95252  assets/css/study-workspace.css
e60563145924ce410b4452fef0cf87a9ce05f80f  assets/js/classics/study-shell.js
898dbaa6834367fb74b3f7daa6833669c8aabb7a  assets/js/classics/detail-presentation.js
```

Fresh CUA runs at parent-owned no-store `localhost:4329`:

| Harness | Checks |
| --- | ---: |
| [Contained scrolling](contained-scroll.browser.html) | 377/377 |
| Home | 35/35 |
| Shell and Glossary | 59/59 |
| Library and Authors | 87/87 |
| Bookclub | 62/62 |
| Whole site | 81/81 |
| Archived public original `96892ac` | 70/70 |

The five existing rebuilt harnesses total **324**. The new **377** and archived-original **70** are separate runs. Bookclub save/export remains `b0b98c9d81f70ae8a81aac4c15249998c87e62c89abad42e218f6cc06b5c1f39`; rebuilt and archived notes/timer/content both remain `c4371c49d861d389b5c050f3fdff8e213376a22f09eb223f7ae281fff5cc28ed`. Original controller/action/storage/request/data guards remain unchanged. Node passes **15/15**. Syntax passes for **25 file scripts and six inline host scripts**; whitespace checks pass.

### Red, green and geometry

The new actual-module fixture ran before production edits. It reported 113 failures: 109 exposed outer scrolling, moving mastheads, missing internal Home/Get Started overflow, and reading-body bounds; four exposed an incorrect test comparator that disabled incumbent A styling as well as the new block. The comparator was corrected to retain all incumbent A CSS and disable only the appended contained-workspace block. Two subsequent practical-height RED assertions reproduced 31px constrained shelf indices. A final native wheel check caught transparent original grids covering unpositioned proxy indices; three focused hit-target RED assertions failed before restoring the generated index's positioned layer. The final 377 checks include 16 real `elementFromPoint` assertions across shelves, Bookclub and Glossary. No prior assertion was removed or weakened.

The fixture checks 1440×900, 390×844, 900×650 and 780×500, including long content, last rows, empty filters/recovery, selections/Back focus, original table mode, all five Glossary panels, Notes priority, routes/source cleanup through existing harnesses, expanded controls, final Help/Account focus and footer content. Scroll attempts leave document/body/wrapper positions at zero; mastheads stay stationary. Phone Library work starts at **290px**, work height is **479px**, and its index is **183px** (initial shell correction was only 81px). Desktop Library index is **380px**; at 900×650 it is **212px**, and at 780×500 it is **89px** with a complete **45.5px** paginator. Type and targets were not reduced.

Desk comparison uses the same actual app, data and modules, replacing only the appended CSS block with incumbent styles. Before/disabled/restored geometry and overflow match exactly:

| Frame | Body height/width | Wrapper height | Display / padding | Body overflow |
| --- | --- | --- | --- | --- |
| 1440×900 | 900 / 1440 | 846 | block / 0 42 64px | hidden auto |
| 390×844 | 1431 / 375 | 1430.6796875 | block / 0 19 45px | hidden auto |
| 900×650 | 737 / 885 | 737.4140625 | block / 0 26 64px | hidden auto |
| 780×500 | 842 / 765 | 842.4140625 | block / 0 26 64px | hidden auto |

The narrow Desk widths retain its original vertical document scrollbar. `index.html` is byte-identical to the pre-refinement base; the exact Desk section matches public `96892ac`. Desk controller/styles, writing-desks, main, preservation manifest/test and original renderers/data remain unchanged. The Bookclub harness also freshly verifies Desk editing, autosave, draft identity, preview, metadata, resizing and phone transition cleanup.

### Confirmation, cleanup and limits

One final desktop/phone screenshot batch was used. The desktop interaction exposed the hit-layer defect; focused functional repair and final suites followed, without another desktop screenshot or polish round. The remaining phone confirmation showed the compact original controls and reading list. Real desktop wheel moved the index **0→380** while body/document/masthead stayed **0**; keyboard paging also stayed internal. An actual phone pointer click opened the original full **390×844** owner dialog with Back. Phone wheel moved its body **0→723.5**; keyboard PageDown reached **382**, with outer body/document/masthead still **0**. Back returned to the real proxy.

All new fixture runs, including RED/failure exits, reported exact prior localhost storage restoration. Existing Home, detail, Bookclub, whole-site and archived cleanup messages were verified, including Bookclub's delayed finally restoration. The manual host removed the app and verified exact storage restoration before its owned Brave tab was closed. No viewport override, user IAB/prototype/production tab change, host change, auth/payment submission, CDP, Runtime/Network or dev-log diagnostic was used. The parent preview server remains running.

The single final layout scan (`detect.mjs --scope layout --json index.html assets/css/study-workspace.css`) exited **0**, stdout **`[]`**, with stderr explicitly reporting **DEGRADED** missing `htmlparser2`, `css-select`, `css-tree` and `domutils`, falling back to regex. Its empty findings are not layout certification; rendered tests provide the layout evidence. Physical-phone and live-service/release verification remain outside this local result. No merge, push or publication occurred in this implementation task.

Repeat the new suite at `http://localhost:4329/tests/interface/contained-scroll.browser.html`; `?short` isolates 780×500, and `?manual` supplies Desktop/Phone controls plus Restore storage for bounded native-input checks. Manual mode retains the same page-exit/timeout cleanup path.



## Reading density and visible Bookclub tools — October 17, 2026

Joe reported oversized type across the site and asked for every expanded Bookclub Year/filter/tool control to remain visible together. This correction starts from the actual live source `2b6431a7509b5b3f22ae8767663810b4034c0c7f` on `interface/reading-density`. The tested stylesheet blob is `0fd7c7d6b98411cf1fc96c7fa9ade763bc6635a4`.

The established Newsreader/Inter families and font delivery stay intact. Shared brand type is now 30px desktop/28px phone; page headings 28px, featured work 30/28px, pane/section headings 20px, reading-list titles and empty guidance 16px, and metrics 28/26px. Long reading prose uses 16px with 1.55 leading and a 68ch maximum where appropriate. Desktop browse controls may be 36px high; phone text inputs remain 16px and the original action buttons remain 44px high. No browser/CSS zoom or transform scaling was introduced. Root measured computed CSS zoom1 and visualViewport.scale1 before this correction; those facts do not establish the browser UI's separate page-zoom setting.

Bookclub's original controls now use four filter columns plus a full-width action row on desktop, and two filter columns plus naturally wrapping actions on phones. Its control group takes its natural height, with no vertical scrolling inside it. Every original node, ID, label, option and handler is retained; only the original blank spacer label is hidden. Search stays above the expanded tools. Lists and long reading text retain their bounded scrolling; the outer document stays stationary. Other browse control groups retain their existing behavior.

### Reproduced regression and measured correction

Ten meaningful assertions were added to the existing actual-module contained-scroll fixture, covering actual overflow, simultaneous visibility, Search position, compact action rows and remaining reading space at 984×779 and390×844. Six failed before the production edit: group overflow, clipped controls and stacked action rows at both sizes. The original377 checks remain. After the correction, the complete fixture passes **387/387** and reports exact prior localhost storage restoration. No tests assert literal font sizes; role sizes are recorded as measurements.

| Actual-module viewport | Before group client / scroll height | After group client / scroll height | Filter panel before → after | Reading index after |
| --- | --- | --- | --- | --- |
| 984×779 | 268 /435px | 259 /259px | 200 →118px | 321px |
| 390×844 | 224 /751px | 369 /369px | 516 →203.5px | 120px |

These are local fixture measurements. The preceding live assessment separately measured434/268px control overflow. Desktop actions share one36px row. Phone View/Reset/Export share one44px row; Search is44px high and both native selects45.5px, all with16px text. All original Year/All years/Great Idea/Filter & Sort/View/Reset/Export controls are visible together without scrolling the toolbar.

### Fresh verification on the final source

| Harness | Result |
| --- | --- |
| Contained scrolling, including toolbar regression | 387/387 |
| Home | 35/35 |
| Shell / Glossary | 59/59 |
| Library / Authors | 87/87 |
| Bookclub | 62/62 |
| Whole site | 81/81 |
| Node preservation / Home logic | 15/15 |

The five unchanged affected browser harnesses total324. Bookclub save/export still matches `b0b98c9d81f70ae8a81aac4c15249998c87e62c89abad42e218f6cc06b5c1f39`; whole-site notes/timer/content still matches `c4371c49d861d389b5c050f3fdff8e213376a22f09eb223f7ae281fff5cc28ed`. Archived-original runs were not repeated because original source was unchanged. All applicable cleanup messages were read, including Bookclub's delayed finally restoration.

Nine direct byte guards against live2b6431a pass for index.html, study-shell.js, detail-presentation.js, conversation-desk.js, conversation-desk.css, writing-desks.js, main.js and the preservation manifest/test. No JS, original markup, data, loading, account/storage or save/export implementation changed. Desk internals remain untouched; its shared brand reflects Joe's expressly approved smaller global branding. Fresh Bookclub checks retain Desk edit/autosave/draft identity/preview/metadata/resizing. Changed fixture module and host script syntax pass, as does scoped `git diff --check`.

One bounded desktop984×779 and phone390×844 visual batch confirmed the complete expanded toolbar and compact hierarchy. Actual phone table navigation still opens the original column picker with11 options; keyboard focus reaches its final `date-end` checkbox within the viewport while document scroll remains0. The original table's internal scrolling remains available. No additional screenshot or polish loop was performed. Screenshots were returned as native image output; the documented API offers bytes, not a save-path option, so no screenshot files or unsupported filesystem/browser APIs were used.

The final type scan exits2 with only three existing `overused-font` warnings for pinned Inter declarations/font loading. Those warnings are retained and explained by Joe's chosen identity. Stderr explicitly reports missing optional htmlparser2/css-select/css-tree/domutils and regex fallback; the scan is degraded evidence and does not certify contrast or computed layout.

Disposable work stayed on the parent-owned no-store localhost4329 server with exact storage restoration before closing the owned QA tab. No viewport override or user tab change occurred. Physical-phone, live-service and release verification remain outside this local result. Root owns RELEASE.md and QUIET-PANES-DESIGN.md; neither is included in this implementation commit. No push, merge or publication occurred.


### Constrained-height follow-up

Review reproduced a collapsed reading list at390×500 with tools open: work221px, controls368.5px and reading layout0px. With About and tools open at984×779, the reading layout was66.617px. The focused actual-module assertions failed four checks before the correction. Bookclub's reading layout now has a non-shrinking112px basis/minimum; the existing bounded work region scrolls to reveal it. The toolbar keeps its natural height and no internal vertical scrollbar. No production JS, markup, data or Desk internals changed.

The changed contained-scroll fixture passes **405/405**. Its18 added checks cover the two expanded states: usable visible reading space, last-item scrolling and pointer hits, selected full-body access/internal scrolling, Back focus, original controls, fixed document/masthead and recovery after disclosures close. At390×500 the expanded reading layout and visible index are112px; at984×779 with both disclosures they are112px and111.914px. Document scroll stays0. Exact prior localhost storage was restored and the disposable QA tab closed.

Normal dimensions remain unchanged:984×779 has259px controls,118px filter panel and321px reading layout;390×844 has369px controls,203.5px panel and119.5px reading layout (index rounds to120px). The phone work region remains352px wide with scrollHeight/clientHeight **488/488** and scrollTop0. A literal120px floor had introduced0.5px overflow and a scrollbar gutter;112px avoids it. All original expanded controls remain visible together.

Tested CSS blob: `1f6c6d09271214cf57fd74d3580528d6385dccf0`. Fixture syntax, scoped whitespace and exact unchanged protected production paths against `ce046dc` pass. The preceding324 browser and15 Node results remain the earlier evidence; they were not repeated for this CSS-only correction. No additional screenshot, scan, polish or publication occurred.


## Joe's comments

_Add anything you want kept especially close to the current app, or a baseline behavior that looks wrong._
