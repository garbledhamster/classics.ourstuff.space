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
| 6 | 🟢 | Bug | Glossary Great Idea mapping missed direct chapter ideas like `Justice` | Fix: glossary mapping now recognizes direct Great Idea terms, parses chapter references like `CH 42: Justice`, and merges app glossary metadata so idea-to-book matching resolves correctly. |
| 7 | 🟢 | Feature | Added `glossary_app.json` for app-specific glossary entries | The new glossary data file follows the main glossary structure and currently seeds all 103 Great Ideas so every reading-plan idea is available as a glossary term even when it is absent from the imported Syntopicon inventory. |
