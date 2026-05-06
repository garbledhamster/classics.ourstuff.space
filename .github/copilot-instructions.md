# GitHub Copilot Instructions — classics.ourstuff.space

These instructions apply to all Copilot suggestions and agent sessions in this repository.

---

## Project Overview

**classics.ourstuff.space** is a **vanilla JS + HTML + CSS Progressive Web App** for tracking a ten-year Great Books reading plan. It has no framework, no bundler, and no build step. The app runs entirely from a static `index.html` shell that loads modular CSS and JS files in a defined dependency order.

---

## No Build Tooling

All JS and CSS files are loaded via plain `<script src="">` and `<link rel="stylesheet">` tags in `index.html`, in the exact order listed there. **Do not introduce a bundler, transpiler, or module system** (except the Firebase SDK, which uses its own ES module format already handled in the existing load sequence).

When adding a new JS file:
1. Create it in the appropriate `src/js/` subdirectory.
2. Add a `<script src="...">` tag in `index.html` at the correct position in the dependency order.

---

## Global Namespace

All functions, classes, and constants are **globals** — they are declared at the top level and accessed anywhere without `import`. There are **no ES modules** in the project JS files. Do not add `export`/`import` statements to any file under `src/js/` (the Firebase SDK is the sole exception and is already wired up).

---

## Config-Driven Architecture

New reading-sequence actions **must** be added to all three places in `src/js/config.js`:

| Constant | What to add |
|----------|------------|
| `CARD_TASK_GROUPS` | `{ value, label, description }` in the `"Reading Sequence"` options array, at the correct step index |
| `TASK_VISIBLE_GROUPS` | `value: [array of button-group IDs]` |
| `TASK_SEARCH_TERMS` | `value: { google, youtube, wikisearch }` search term strings |

Omitting any one of these will silently break visibility or search for the new action.

---

## Firebase on `window.*`

Firebase services are initialized once and exposed as:

- `window.firebaseAuth` — Firebase Auth instance
- `window.firebaseDB` — Firestore instance

Access them via `window.firebaseAuth` / `window.firebaseDB`. Do not call `getAuth()` or `getFirestore()` directly in other modules.

---

## State Management

All UI state lives in the singleton `state` object defined in `src/js/state.js`.

**Rules:**
- Never mutate `state` properties directly outside of `applyCard*` functions in `src/js/components/card-state.js`.
- All card status, task, and date changes must go through `applyCardStatusChange()`, `applyCardTaskChange()`, or `applyCardDateChange()`.
- After a state change, call the appropriate render function (`renderAll()`, `renderPlan()`, etc.) to update the DOM.

---

## Modals and Drawers

| UI pattern | How it works |
|------------|-------------|
| **Modal** | Add `.open` class to the modal element + `.show` class to `#modalBackdrop` to open; remove both to close. |
| **Drawer** | Set `aria-hidden="true"` and the `inert` attribute to hide from assistive tech and tab order; remove both to open. |

Always return focus to the triggering element when a modal or drawer closes.

---

## Key Data Files

| File | Contents |
|------|----------|
| `library.json` | Full book catalog (~398 works). Never mutated at runtime. |
| `bookclub.json` | Ten-year reading plan with per-book metadata. Never mutated at runtime. |
| `syntopicon_terms.json` | Great Ideas (Syntopicon) index for tag filtering. Never mutated at runtime. |

---

## Issue Tracking

**Always update `ISSUES_TRACKER.md`** (repo root) when a bug is found or fixed, or when a significant new feature is added. Use the table format defined in that file.
