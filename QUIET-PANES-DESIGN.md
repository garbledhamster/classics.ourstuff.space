# Quiet reading panes production design

October 17, 2026 · A selected and implementation authorized by Joe

## Outcome

Make Classics easier to follow while studying: one compact, stable browse list and one complete selected-content body. Joe selected **A — Reading list** from [the quiet-pane prototype](http://10.200.0.59:4325/?variant=A) and asked agents to build it. The [prototype record](../Site%20layout%20prototype/PROTOTYPE.md) is visual evidence; its code is disposable.

## Approved experience

Library, Bookclub and Great Authors share the selected A pattern. Book rows show only title and a small author line; author rows show the name. Bookclub retains plan order and year grouping. A groups Library by author and Great Authors by initial letter, keeping their existing ordering, filters and pagination. Metadata, Great Ideas, exact selections, occurrence/work links, completion controls and all expanded content belong in the right body. The desktop list and body each scroll within the available viewport. At phone width, selecting opens the complete body with a clear Back to list action.

Use A's black-and-white Newsreader/Inter identity, compact list typography, fine separators and restrained selected treatment. Preserve the current shell and Home except the approved changes. All existing filters/tools remain reachable through compact disclosures where A uses them, and the alphabet controls stay available.

Glossary keeps its original index, five panels and panel navigation. Apply A's index/body presentation at desktop and full selected body on phones while leaving its controller and requests untouched. Get Started and every other existing page remain available.

Move the original Notes Drawer button to a square masthead control immediately after Night Mode. Keep the visible Home label and add the matching Home icon. Empty Home notes/writings sections retain their current explanatory text and gain Start now actions opening the original Notes editor or Conversation Desk workflow. No duplicate draft creation.


**October 17 release refinement:** Joe wants this site to feel like a desk: its masthead/navigation and outer page stay in one place. Lists and long text may scroll inside bounded work areas. Avoid outer-document vertical or horizontal scrolling and prevent unnecessary nested scroll regions. Preserve all original content and controls, with no pagination, truncation, artificial page scaling or unreadably small type used to force content onto one screen. Joe's later sizing feedback calls for a deliberate smaller display/list scale while retaining comfortable reading text. Scope the fixed shell away from Conversation Desk so its existing layout and behavior remain unchanged. Verify desktop, phone and constrained-height layouts, empty searches, open tools, keyboard/overlay access and the original table mode before release.



**October 17 typography and toolbar correction:** Joe reported that live A feels oversized and requires zooming out. Keep Newsreader/Inter and native browser scaling. Use a deliberate compact scale: brand 30px desktop/28px phone; page headings 28px; featured work 30/28px; pane and section headings 20px; list titles and empty guidance 16px; long prose 16px with comfortable leading and roughly 65–70ch measure; metadata 12px; metric figures 28/26px. Preserve original text and all font resource requests. Keep phone text inputs at 16px and touch controls at least 44px. Conversation Desk internals remain unchanged.

Expanded Bookclub tools must be fully visible in their normal viewport, without a vertical scrolling toolbar. Use four filter columns on desktop, with original View/Reset/Export/Columns actions across a full-width row; use two filter columns on phones and wrap the action row as needed. Let the toolbar take its natural height and give the remaining space to the list/body. In a constrained-height work region, retain a small non-shrinking reading area and let the existing workspace scroll to it; never collapse the list or selected body to zero. The outer document stays still and the toolbar has no vertical scrollbar. Normal desktop/phone layouts must not gain unnecessary work-region overflow. Preserve every original node, field, option, handler and owner relationship. Verify the reported 984 × 779 view, a standard desktop, 390 × 844 phone, long titles, table mode and fixed outer page.


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



Live sizing feedback: “idk why it's so zoomed in but also on the bookclub the year filters & tools area shouldnt verticle it should all be in view, btu aslo why is the font so huge can you make the font more reasonable please it looks terribly huge in any view, i have to zoomout super far for it to look okay”
