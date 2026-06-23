/* library-shelf.js — library cards, library filters, and library delegation */
import {
  $,
  CARD_STATUS_SORT_RANK,
  CARD_TASK_SORT_RANK,
  TASK_SEARCH_TERMS,
  YOUTUBE_SEARCH_SUFFIX,
  buildAudiobookSearchUrl,
  buildBiographySearchUrl,
  buildBuyBookSearchUrl,
  buildContextSearchUrl,
  buildFreeBookSearchUrl,
  buildGoodreadsSearchUrl,
  buildLearningSearchUrl,
  buildOutlinesSearchUrl,
  escapeHtml,
  flashEl,
  formatWorkYear,
  normalizeText,
  state
} from "./foundation.js";
import {
  applyAllTaskVisibilities,
  closeAllTaskDropdowns,
  getCardPillData,
  getCardStatus,
  getCardStatusKey,
  getCardTask,
  handleCardDateInputChangeEvent,
  handleCardStatusSelectChangeEvent,
  handleCardTaskControlChangeEvent,
  handleFinishedDateBlurEvent,
  handleFinishedDateFocusEvent,
  handleTaskDropdownClickEvent,
  renderCardMetaControls,
  renderStatusSelector,
  renderTaskTracker
} from "./reader-progress.js";
import {
  closeLearningGoalDrawers,
  handleCycleBookDetails,
  handleLinkedNotesToggle,
  loadBookDetails,
  renderBlackBoxSection,
  renderBookDetailsSection,
  renderLearningButtons,
  renderLinkedNotesSection,
  showSearchSettingsModal
} from "./book-briefing.js";
import {
  gotoLibraryGreatIdea,
  gotoPlanWorkKey,
  openDrawer,
  setView
} from "./reader-routes.js";
import {
  openConversationDesk,
  renderNotesList,
  startEditNote,
  startNewNote
} from "./writing-desks.js";
function libCardHtml(it){
  const occ = it.occurrences;
  const doneCount = occ.reduce((a,o)=> a + (state.checks[o.key] ? 1 : 0), 0);
  const allDone = doneCount === occ.length;

  const tierPills = [
    it.hasSupplemental ? `<span class="pill">Has supplemental</span>` : ""
  ].filter(Boolean).join("");

  const notesCount = state.notes.filter(n => n.book_tag === it.title).length;

  const { statusLabel: libStatusLabel, taskOpt: libTaskOpt } = getCardPillData(it.author, it.title);

  // Per-occurrence pills (click to jump to that exact place in the plan)
  const occPills = occ.slice(0, 10).map(o => {
    const label = `Y${o.year} #${o.order}${o.marker ? ` ${o.marker}` : ""}`;
    return `<button class="btn btnGhost" type="button"
              data-action="gotoPlanOcc"
              data-workkey="${escapeHtml(o.key)}"
              title="Jump to Year ${escapeHtml(o.year)}"
            >${escapeHtml(label)}</button>`;
  }).join("");

  const more = occ.length > 10 ? `<span class="pill">+${escapeHtml(occ.length - 10)} more</span>` : "";

  const firstKey = occ[0]?.key || "";

  return `
    <section class="libCard" id="${escapeHtml(it.id)}" data-libkey="${escapeHtml(it.libKey)}" data-author="${escapeHtml(it.author)}" data-title="${escapeHtml(it.title)}"${it.sourceUrl ? ` data-sourceurl="${escapeHtml(it.sourceUrl)}"` : ""}>
      <div class="libHead">
        <div style="min-width:0;">
          <p class="libTitle">${escapeHtml(it.title)}${it.publishedYear !== null && Number.isFinite(it.publishedYear) ? ` <span class="workYear">(${escapeHtml(formatWorkYear(it.publishedYear))})</span>` : ""}</p>
          <div class="libAuthor">${escapeHtml(it.author)}</div>
          <div class="tagRow">
            <span class="pill">${escapeHtml(doneCount)}/${escapeHtml(occ.length)} done</span>
            <span class="pill">${allDone ? "Complete" : "Incomplete"}</span>
            <span class="pill">Notes ${escapeHtml(notesCount)}</span>
            ${tierPills}
            <span class="pill">${escapeHtml(libStatusLabel)}</span>
            ${libTaskOpt ? `<span class="pill">${escapeHtml(libTaskOpt.label)}</span>` : ""}
          </div>
          ${(it.greatIdeas||[]).length || (it.customTags||[]).length ? `<div class="ideaTagRow">${(it.greatIdeas||[]).map(idea => `<button class="pill pillIdea pillButton" type="button" data-action="gotoLibraryGreatIdea" data-idea="${escapeHtml(idea)}" title="Show works tagged ${escapeHtml(idea)}">${escapeHtml(idea)}</button>`).join("")}${(it.customTags||[]).map(tag => `<span class="pill pillTag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
        </div>

      </div>

      <div class="help">Plan occurrences (click a pill to jump):</div>
      <div class="occList">
        ${occPills}
        ${more}
      </div>

      <div class="libDrawer"><div>
        <div class="workDrawerBody">
        ${renderCardMetaControls(it.author, it.title)}
        <div class="libActions">
          <button class="btn" type="button" data-action="openWikipediaLib" data-btn-group="wikipedia">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="7 8 9.5 16 12 11 14.5 16 17 8"></polyline></svg>
            Wikipedia
          </button>
          <button class="btn" type="button" data-action="openWikiSearchLib" data-btn-group="wikisearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"></circle><path d="M11 3.5a10 10 0 0 1 2.5 7.5 10 10 0 0 1-2.5 7.5 10 10 0 0 1-2.5-7.5 10 10 0 0 1 2.5-7.5z"></path><line x1="3.5" y1="11" x2="18.5" y2="11"></line><path d="m21 21-4-4"></path></svg>
            WikiSearch
          </button>
          ${renderLearningButtons()}
          <button class="btn" type="button" data-action="openAudiobooksLib" data-btn-group="audiobooks">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            Audiobooks
          </button>
          <button class="btn" type="button" data-action="openFreeBookLib" data-btn-group="freebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Free Online
          </button>
          <button class="btn" type="button" data-action="openBuyBookLib" data-btn-group="buybook">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            Buy Book
          </button>
          <button class="btn" type="button" data-action="openGoodreadsLib" data-btn-group="goodreads">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            Goodreads
          </button>
          <button class="btn" type="button" data-action="openOutlinesLib" data-btn-group="outlines">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
            Outlines
          </button>
          <button class="btn" type="button" data-action="openBiographyLib" data-btn-group="biography">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Biography
          </button>
          <button class="btn" type="button" data-action="openContextLib" data-btn-group="context">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Context
          </button>
          <button class="btn" type="button" data-action="newNoteLib" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New note
          </button>
          <button class="btn" type="button" data-action="openNotesLib" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            Open notes
          </button>
          <button class="btn" type="button" data-action="openDeskLib" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Desk
          </button>
          <button class="btn" type="button" data-action="gotoPlanFirst" data-workkey="${escapeHtml(firstKey)}" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            Go to plan
          </button>
         </div>
        </div>
        <div class="drawerPanelRow">
          ${it.blackBox ? renderBlackBoxSection(it.blackBox, it.title) : ""}
          ${renderLinkedNotesSection(it.title)}
          ${renderBookDetailsSection(it.author, it.title)}
        </div>
      </div></div>
    </section>
  `;
}
function filteredLibrary(){
  const q = normalizeText(state.filters.libQ);
  const show = state.filters.libShow;
  const libGreatIdea = state.filters.libGreatIdea;

  let items = state.libraryWorks.slice();

  if (q){
    items = items.filter(it => it.search.includes(q));
  }

  if (libGreatIdea && libGreatIdea !== "all"){
    items = items.filter(it => it.greatIdeas && it.greatIdeas.includes(libGreatIdea));
  }

  if (show !== "all"){
    items = items.filter(it => {
      const occ = it.occurrences;
      const doneCount = occ.reduce((a,o)=> a + (state.checks[o.key] ? 1 : 0), 0);
      const allDone = doneCount === occ.length;
      if (show === "complete") return allDone;
      if (show === "incomplete") return !allDone;
      return true;
    });
  }

  const sort = state.filters.libSort;
  if (sort === "author"){
    items.sort((a,b)=> a.author.localeCompare(b.author, undefined, { sensitivity:"base" }) || a.title.localeCompare(b.title, undefined, { sensitivity:"base" }));
  } else if (sort === "title"){
    items.sort((a,b)=> a.title.localeCompare(b.title, undefined, { sensitivity:"base" }) || a.author.localeCompare(b.author, undefined, { sensitivity:"base" }));
  } else if (sort === "occ"){
    items.sort((a,b)=> b.occurrences.length - a.occurrences.length || a.author.localeCompare(b.author) || a.title.localeCompare(b.title));
  } else if (sort === "status"){
    items.sort((a,b)=> {
      const statusKeyA = getCardStatusKey(a.author, a.title);
      const statusKeyB = getCardStatusKey(b.author, b.title);
      const rankA = CARD_STATUS_SORT_RANK[getCardStatus(statusKeyA)] ?? Number.MAX_SAFE_INTEGER;
      const rankB = CARD_STATUS_SORT_RANK[getCardStatus(statusKeyB)] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB
        || a.author.localeCompare(b.author, undefined, { sensitivity:"base" })
        || a.title.localeCompare(b.title, undefined, { sensitivity:"base" });
    });
  } else if (sort === "task"){
    items.sort((a,b)=> {
      const statusKeyA = getCardStatusKey(a.author, a.title);
      const statusKeyB = getCardStatusKey(b.author, b.title);
      const rankA = CARD_TASK_SORT_RANK[getCardTask(statusKeyA).task] ?? Number.MAX_SAFE_INTEGER;
      const rankB = CARD_TASK_SORT_RANK[getCardTask(statusKeyB).task] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB
        || a.author.localeCompare(b.author, undefined, { sensitivity:"base" })
        || a.title.localeCompare(b.title, undefined, { sensitivity:"base" });
    });
  }

  return items;
}
function paginationHtml(page, totalPages, pageSize, totalCount){
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  return `
    <button class="btn" data-paction="prev" type="button"${page <= 1 ? " disabled" : ""}>◀ Prev</button>
    <span class="pageInfo">${start}–${end} of ${totalCount}</span>
    <button class="btn" data-paction="next" type="button"${page >= totalPages ? " disabled" : ""}>Next ▶</button>
    <select class="select pageSizeSel" aria-label="Items per page">
      <option value="10"${pageSize === 10 ? " selected" : ""}>10 per page</option>
      <option value="50"${pageSize === 50 ? " selected" : ""}>50 per page</option>
    </select>
  `;
}

function renderAbcBar(elId, baseItems, getKey, activeLetter){
  const bar = $("#" + elId);
  if (!bar) return;
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const availLetters = new Set(baseItems.map(getKey));
  bar.innerHTML = [
    `<button class="btn abcBtn${!activeLetter ? " active" : ""}" data-letter="" type="button">All</button>`,
    ...LETTERS.map(l => `<button class="btn abcBtn${activeLetter === l ? " active" : ""}" data-letter="${l}" type="button"${!availLetters.has(l) ? " disabled" : ""}>${l}</button>`),
    `<button class="btn abcBtn${activeLetter === "#" ? " active" : ""}" data-letter="#" type="button"${!availLetters.has("#") ? " disabled" : ""}>#</button>`
  ].join("");
}

function libLetterKey(it){
  const s = (state.filters.libSort === "title" ? it.title : it.author).trim().toUpperCase();
  return /^[A-Z]/.test(s) ? s[0] : "#";
}

function authLetterKey(it){
  const s = it.author.trim().toUpperCase();
  return /^[A-Z]/.test(s) ? s[0] : "#";
}
function renderLibrary(){
  const grid = $("#libraryGrid");
  const pagination = $("#libPagination");

  // Get all filtered items (without letter filter)
  const baseItems = filteredLibrary();

  // Render ABC bar
  renderAbcBar("libAbcBar", baseItems, libLetterKey, state.filters.libLetterFilter);

  // Apply letter filter
  const letter = state.filters.libLetterFilter;
  const items = letter ? baseItems.filter(it => libLetterKey(it) === letter) : baseItems;

  // Pagination
  const pageSize = state.filters.libPageSize;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (state.filters.libPage > totalPages) state.filters.libPage = 1;
  const page = state.filters.libPage;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  if (!items.length){
    grid.innerHTML = `
      <section class="libCard">
        <div class="libHead">
          <div>
            <p class="libTitle">No matches</p>
            <div class="libAuthor">Try different filters</div>
          </div>
        </div>
        <div class="help">Nothing matched your library filters.</div>
      </section>
    `;
    pagination.innerHTML = "";
  } else {
    grid.innerHTML = pageItems.map(libCardHtml).join("");
    wireLibraryDelegation();
    applyAllTaskVisibilities(grid);

    pagination.innerHTML = paginationHtml(page, totalPages, pageSize, items.length);
  }
}
function wireLibraryDelegation(){
  const grid = $("#libraryGrid");

  grid.onclick = (e) => {
    // Tap on the card header (libHead) toggles the drawer
    if (!e.target.closest("[data-action]") && !e.target.closest("input")) {
      const head = e.target.closest(".libHead");
      if (head) {
        const card = head.closest(".libCard");
        if (card) {
          const was = card.classList.contains("active");
          grid.querySelectorAll(".libCard.active").forEach(c => {
            c.classList.remove("active");
            const prevInner = c.querySelector(".bookDetailsPanel > div");
            if (prevInner) { prevInner.innerHTML = ""; prevInner._sources = null; prevInner._sourceIdx = 0; }
          });
          if (!was) {
            card.classList.add("active");
            const section = card.querySelector(".bookDetailsSection");
            if (section) loadBookDetails(section);
          }
          return;
        }
      }
    }

    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    // Handle task dropdown actions (work inside .libCard but no card context needed)
    if (btn.dataset.action === "toggleTaskDropdown" || btn.dataset.action === "selectTaskOption") {
      handleTaskDropdownClickEvent(e);
      return;
    }

    if (btn.dataset.action === "cycleBookDetails"){
      handleCycleBookDetails(btn);
      return;
    }

    if (btn.dataset.action === "linkedNotesToggle"){
      handleLinkedNotesToggle(btn);
      return;
    }

    if (btn.dataset.action === "gotoLibraryGreatIdea"){
      gotoLibraryGreatIdea(btn.dataset.idea || "");
      return;
    }

    if (btn.dataset.action === "openLinkedNote"){
      const noteId = btn.dataset.noteid;
      if (noteId){ openDrawer("notes"); startEditNote(noteId); }
      return;
    }

    const card = btn.closest(".libCard");
    if (!card) return;

    const title = card.dataset.title || "";
    const author = card.dataset.author || "";

    if (btn.dataset.action === "openWikipediaLib"){
      const wikiTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
      window.open(`https://en.wikipedia.org/wiki/${wikiTitle}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openWikiSearchLib"){
      const statusKey = getCardStatusKey(author, title);
      const currentTask = getCardTask(statusKey).task;
      const taskTerms = TASK_SEARCH_TERMS[currentTask]?.wikisearch || "";
      const q = encodeURIComponent([title, author, taskTerms].filter(Boolean).join(" "));
      window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${q}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (btn.dataset.action === "toggleLearningGoals" || btn.dataset.action === "toggleYouTubeGoals") {
      const platform = btn.dataset.platform || (btn.dataset.action === "toggleYouTubeGoals" ? "youtube" : "google");
      const statusKey = getCardStatusKey(author, title);
      const currentTask = getCardTask(statusKey).task;
      const taskHint = TASK_SEARCH_TERMS[currentTask]?.[platform] || "";
      // In library view, no works are grouped so works array is empty
      closeLearningGoalDrawers();
      showSearchSettingsModal({ title, author, platform, goal: "", works: [], taskHint });
      return;
    }
    if (btn.dataset.action === "openLearningGoal") {
      const platform = btn.dataset.platform || "youtube";
      const goal = btn.dataset.goal || "";
      closeLearningGoalDrawers();
      window.open(buildLearningSearchUrl({ title, author, platform, goal }), "_blank", "noopener,noreferrer");
      return;
    }
    if (btn.dataset.action === "openGoogle"){
      closeLearningGoalDrawers();
      window.open(buildLearningSearchUrl({ title, author, platform: "google", goal: "" }), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openYouTubeLib"){
      const q = encodeURIComponent(`${title} ${author}${YOUTUBE_SEARCH_SUFFIX}`.trim());
      window.open(`https://duckduckgo.com/?q=${q}&iax=videos&ia=videos`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openAudiobooksLib"){
      window.open(buildAudiobookSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openFreeBookLib"){
      window.open(buildFreeBookSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openBuyBookLib"){
      window.open(buildBuyBookSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openGoodreadsLib"){
      window.open(buildGoodreadsSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openOutlinesLib"){
      window.open(buildOutlinesSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openBiographyLib"){
      window.open(buildBiographySearchUrl(author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openContextLib"){
      window.open(buildContextSearchUrl(author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "gotoPlanFirst"){
      const key = btn.dataset.workkey || "";
      gotoPlanWorkKey(key);
      return;
    }

    if (btn.dataset.action === "gotoPlanOcc"){
      const key = btn.dataset.workkey || "";
      gotoPlanWorkKey(key);
      return;
    }

    if (btn.dataset.action === "newNoteLib"){
      openDrawer("notes");
      startNewNote({ book_tag: title, author, year:"", selection:"" });
      return;
    }

    if (btn.dataset.action === "openNotesLib"){
      openDrawer("notes");
      state.notesUI.tag = title;
      $("#noteTagFilter").value = title;
      renderNotesList();
      return;
    }

    if (btn.dataset.action === "openDeskLib"){
      openConversationDesk({ linkedBook: title, linkedAuthor: author });
      return;
    }

  };

  grid.onchange = (e) => {
    if (handleCardStatusSelectChangeEvent(e)){
      return;
    }
    if (handleCardDateInputChangeEvent(e)){
      return;
    }
    if (handleCardTaskControlChangeEvent(e)){
      return;
    }
  };
  grid.addEventListener("focus", handleFinishedDateFocusEvent, true);
  grid.addEventListener("blur",  handleFinishedDateBlurEvent,  true);
}
export {
  filteredLibrary,
  paginationHtml,
  renderAbcBar,
  libLetterKey,
  libCardHtml,
  renderLibrary,
  wireLibraryDelegation
};
