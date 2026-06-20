# The Classics — Design Document

> This document answers the six core design questions (Who/What, When, Where, Why, How, How Much) for the current rebuild/modularization effort, and serves as the canonical reference for all future development.

---

## 1. Who / What

### Who

| Role | Description |
|------|-------------|
| **Primary user** | An individual undertaking a serious, multi-year program of reading the Great Books of the Western World (Adler/Hutchins curriculum, ~398 works over ~10 years). |
| **Secondary users** | Study groups, book clubs, or homeschool families following the same reading plan. |
| **Maintainers** | One to a few developers (`garbledhamster` + contributors), augmented by LLM-assisted coding sessions. |
| **LLM agents** | GitHub Copilot / Claude / GPT sessions that read, review, and extend the codebase. LLM navigability is a first-class requirement. |

### What — Feature Inventory

| Feature | Description |
|---------|-------------|
| **Library View** | Browse all ~398 works in the canon. Filter by letter, search, sort, and paginate. |
| **Ten-Year Plan View** | Structured reading plan (from `bookclub.json`) organized by year. Progress tracking, year-step navigation, tier/idea filters. Full-card and table view modes. |
| **Authors View** | Browse canon authors alphabetically with letter filter + pagination. |
| **Book Details** | On-demand lookup of cover, subjects, and description from Open Library → Gutendex (Project Gutenberg) → Wikipedia REST, with fallback chain and provenance row. |
| **Reading Tracker** | Per-book card status (Not Started, In Progress, On Hold, Complete, Skipped) and step tracker aligned with Adler's reading method (Period Documentary → Author Bio → Inspectional Read → Summary → Lecture → Analytical Read). |
| **Card Dates** | Start date and finished date per book, persisted to localStorage / Firestore. |
| **Pomodoro Timer** | Built-in study timer with presets (25 / 45 / 60 min), custom input, and Web Audio alarm sounds (bell, chime, beep, ding). |
| **Notes** | Personal margin notes with full-text search, tag filter, archive, multi-select delete/archive, import/export (JSON). |
| **Great Conversation** | Firestore-backed per-book comment threads. Comment types: Argument, Counter-Argument, Cultural Connection, Reflection. |
| **Cloud Sync** | Firebase Auth (email/password + reCAPTCHA v3) + Firestore for cross-device sync of checks, statuses, tasks, dates, notes, and timer settings. |
| **Search Integration** | "Find Resources" modal for searching YouTube, Google, audiobooks, free books, outlines, Goodreads, biographies, Wikipedia — all pre-populated with book context and active task hint. Bloom's Taxonomy learning goal buttons. |
| **Cross-References** | Clicking an author in the Plan view navigates to the Library view filtered to that author, and vice versa. |
| **Dark Mode** | Toggle between light (newspaper) and dark themes; preference persisted to localStorage. |
| **PWA** | Web App Manifest + meta tags for iOS/Android home-screen install; offline icon display. |
| **Export** | Export reading progress (CSV or JSON) and notes (JSON). |

### Data Files

| File | Description |
|------|-------------|
| `library.json` | Master catalog of ~398 books: `{ title, author, vol, date, item, sourceUrl, greatIdeas[] }` |
| `bookclub.json` | 10-year reading plan: `{ plan_name, years: [{ year, readings: [{ order, tier, author, title, ... }] }] }` |

---

## 2. When

### Current State (as of 2026-Q2)

- Single `index.html` file — **~8,000 lines** — containing all CSS (~2,050 lines), HTML markup (~660 lines), and JavaScript (~5,190 lines).
- No build system; deployed as a static GitHub Pages site.
- Fully functional; actively used.

### Modularization Phases

| Phase | Goal | Status |
|-------|------|--------|
| **Phase 1 (now)** | Split the monolith into separate CSS and ES module JS files. No build step required — uses `<link>` + native `import/export`. | 🚧 In progress |
| **Phase 2 (next)** | Add a lightweight Vite build: TypeScript, CSS preprocessing, tree-shaking, HMR. | Planned |
| **Phase 3 (future)** | Evaluate SPA framework (Preact / Solid) if imperative DOM mutation becomes unwieldy. | Exploratory |

---

## 3. Where

### Deployment

| Item | Value |
|------|-------|
| Live URL | `https://classics.ourstuff.space` |
| Hosting | GitHub Pages (CNAME + static files) |
| Repository | `garbledhamster/classics.ourstuff.space` |
| Firebase project | `ourstuff-firebase` (Firestore + Auth) |
| External APIs | Open Library, Gutendex, Wikipedia REST, Google Fonts, reCAPTCHA v3 |

