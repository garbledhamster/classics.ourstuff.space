# Recommendations

Project-specific guidance for contributors working on **classics.ourstuff.space**.

---

## Code Architecture

The app is a **single-file HTML shell** (`index.html`) that loads modular CSS and JS files in dependency order via plain `<script src="">` and `<link rel="stylesheet">` tags. There is **no build step** — what you see in the repo is what runs in the browser.

- Keep `index.html` as a thin shell (HTML structure + ordered asset references only).
- New logic belongs in the appropriate `src/js/` module, not inline in `index.html`.
- New styles belong in the appropriate `src/css/` file, not inline in HTML (exception: dynamic JS-set values).

---

## Data Management

| Store | Purpose |
|-------|---------|
| `library.json` | Full book catalog (~398 works). Read-only at runtime. |
| `bookclub.json` | Ten-year reading plan with per-book metadata. Read-only at runtime. |
| `syntopicon_terms.json` | Great Ideas index. Read-only at runtime. |
| `localStorage` | All per-user state: card statuses, tasks, dates, notes, checks, timer. |
| **Firestore** | Optional cloud sync of the same per-user state (debounced, opt-in via login). |

- Never mutate JSON source files at runtime.
- All localStorage keys are versioned constants in `config.js` (e.g. `LS_CARD_STATUS`).
- Firestore sync is debounced (`AUTO_SYNC_DEBOUNCE_MS`) to avoid excessive writes.

---

## Adding New Reading-Sequence Actions

**Always** update all three places in `src/js/config.js` together:

1. **`CARD_TASK_GROUPS`** — add a new `{ value, label, description }` entry inside the `"Reading Sequence"` group at the correct step position.
2. **`TASK_VISIBLE_GROUPS`** — map the new `value` to the array of button-group IDs that should be visible when this task is selected.
3. **`TASK_SEARCH_TERMS`** — map the new `value` to per-platform search term strings (`google`, `youtube`, `wikisearch` as needed).

Missing any one of these will result in broken visibility or empty searches for the new action.

---

## Accessibility

- All interactive controls must have an accessible name (via `aria-label`, `aria-labelledby`, or visible `<label>`).
- Keyboard navigation: modals trap focus; drawers use `aria-hidden="true"` + `inert` to remove non-visible content from the tab order.
- Focus must return to the triggering element when a modal or drawer closes.
- Use `role="option"` + `aria-selected` for custom listbox-style dropdowns (see task tracker).

---

## Dark Mode

- Dark mode is toggled by adding/removing a CSS class on `<html>` (check `src/css/dark-mode.css` for the exact class name).
- The user's preference is persisted to `localStorage` and re-applied on page load.
- All new UI elements must be styled under both the default and dark-mode selectors.

---

## Performance

- **Lazy render**: only the active view (Library / Plan / Authors) is rendered; switching views calls `renderAll()` which re-renders just the current view.
- **Pagination**: library and authors views paginate locally; avoid rendering all items at once.
- **Debounced sync**: Firestore writes are debounced via `AUTO_SYNC_DEBOUNCE_MS` — do not bypass the debounce.
- Avoid querying the full DOM on every keystroke; delegate events to stable container elements.

---

## Firebase

- The Firebase config object (API key, project ID, etc.) is currently embedded in `index.html` and is therefore **public** in this repo.
- This is acceptable only because Firebase Security Rules restrict what unauthenticated and authenticated users can read/write. **Review the Security Rules before expanding Firestore access.**
- **Never commit** service-account credentials, admin SDK keys, or any secret with elevated privileges.
- Firebase is accessed via `window.firebaseAuth` and `window.firebaseDB` — do not import Firebase modules directly in other files.

---

## Testing

There are currently **no automated tests**. All testing is manual (load the page, exercise the feature).

**Recommended additions:**
- Smoke tests that load `index.html` in a headless browser and assert basic rendering (e.g. Playwright or Puppeteer).
- Unit tests for pure utility functions in `src/js/utils.js` and `src/js/config.js` (e.g. Vitest or Jest with jsdom, no bundler needed).
- A CI step (GitHub Actions) that runs the smoke tests on every push.

Until automated tests exist, manually verify all affected views (Library, Plan, Authors) after any change to `config.js`, `render.js`, or `wire-ui.js`.

---

## CSS

- CSS is split into purpose-scoped files under `src/css/` (reset, theme, layout, component files).
- Load order matters and is defined in `index.html` — append new `<link>` tags at the correct position.
- Avoid inline `style=""` attributes except for values computed at runtime in JS (e.g. dynamic widths/positions).
- Do not add component styles to `reset.css` or `theme.css`; create or reuse an appropriate component file.

---

## PWA / Offline

- `manifest.json` and icon assets (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) are already in place.
- A service worker is not currently registered; adding one would enable full offline support.
- If a service worker is added, ensure the cache-busting strategy is updated whenever `library.json` or `bookclub.json` changes.
