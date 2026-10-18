# C reading workspace production design

October 18, 2026 · Joe approved refined C and authorized agent implementation and publication

## Outcome

Build the selected [C prototype](../Workspace%20controls%20prototype/PROTOTYPE.md), commit `6f7a75f`, in the existing production app. Browse & filters expands inside the left list column, with its own scrolling and organized original settings. Keep the reading body in place while opening/closing controls; closing restores the list's full area. Apply consistently to Bookclub, Library and Great Authors. Joe's approval includes publishing the result to classics.ourstuff.space.

## Experience

Retain the 240px desktop left column and existing black-and-white Newsreader/Inter identity. Browse & filters is a full-column button with a clear open state. The inline settings region contains the original search, Year/All years, Great Idea, Filter & Sort, View/Reset/Export/Columns, help/references and alphabet controls as applicable. Group plan controls under Reading plan, Filters and Tools without changing their options or behavior. Keep the settings within the column; no floating block covers the reader. Settings and list scroll separately; retain about 112px of visible list when enough height is available. At very short heights, use a sensible smaller split or the existing bounded work-region fallback, never an unreachable control or zero-height reading area. No outer-page scrolling or horizontal overflow at supported normal desktop/phone sizes.

The full right reading body keeps its exact rectangle when settings open/close. Settings remain open while reading/scolling or selecting another list item, until the toggle/Escape closes them. Escape from settings closes them and restores focus to the toggle, without hijacking editable arrow keys or higher-priority overlays. Never leave focus inside hidden controls. Use the existing full-body phone selection and Back behavior; phone inputs stay 16px and touch actions at least44px. Respect reduced motion. Original full/table mode, table columns and all reset/filter/pagination/source switching/empty recovery behavior remain available.

## Preservation constraints

- Keep every existing page, original content, exact selections, datasets and information. Preserve original loader URLs, request construction, defaults, fallback order and parsing.
- Leave Conversation Desk markup/controller/styles/layout/storage/autosave/preview/records unchanged. Do not apply C to its internals.
- Preserve Firebase/reCAPTCHA, account/auth, storage/sync, Notes, Glossary and Home behavior and requests.
- Original interactive nodes, IDs, options and action ownership remain authoritative. Do not clone interactive fields; generated index proxies still call original headers. Keep original work owners inside their readingBlock and preserve index/root sibling adjacency required by generated geometry selectors.
- Reimplement the selected treatment; never promote prototype memory storage, boot/auth substitutions, switcher or alternate layouts.
- Continue from current public main `ce8f0f4a331c0f5fa7ee33b98b088b65d696d013`. Existing local post-release notes stay preserved. Existing preservation manifest/tests remain unchanged. Only revise old layout assertions that intentionally conflict with the approved C behavior, with equivalent preservation coverage retained.
- Refresh the interface CSS content version with `node scripts/version-interface-css.mjs --write`, extending the helper/guard to content-version the directly loaded changed presentation-shell entry so cached browsers actually receive C. Content-version the new browse-controls import in the shell as well: hash the child module, update its actual import URL, then hash the resulting shell and update index.html. This bounded chain prevents a later child-only fix from reusing an old cached module; do not rewrite the original data/runtime import graph. Avoid changing cached imported runtime modules unless necessary and explicitly version their actual consumers if changed; do not change data URLs. Publish through the existing guarded GitHub API→Pages path, no hosting/auth/security changes or reader-data migrations.

## Implementation seam

Use the existing study-shell presentation lifecycle, plus a narrowly scoped production module if needed. Existing controls may be grouped within their original view, inside the left layout column. Explicitly prevent study-shell from wrapping them again after they move; retain original index/root adjacency. CSS uses two layout rows in the left column, with the detail slot spanning both. Size the settings against actual available layout height; account for wrapping labels/actions, footer/table mode and phone selection. Presenter geometry must stay correct throughout animation, disclosure toggles, rerenders and viewport changes. Destroy/cleanup must release listeners/observers and avoid duplicate mounts.

## Verification

Write meaningful browser regressions first, demonstrate RED on the old app, then GREEN with C. Assert pane rectangle invariance, separate settings/list scrolling and nonzero list space, original filter/reset/letter/column options and actions, empty recovery, phone Back/focus, overlays/Escape/editable caret keys, table-mode routing and constrained-height reachability. Retain existing saved-output/request/source guards. Perform one batched desktop/phone visual round, fix findings together, confirm once. A physical-phone or live-auth claim requires actual evidence. Independent task and final branch reviews precede publication; then wait for Pages success, compare public resources with the committed tree and confirm live C in the browser using a fresh release HTML URL once if needed for entry-page caching.

## Joe's comments

“yeah that's what i meant, let's have the agents build this version of C and get it live, keeping all the existing pages, content and loading exactly the same and leaving Conversation Desk alone”

_Add implementation or release feedback here._