### Architecture

```
Browser
  ├── index.html (shell: meta, link tags, script tags)
  ├── src/css/*.css  (stylesheets, loaded via <link>)
  ├── src/js/main.js (ES module entry point, <script type="module">)
  │     └── imports all other src/js modules
  ├── library.json   (fetch at boot)
  ├── bookclub.json  (fetch at boot)
  └── Firebase SDK v9 CDN (auth + firestore)
```

---

## 4. Why

### Why Rebuild / Modularize?

1. **Maintainability** — A single 8,000-line file is impossible to reason about in isolation. A bug in one section can silently affect another. Code reviews are unwieldy.

2. **LLM Navigability** — LLM coding assistants (GitHub Copilot, Claude, GPT) work best with small, single-purpose files whose names and exports describe their responsibility. Uploading the entire monolith into every session wastes context window and degrades output quality. With modular files, a session can load only the relevant modules.

3. **Onboarding** — New contributors can orient themselves by reading `project-context/DESIGN.md` and browsing the directory tree, then open only the file they need.

4. **Testing** — Isolated ES modules with pure functions and explicit dependencies can be unit-tested. The monolith cannot.

5. **Separation of Concerns** — CSS, HTML, and JavaScript are currently interleaved. Separating them makes each layer independently auditable.

6. **Feature Velocity** — Adding a new view or component requires scanning thousands of lines to find related code. Modular files make the right location obvious.

---

## 5. How

### Guiding Principles

- **No build step in Phase 1.** Use native ES modules (`import`/`export`) and `<link rel="stylesheet">` — both work in all modern browsers without transpilation.
- **No new framework.** Stay vanilla JS + DOM.
- **LLM-first naming.** Every file name is self-documenting. Each file has one clear responsibility. Avoid generic names like `helpers.js`.
- **Incremental migration.** The app remains fully functional at every intermediate step; no flag-day rewrite.
- **Explicit exports.** Every public function/constant is explicitly `export`ed. No globals except the `window.firebase*` bridge from the Firebase module script.

### Target Directory Structure

