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
| 8 | 🟢 | Feature | Added "GET STARTED" nav page and wired Glossary into index.html | New self-contained `src/js/views/get-started.js` (IIFE, follows glossary.js pattern) injects a nav tab and a newspaper-style onboarding page covering the Great Conversation, Adler's reading method, Year 1 reading list, 102 Great Ideas, app navigation guide, and FAQ. Also added `src/css/get-started.css`. Wired `views/glossary.js`, `glossary.css`, and `glossary-overrides.css` into `index.html` (they existed but were not loaded). |
