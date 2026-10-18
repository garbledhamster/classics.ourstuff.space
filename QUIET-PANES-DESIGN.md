# Quiet reading panes production design

October 17, 2026 · A selected and implementation authorized by Joe

## Outcome

Make Classics easier to follow while studying: one compact, stable browse list and one complete selected-content body. Joe selected **A — Reading list** from [the quiet-pane prototype](http://10.200.0.59:4325/?variant=A) and asked agents to build it. The [prototype record](../Site%20layout%20prototype/PROTOTYPE.md) is visual evidence; its code is disposable.

## Approved experience

Library, Bookclub and Great Authors share the selected A pattern. Book rows show only title and a small author line; author rows show the name. Bookclub retains plan order and year grouping. A groups Library by author and Great Authors by initial letter, keeping their existing ordering, filters and pagination. Metadata, Great Ideas, exact selections, occurrence/work links, completion controls and all expanded content belong in the right body. The desktop list and body each scroll within the available viewport. At phone width, selecting opens the complete body with a clear Back to list action.

Use A's black-and-white Newsreader/Inter identity, compact list typography, fine separators and restrained selected treatment. Preserve the current shell and Home except the approved changes. All existing filters/tools remain reachable through compact disclosures where A uses them, and the alphabet controls stay available.

Glossary keeps its original index, five panels and panel navigation. Apply A's index/body presentation at desktop and full selected body on phones while leaving its controller and requests untouched. Get Started and every other existing page remain available.

Move the original Notes Drawer button to a square masthead control immediately after Night Mode. Keep the visible Home label and add the matching Home icon. Empty Home notes/writings sections retain their current explanatory text and gain Start now actions opening the original Notes editor or Conversation Desk workflow. No duplicate draft creation.


**October 17 release refinement:** Joe wants this site to feel like a desk: its masthead/navigation and outer page stay in one place. Lists and long text may scroll inside bounded work areas. Avoid outer-document vertical or horizontal scrolling and prevent unnecessary nested scroll regions. Preserve all original content and controls, with no pagination, truncation or smaller type used to force content onto one screen. Scope the fixed shell away from Conversation Desk so its existing layout and behavior remain unchanged. Verify desktop, phone and constrained-height layouts, empty searches, open tools, keyboard/overlay access and the original table mode before release.

## Global Constraints

- Keep all the existing pages, content, and what gets loaded exactly the same.
- Leave Conversation Desk as it is: its controller, markup, styles, saves, autosave, preview, resizing and records remain unchanged.
- Preserve all six original datasets, order, exact text/selections, original source URLs, parameters, fallbacks, parsing, Firebase/reCAPTCHA boot, authentication, storage and sync behavior.
- Keep original owner/control nodes and their IDs, datasets and delegation ancestry. Bookclub owners stay inside their original readingBlock; never clone interactive content.
- Use the reviewed production rebuild at 084a1bb on interface/study-desk-a; keep the prototype separate. Do not copy prototype storage/runtime substitutions, removed cloud boot, variant switcher or B/C code.
- Keep the existing preservation manifest and preservation.test.mjs unchanged. New behavior checks supplement the original-action parity checks.
- Preserve all original table modes, fields, options, tools and existing local-mode fallbacks.
- Build and verify locally on the Mac; disposable writes use localhost fixtures with backup/restore. VPN checks are read-only. A viewport check does not establish physical-phone use.
- The initial implementation stopped before release. On October 17, 2026 Joe approved A and explicitly authorized making it live on classics.ourstuff.space, with the bounded scrolling refinement below. Preserve existing hosting/authentication configuration.

## Production seam

Extend detail-presentation.js rather than promoting the prototype presenter. Generate plain title/author proxy buttons that invoke the original header toggle. Position the complete original selected owner beside its index without reparenting it. Retain production keyboard/overlay priority, source cleanup, resize/visibility handling and destroy restoration. Rebuild index relationships on actual owner identity changes, including identical-data rerenders. Back restores focus to a visible proxy.

Keep shell and Glossary enhancement in a separate presentation module; it may observe the existing lazy Glossary mount but cannot fetch or save content. Home adds narrow callbacks through existing routes and original creation APIs. CSS stays scoped to browsing and shell/Home; it must not restyle Conversation Desk.

## Verification and completion

Use actual-module browser fixtures to prove title/author identity, full selected context, independent scrolling, filter/pagination/replacement behavior, original action ancestry, source cycling/cleanup, phone focus and nested-overlay priority. Add checks for shell placement, Home actions, Glossary panel reachability and body bounds. Retain original old/new saved/export comparisons and source hash/request guards. Inspect A on desktop and phone size in one batched round, fix the findings together, and confirm once. Functional regressions require their focused checks; this is not an open-ended visual polish loop.

Complete means the selected A production interface is committed, its preservation/interaction checks pass, independent review is clear, the local preview is available, and both trackers and the overview record the result. Physical-phone and live-service/release checks remain explicit when unavailable.

## Joe's comments

“I like A, let's go with that and have the agents build it. Keep all the existing pages, content, and what gets loaded exactly the same, and leave Conversation Desk as it is.”

_Add any change to the selected layout here._


October 17 release decision: “Looks good, let's get A live on classics.ourstuff.space. Keep all the existing pages, content, and loading exactly the same, and leave Conversation Desk as it is.”

Scrolling clarification: “yeah like text can scroll but not the whole page, i hate when pages do tha”