```
classics.ourstuff.space/
│
├── index.html              ← Shell: <head> meta, <link> tags, Firebase module, <script type="module" src="src/js/main.js">
├── project-context/
│   └── DESIGN.md           ← This document
├── README.md
├── CNAME
├── manifest.json
├── library.json            ← 398-book catalog (fetched at boot)
├── bookclub.json           ← 10-year reading plan (fetched at boot)
├── [icons: icon.png, icon-192.png, icon-512.png, apple-touch-icon.png]
│
└── src/
    ├── css/
    │   ├── reset.css           ← Box-sizing reset, .sr-only
    │   ├── theme.css           ← CSS custom properties (--paper, --ink, etc.), body font, .wrap
    │   ├── masthead.css        ← header.masthead, .brand, .dateline, .rule, .subhead, .badge, #authBtn
    │   ├── buttons.css         ← .btn, .btnGhost, .btnDanger, .btnBloom, .abcBtn/.abcBar, .paginationBar
    │   ├── forms.css           ← .control, .label, .input, .select, .yearStepper, .toggle
    │   ├── layout.css          ← .error, .navRow, .tabOn, .view, .grid, .controls, .rowWide, plan layout rows
    │   ├── pills.css           ← .pill, .pillArchived, .tagRow, .mono, .pillIdea, .pillTag
    │   ├── cards.css           ← .libCard, .libHead, .libTitle, .libAuthor, .libDrawer, .libActions,
    │   │                          .workRow, .workDrawer, .workActions, .cardMetaControls, .workDrawerBody
    │   ├── book-details.css    ← .bookDetailsSection, .bookDetailsPanel, .bookDetailsContent, .bookDetailsCover,
    │   │                          .bookDetailsInfo, .bookDetailsRow, .blackBoxSection, .bbPanel, .bbItem,
    │   │                          .drawerPanelRow, BB animations
    │   ├── task-drop.css       ← .statusSelect, .taskTracker, .taskDrop, .taskDropPanel, .taskDropOpt,
    │   │                          .taskOptLabel, .taskOptDesc, .cardDateFields, .cardDateField, .ytGoal*
    │   ├── plan.css            ← .yearCard, .yearHeader, .yearTitle, .bar, .readingBlock, .workMain,
    │   │                          .planMasthead, plan table, condensed view, column picker
    │   ├── modals.css          ← .overlay, .modal, .modalHeader, .modalBody, .modalFooter, .modalBackdrop,
    │   │                          .drawer, .drawerHeader, .drawerBody, .timerDisplay, .timerPresets
    │   ├── notes.css           ← .noteTools, .noteList, .noteItem, .editor, .textarea, .help, .tiny, .codebox
    │   ├── comments.css        ← .commentsDrawer, .commentRules, .commentTypePill, .commentItem, etc.
    │   ├── dark-mode.css       ← All html.dark overrides
    │   └── utils.css           ← .btnIconOnly, .siteFooter, .syncStatus, .searchBanner, .bloomsBtnRow,
    │                              .flash, misc utility classes
    │
    └── js/
        ├── config.js           ← Storage keys, default values, CARD_STATUS_OPTIONS, CARD_TASK_GROUPS,
        │                          CARD_TASK_OPTIONS, TASK_VISIBLE_GROUPS, TASK_SEARCH_TERMS,
        │                          LEARNING_GOAL_OPTIONS, TABLE_COLUMNS, COMMENT_TYPE_LABELS,
        │                          LOGIN/LOGOUT icon constants, AUTO_SYNC_DEBOUNCE_MS
        │
        ├── utils.js            ← $(), escapeHtml(), normalizeText(), uid(), nowIso(), safeJsonParse(),
        │                          _isValidUrl(), hash32(), flashEl(), workKey(), normalizeForMatch(),
        │                          setError(), clearError(), all build*SearchUrl() functions
        │
        ├── storage.js          ← loadChecks/saveChecks, loadNotes/saveNotes, loadDeletedNoteIds/save,
        │                          loadCardStatuses/save, loadCardTasks/save, loadCardDates/save,
        │                          loadTableHiddenCols/save, setAfterSaveCallback()
        │
        ├── state.js            ← Singleton `state` object (initialized with loaded storage values)
        │
        ├── firebase/
        │   ├── auth.js         ← initAuth(), updateAuthUI(), initAuthButtonHandlers(),
        │   │                      showLoginModal/hide, showSignupModal/hide, handleLogin/Signup/Logout,
        │   │                      executeRecaptcha(), setSVGIcon()
        │   └── sync.js         ← syncChecksToFirestore, syncCardStatuses/Dates/Tasks/Notes/Timer,
        │                          loadChecksFromFirestore, loadCardStatuses/Dates/Tasks/Notes,
        │                          triggerAutoSync, initAutoSync()
        │
        ├── data/
        │   ├── loader.js       ← loadPlan(), flattenPlan(), buildLibraryWorks(), buildGreatIdeasUniverse(),
        │   │                      fillYearOptions(), updateYearStepper(), buildTagsUniverse(),
        │   │                      normalizeCardDateValue()
        │   └── book-details.js ← loadBookDetails(), startBgBookDetailsLoad(), _bookDetailsCache,
        │                          _fetchGutendexDetails(), _fetchWikipediaDetails(),
        │                          renderBlackBoxSection(), renderBookDetailsSection(),
        │                          handleBookDetailsToggle()
        │
        ├── components/
        │   ├── card-state.js   ← getCardStatusKey(), getCardStatus(), isValidCardTask(), getCardTask(),
        │   │                      getCardPillData(), getCardDates(), renderStatusSelector(),
        │   │                      renderTaskTracker(), renderCardMetaControls(), renderCardDateFields(),
        │   │                      applyCardStatusChange(), applyCardTaskChange(), applyCardDateChange(),
        │   │                      handleCardStatus/Task/DateChangeEvent(), closeAllTaskDropdowns(),
        │   │                      repositionTaskDropPanel(), handleTaskDropdownClickEvent(),
        │   │                      handleFinishedDateFocusEvent(), handleFinishedDateBlurEvent()
        │   ├── search-modal.js ← showSearchSettingsModal(), hideSearchSettingsModal(),
        │   │                      updateSearchPreview(), buildSearchUrlFromSettings(),
        │   │                      renderLearningButtons(), buildLearningSearchUrl()
        │   ├── notes.js        ← filteredNotes(), renderNotesList(), noteItemHtml(), showEditor(),
        │   │                      hideEditor(), startNewNote(), startEditNote(), saveEditorNote(),
        │   │                      deleteEditorNote(), archiveEditorNote(), exportNotes(),
        │   │                      importNotesFile(), toggleNoteSelectMode(), deleteSelectedNotes(),
        │   │                      archiveSelectedNotes()
        │   ├── comments.js     ← bookCommentKey(), loadBookComments(), submitBookComment(),
        │   │                      deleteBookComment(), renderBookCommentsList(), openCommentsDrawer()
        │   └── timer.js        ← Timer IIFE (openTimerModal, closeTimerModal, playAlarm, tick, etc.)
        │
        ├── views/
        │   ├── library.js      ← libCardHtml(), renderLibrary(), wireLibraryDelegation(),
        │   │                      closeLearningGoalDrawers(), _toggleLearningGoalDrawer(),
        │   │                      applyTaskVisibility(), applyAllTaskVisibilities()
        │   ├── plan.js         ← renderPlan(), wirePlanDelegation(), yearCardHtml(), yearCardTableHtml(),
        │   │                      readingBlockHtml(), workRowHtml(), workRowTableHtml(), tableHeaderHtml(),
        │   │                      allYearsTableHtml(), updatePlanViewButtons(), renderColPickerPanel(),
        │   │                      toggleColPickerPanel(), toggleStandaloneColPicker(), PLAN_VIEW_ICONS,
        │   │                      PLAN_VIEW_LABELS
        │   └── authors.js      ← buildAuthorsData(), filteredAuthors(), authorCardHtml(), renderAuthors(),
        │                          wireAuthorsDelegation()
        │
        ├── filters.js          ← filteredLibrary(), applyPlanFilters(), groupByYear(), filteredNotes(),
        │                          libLetterKey(), authLetterKey(), paginationHtml(), renderAbcBar()
        │
        ├── render.js           ← renderAll(), setView()
        │
        ├── modals.js           ← showAlert(), showConfirm(), _showPrompt() (showPrompt alias),
        │                          openDrawer(), closeDrawer(), getWorkContextFromRow()
        │
        ├── export.js           ← buildExportRows(), exportProgressCsv(), exportProgressJson(),
        │                          showExportModal(), downloadFile()
        │
        ├── cross-refs.js       ← gotoPlanWorkKey(), gotoLibraryWork()
        │
        ├── wire-ui.js          ← wireUI() — binds all static DOM events at boot
        │                          (nav tabs, dark mode, search/filter inputs, export, notes drawer, etc.)
        │
        └── main.js             ← boot() — entry point; imports firebase/auth, data/loader, wire-ui;
                                   orchestrates startup sequence with Firebase ready callback
```

