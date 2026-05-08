# Issues Tracker

Tracks known bugs, limitations, and planned improvements for **classics.ourstuff.space**.  
Update this file whenever a bug is found or fixed, or when a significant feature is added or changed.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🟡 | Open |
| 🔵 | In Progress |
| 🟢 | Fixed / Added |
| ⚪ | Won't Fix |

---

## Issues

| # | Status | Area | Description | Notes |
|---|--------|------|-------------|-------|
| 1 | 🟡 | Security | Firebase API key is embedded in `index.html` (public repo) | Acceptable only if Firebase Security Rules are correctly scoped. Review rules before expanding Firestore access. Never add service-account or admin credentials. |
| 2 | 🟡 | Testing | No automated tests exist — all testing is manual | Recommend adding Playwright smoke tests + Vitest unit tests for `config.js` / `utils.js`. Add a GitHub Actions CI step to run them on push. |
| 3 | 🟡 | Maintainability | `src/js/wire-ui.js` is large (~16 KB) | Consider splitting into smaller wiring modules by concern (e.g. `wire-plan-actions.js`, `wire-library-actions.js`). |
| 4 | 🟢 | Feature | Added `pre_reading_breakdown` (Pre-reading Breakdown) as Reading Sequence step 3 | Inserted between `author_documentary_biography` (step 2) and `audiobook_listen_1` (now step 4) in `CARD_TASK_GROUPS`, `TASK_VISIBLE_GROUPS`, and `TASK_SEARCH_TERMS` in `src/js/config.js`. |
| 5 | 🟢 | Bug | Deleted notes reappear on other devices after re-opening the app | Root cause: tombstone IDs (`deletedNoteIds`) were never pushed to Firestore, so other devices re-uploaded deleted notes on their next sync. Fix: `syncNotesToFirestore` now includes `deletedNoteIds` in the Firestore document; `loadNotesFromFirestore` returns remote tombstones; `performFullSync` merges local + remote tombstone sets, applies them to local notes, and no longer clears tombstones after sync so all devices learn about every deletion. |
| 6 | 🟢 | Feature | Added EULA / Terms of Use &amp; Privacy Notice modal shown before account creation | New `#eulaModal` appears after signup form validation. Users must scroll the terms and tick a checkbox before the "Accept &amp; Create Account" button activates. Content covers data storage (Firebase Auth + optional Firestore), cloud sync experimental notice, sensitive-data warning, third-party services, and deletion rights. Wired in `auth.js`, `wire-ui.js`; styled in `modals.css`. |
| 7 | 🟢 | Feature | Added note type tags (Note, Quote, Excerpt, Reflection, Essay, Great Idea) to notes | New `note_type` field on note objects (default: "note"). Filter select in toolbar, type select in editor, type pill in note list items. Handled in `config.js` (NOTE_TYPE_OPTIONS), `state.js`, `notes.js`, `wire-ui.js`, `notes.css`, and `index.html`. |
| 8 | 🟢 | Bug | Glossary term→Great Idea mapping failed for Syntopicon chapter entries | `extractIdeaCandidates()` filtered out all "CH N: IdeaName" entries; fixed to extract the idea name from the chapter reference (e.g. "CH 42: Justice" now yields "Justice"). |
| 9 | 🟢 | Feature | Removed Syntopicon branding from Glossary UI; page now reads "Glossary" throughout | Updated aria-labels, headings, loading text, and modal panel labels in `glossary.js`. The word "Syntopicon" no longer appears in visible UI text. |
| 10 | 🟢 | Feature | Added `glossary_app.json` with all 103 Great Ideas as first-class glossary entries | Each of the 103 Adler/Hutchins Great Ideas now has its own entry (qualifier: "Great Idea") with a description, primary references, and cross-links. Glossary loads from both `syntopicon_terms.json` and `glossary_app.json`. |
| 11 | 🟢 | Feature | Added "GET STARTED" nav page — newspaper-style onboarding for the Great Conversation | New `src/js/views/get-started.js` + `src/css/get-started.css`. Covers: what the Great Conversation is, the 10-year reading plan, Mortimer Adler biography, the Syntopicon, how to use the site, the 103 Great Ideas (as clickable pills linking to Glossary), four reading paths, four levels of reading, companion tools, FAQ, and CTA buttons. |
| 12 | 🟢 | Feature | Note type tags changed to multi-select; type filter moved to its own row | `note_type` field on notes is now an array (backward-compat: old string values auto-wrapped). Editor and filter both use a pill-checkbox group (`.noteTypeGroup`) instead of single `<select>`. Filter uses AND logic: selecting multiple types shows only notes that have ALL selected types. `state.notesUI.noteTypeFilter` is now `[]` (all) instead of `"all"`. Affected files: `state.js`, `notes.js`, `wire-ui.js`, `index.html`, `notes.css`, `dark-mode.css`. |
| 13 | 🟢 | Feature | Added "Filter by Bookclub" toggle button to notes nav | New button in the notes toolbar filters notes to only bookclub works and sorts them in chronological reading-plan order (by year then order). Uses `.tabOn` inverted-color style when active. Wired in `state.js`, `notes.js`, `wire-ui.js`, and `index.html`. |
| 14 | 🟢 | Feature | Refined the Get Started 10-year plan overview to explain each year's concept individually | Updated `src/js/views/get-started.js` so the 10-year plan copy now emphasizes lifelong mental growth, chronological context within each year, and ten distinct yearly themes aligned with the reading plan. |