### Module Dependency Graph

Reading order — each row only imports from rows above it:

```
config.js           (no app imports)
utils.js            (no app imports)
storage.js          ← config.js, utils.js
state.js            ← storage.js
firebase/sync.js    ← config.js, state.js, storage.js
firebase/auth.js    ← config.js, state.js, utils.js, modals.js, firebase/sync.js
data/loader.js      ← state.js, utils.js, render.js
data/book-details.js← config.js, state.js, utils.js
components/card-state.js  ← config.js, state.js, utils.js, storage.js, firebase/sync.js, modals.js
components/search-modal.js← config.js, state.js, utils.js
components/notes.js ← config.js, state.js, utils.js, storage.js, firebase/sync.js, modals.js
components/comments.js    ← state.js, utils.js, modals.js
components/timer.js ← config.js, state.js, firebase/sync.js
filters.js          ← config.js, state.js, utils.js
views/library.js    ← config.js, state.js, utils.js, filters.js, data/book-details.js,
                       components/card-state.js, components/search-modal.js, modals.js
views/plan.js       ← config.js, state.js, utils.js, filters.js, components/card-state.js,
                       components/search-modal.js, modals.js, components/notes.js
views/authors.js    ← state.js, utils.js, filters.js, modals.js
render.js           ← state.js, views/library.js, views/plan.js, views/authors.js, components/notes.js
modals.js           ← state.js, utils.js
export.js           ← state.js, utils.js, modals.js
cross-refs.js       ← state.js, render.js, filters.js
wire-ui.js          ← config.js, state.js, utils.js, render.js, modals.js, export.js,
                       cross-refs.js, components/*, views/*, filters.js, firebase/auth.js,
                       firebase/sync.js, components/timer.js
main.js             ← firebase/auth.js, data/loader.js, wire-ui.js
```

### CSS Loading Order

CSS files are loaded in the following `<link>` order in `index.html`:

1. `reset.css` — Must come first
2. `theme.css` — CSS variables must be available to all other sheets
3. `layout.css`
4. `masthead.css`
5. `buttons.css`
6. `forms.css`
7. `pills.css`
8. `cards.css`
9. `book-details.css`
10. `task-drop.css`
11. `plan.css`
12. `modals.css`
13. `notes.css`
14. `comments.css`
15. `utils.css`
16. `dark-mode.css` — Must come last (overrides everything above)

---

## 6. How Much

### Complexity Estimate — Phase 1 Modularization

| Area | Source Lines | Target File(s) | Risk |
|------|-------------|----------------|------|
| CSS Reset | ~20 | `reset.css` | Low |
| CSS Theme / Variables | ~30 | `theme.css` | Low |
| CSS Layout | ~120 | `layout.css` | Low |
| CSS Masthead | ~100 | `masthead.css` | Low |
| CSS Buttons | ~90 | `buttons.css` | Low |
| CSS Forms | ~70 | `forms.css` | Low |
| CSS Pills | ~40 | `pills.css` | Low |
| CSS Cards | ~200 | `cards.css` | Low |
| CSS Book Details + Black Box | ~200 | `book-details.css` | Low |
| CSS Task Drop / Status Select | ~320 | `task-drop.css` | Low |
| CSS Plan | ~400 | `plan.css` | Low |
| CSS Modals / Drawers / Timer | ~400 | `modals.css` | Low |
| CSS Notes | ~200 | `notes.css` | Low |
| CSS Comments | ~120 | `comments.css` | Low |
| CSS Dark Mode | ~65 | `dark-mode.css` | Low |
| CSS Utils | ~60 | `utils.css` | Low |
| **JS** config.js | ~70 | `config.js` | Low |
| **JS** utils.js | ~120 | `utils.js` | Low |
| **JS** storage.js | ~60 | `storage.js` | Low |
| **JS** state.js | ~60 | `state.js` | Low |
| **JS** firebase/auth.js | ~310 | `firebase/auth.js` | Medium |
| **JS** firebase/sync.js | ~230 | `firebase/sync.js` | Medium |
| **JS** data/loader.js | ~200 | `data/loader.js` | Medium |
| **JS** data/book-details.js | ~290 | `data/book-details.js` | Medium |
| **JS** components/card-state.js | ~430 | `components/card-state.js` | Medium |
| **JS** components/search-modal.js | ~300 | `components/search-modal.js` | Medium |
| **JS** components/notes.js | ~400 | `components/notes.js` | Medium |
| **JS** components/comments.js | ~200 | `components/comments.js` | Low |
| **JS** components/timer.js | ~250 | `components/timer.js` | Low |
| **JS** filters.js | ~200 | `filters.js` | Low |
| **JS** views/library.js | ~700 | `views/library.js` | High |
| **JS** views/plan.js | ~600 | `views/plan.js` | High |
| **JS** views/authors.js | ~350 | `views/authors.js` | Medium |
| **JS** render.js | ~20 | `render.js` | Low |
| **JS** modals.js | ~130 | `modals.js` | Low |
| **JS** export.js | ~120 | `export.js` | Low |
| **JS** cross-refs.js | ~80 | `cross-refs.js` | Low |
| **JS** wire-ui.js | ~400 | `wire-ui.js` | High |
| **JS** main.js | ~20 | `main.js` | Low |
| **HTML** index.html (shell) | ~660 → ~80 | `index.html` | Medium |
| **TOTAL** | **~8,000** | **~40 files** | — |

### Key Risks

| Risk | Mitigation |
|------|-----------|
| Circular ES module imports | Follow dependency graph strictly; use callback pattern for `triggerAutoSync` in `storage.js` |
| CSS specificity shift | Load CSS files in exact order documented above; dark-mode.css always last |
| Firebase timing (module deferred execution) | Retain `window.onFirebaseReady` / `window.firebaseReady` handshake between Firebase inline module and `main.js` |
| Missed function references after split | Each file tests in browser; integration test via manual smoke test after all splits complete |

---

## Appendix — Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| CSS file | `kebab-case.css` | `book-details.css` |
| JS module file | `kebab-case.js` | `card-state.js` |
| JS exported function | `camelCase` | `renderLibrary()` |
| JS exported constant | `SCREAMING_SNAKE_CASE` | `CARD_STATUS_OPTIONS` |
| HTML id | `camelCase` | `id="libraryGrid"` |
| HTML data attributes | `kebab-case` | `data-action="openNotes"` |
| CSS class | `camelCase` | `.libCard`, `.workRow` |

---

*Last updated: 2026-04-28 by Copilot agent (modularization pass)*
