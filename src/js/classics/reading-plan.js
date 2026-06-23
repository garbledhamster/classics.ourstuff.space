/* reading-plan.js — plan loading, plan rendering, and plan delegation */
import {
  $,
  CARD_STATUS_SORT_RANK,
  CARD_TASK_SORT_RANK,
  LS_CARD_DATES,
  LS_CARD_STATUS,
  LS_CARD_TASKS,
  LS_CHECKS,
  LS_CONVERSATION_DESK,
  LS_NOTES,
  LS_READING_STAGE_CHECKS,
  LS_USER_PROFILE,
  NOTE_TYPE_OPTIONS,
  TABLE_COLUMNS,
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
  clearError,
  escapeHtml,
  formatWorkYear,
  hash32,
  loadConversationDesk,
  normalizeText,
  saveChecks,
  saveTableHiddenCols,
  setError,
  showAlert,
  showConfirm,
  state,
  workKey
} from "./foundation.js";
import {
  applyAllTaskVisibilities,
  closeAllTaskDropdowns,
  closeTimerModal,
  getCardDates,
  getCardPillData,
  getCardStatus,
  getCardStatusKey,
  getCardTask,
  getReadingStageState,
  handleCardDateInputChangeEvent,
  handleCardStatusSelectChangeEvent,
  handleCardTaskControlChangeEvent,
  handleFinishedDateBlurEvent,
  handleFinishedDateFocusEvent,
  handleReadingStageCheckboxChangeEvent,
  handleTaskDropdownClickEvent,
  renderCardMetaControls,
  renderReadingStageChecklist,
  renderStatusSelector,
  renderTaskTracker,
  showExportModal
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
  gotoLibraryWork,
  getWorkContextFromRow,
  openDrawer,
  closeDrawer,
  setView,
  renderAll
} from "./reader-routes.js";
import {
  archiveEditorNote,
  archiveSelectedNotes,
  bindConversationDeskUI,
  deleteEditorNote,
  deleteSelectedNotes,
  exportNotes,
  filteredNotes,
  getCheckGroupValues,
  hideEditor,
  importNotesFile,
  openConversationDesk,
  renderConversationDesk,
  renderNotesList,
  saveEditorNote,
  setCheckGroupValues,
  startEditNote,
  startNewNote,
  toggleNoteSelectMode
} from "./writing-desks.js";
import {
  wireUI
} from "./shell-wiring.js";
import {
  CLASSICS_DATA_FILES
} from "./data-paths.js";
function renderPlan(){
  const grid = $("#planGrid");
  const filtered = applyPlanFilters();
  const grouped = groupByYear(filtered);

  // Apply view-mode class
  const vm   = state.filters.planViewMode || "default";
  grid.className = "grid";

  // Keep button labels in sync
  updatePlanViewButtons();

  if (!grouped.length){
    grid.innerHTML = `
      <div class="yearCard">
        <div class="yearHeader">
          <h2 class="yearTitle">No matches</h2>
          <div class="yearMeta"><span>Try different filters</span></div>
        </div>
        <div class="help">Nothing matched your plan search/tier/year filter &amp; sorter.</div>
      </div>
    `;
    return;
  }

  if (vm === "table") {
    if (state.filters.year === "all") {
      grid.innerHTML = allYearsTableHtml(grouped);
    } else {
      grid.innerHTML = grouped.map(g => yearCardTableHtml(g.year, g.items)).join("");
    }
  } else {
    grid.innerHTML = grouped.map(g => yearCardHtml(g.year, g.items)).join("");
  }
  wirePlanDelegation();
  applyAllTaskVisibilities(grid);
}

/* ---- View button label sync ---- */
// View-mode icon paths (Lucide / IconBuddy style)
const PLAN_VIEW_ICONS = {
  default: '<rect x="3" y="5" width="4" height="4"></rect><rect x="3" y="12" width="4" height="4"></rect><rect x="3" y="19" width="4" height="2"></rect><line x1="10" y1="7" x2="21" y2="7"></line><line x1="10" y1="14" x2="21" y2="14"></line><line x1="10" y1="21" x2="21" y2="21"></line>',
  table: '<path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"></path>'
};
const PLAN_VIEW_LABELS = { default: "View: Full", table: "View: Table" };
function updatePlanViewButtons(){
  const vm   = state.filters.planViewMode || "default";

  const vmIcon  = $("#planViewModeIcon");
  const vmLabel = $("#planViewModeBtnLabel");

  if (vmIcon)  vmIcon.innerHTML  = PLAN_VIEW_ICONS[vm]  || PLAN_VIEW_ICONS.default;
  if (vmLabel) vmLabel.textContent = PLAN_VIEW_LABELS[vm] || "View: Full";

  const colPickerWrap = $("#planColPickerWrap");
  if (colPickerWrap) colPickerWrap.style.display = vm === "table" ? "" : "none";
}

function renderColPickerPanel(){
  const panels = [
    document.querySelector("#planGrid .colPickerPanel"),
    document.getElementById("planColPickerPanel"),
  ].filter(Boolean);
  if (!panels.length) return;
  const hidden = state.ui.tableHiddenCols;
  const html = TABLE_COLUMNS.map(col => `
    <label>
      <input type="checkbox" data-action="toggleTableCol" data-col-id="${escapeHtml(col.id)}" ${hidden.has(col.id) ? "" : "checked"}>
      ${escapeHtml(col.label)}
    </label>`).join("");
  for (const panel of panels) {
    panel.innerHTML = html;
  }
}

function toggleColPickerPanel(open){
  const panel = document.querySelector("#planGrid .colPickerPanel");
  const btn   = document.querySelector("#planGrid [data-action='toggleColPicker']");
  if (!panel || !btn) return;
  if (open === undefined) open = panel.hasAttribute("hidden");
  if (open){
    renderColPickerPanel();
    panel.removeAttribute("hidden");
    btn.setAttribute("aria-expanded", "true");
  } else {
    panel.setAttribute("hidden", "");
    btn.setAttribute("aria-expanded", "false");
  }
}

function toggleStandaloneColPicker(open){
  const panel = document.getElementById("planColPickerPanel");
  const btn   = document.getElementById("planColPickerBtn");
  if (!panel || !btn) return;
  if (open === undefined) open = panel.hasAttribute("hidden");
  if (open){
    renderColPickerPanel();
    panel.removeAttribute("hidden");
    btn.setAttribute("aria-expanded", "true");
  } else {
    panel.setAttribute("hidden", "");
    btn.setAttribute("aria-expanded", "false");
  }
}

/* ---- Table-view renderers ---- */
function yearCardTableHtml(year, items){
  const total = items.length;
  const done  = items.reduce((acc,x)=> acc + (state.checks[x.key] ? 1 : 0), 0);
  const pct   = total ? Math.round((done/total)*100) : 0;

  // Pre-compute note counts (O(notes) once instead of O(works * notes))
  const noteCountMap = new Map();
  for (const n of state.notes){
    if (n.book_tag) noteCountMap.set(n.book_tag, (noteCountMap.get(n.book_tag) || 0) + 1);
  }

  const blocks = new Map();
  for (const it of items){
    const blockKey = `${it.order}|${it.tier}|${it.marker||""}|${it.author}`;
    if (!blocks.has(blockKey)) blocks.set(blockKey, { order: it.order, tier: it.tier, marker: it.marker, author: it.author, works: [] });
    blocks.get(blockKey).works.push(it);
  }
  const blockArr = Array.from(blocks.values()).sort((a,b)=>a.order-b.order);

  const rows = blockArr.flatMap(b => b.works.map(w => workRowTableHtml(b, w, noteCountMap))).join("");
  const h = state.ui.tableHiddenCols;
  const hiddenColStyle = (id) => h.has(id) ? ' style="display:none"' : '';

  return `
    <section class="yearCard" data-year="${year}">
      <div class="yearHeader">
        <h2 class="yearTitle">Year ${escapeHtml(year)}</h2>
        <div class="yearMeta">
          <span>${escapeHtml(done)}/${escapeHtml(total)} done</span>
          <span class="mono">•</span>
          <span class="bar" aria-label="progress bar"><span style="width:${pct}%"></span></span>
        </div>
      </div>
      <div class="planTableWrap">
        <table class="planTable" aria-label="Year ${escapeHtml(year)} reading list">
          <thead>
            <tr>
              <th class="td-check" data-col="check"${hiddenColStyle("check")}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </th>
              <th data-col="year"${hiddenColStyle("year")}>Year</th>
              <th data-col="number"${hiddenColStyle("number")}>Number</th>
              <th data-col="work"${hiddenColStyle("work")}>Work</th>
              <th data-col="author"${hiddenColStyle("author")}>Author</th>
              <th data-col="type"${hiddenColStyle("type")}>Type</th>
              <th data-col="notes"${hiddenColStyle("notes")}>Notes</th>
              <th data-col="status"${hiddenColStyle("status")}>Status</th>
              <th data-col="action"${hiddenColStyle("action")}>Current Action</th>
              <th data-col="date-start"${hiddenColStyle("date-start")}>Start Date</th>
              <th data-col="date-end"${hiddenColStyle("date-end")}>End Date</th>
              <th class="th-colpicker">
                <button class="btn-colpicker" data-action="toggleColPicker" type="button" title="Show or hide columns" aria-label="Show or hide columns" aria-haspopup="true" aria-expanded="false">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
                <div class="colPickerPanel" role="menu" aria-label="Column visibility" hidden></div>
              </th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function tableHeaderHtml(hiddenColStyle){
  return `
    <tr>
      <th class="td-check" data-col="check"${hiddenColStyle("check")}>
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </th>
      <th data-col="year"${hiddenColStyle("year")}>Year</th>
      <th data-col="number"${hiddenColStyle("number")}>Number</th>
      <th data-col="work"${hiddenColStyle("work")}>Work</th>
      <th data-col="author"${hiddenColStyle("author")}>Author</th>
      <th data-col="type"${hiddenColStyle("type")}>Type</th>
      <th data-col="notes"${hiddenColStyle("notes")}>Notes</th>
      <th data-col="status"${hiddenColStyle("status")}>Status</th>
      <th data-col="action"${hiddenColStyle("action")}>Current Action</th>
      <th data-col="date-start"${hiddenColStyle("date-start")}>Start Date</th>
      <th data-col="date-end"${hiddenColStyle("date-end")}>End Date</th>
      <th class="th-colpicker">
        <button class="btn-colpicker" data-action="toggleColPicker" type="button" title="Show or hide columns" aria-label="Show or hide columns" aria-haspopup="true" aria-expanded="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </button>
        <div class="colPickerPanel" role="menu" aria-label="Column visibility" hidden></div>
      </th>
    </tr>`;
}

function allYearsTableHtml(grouped){
  const allItems = grouped.flatMap(group => group.items);
  const total = allItems.length;
  const done  = allItems.reduce((acc,x)=> acc + (state.checks[x.key] ? 1 : 0), 0);
  const pct   = total ? Math.round((done/total)*100) : 0;

  const noteCountMap = new Map();
  for (const n of state.notes){
    if (n.book_tag) noteCountMap.set(n.book_tag, (noteCountMap.get(n.book_tag) || 0) + 1);
  }

  const h = state.ui.tableHiddenCols;
  const hiddenColStyle = (id) => h.has(id) ? ' style="display:none"' : '';

  const rows = grouped.flatMap(group => {
    const blocks = new Map();
    for (const item of group.items){
      const blockKey = `${item.order}|${item.tier}|${item.marker||""}|${item.author}`;
      if (!blocks.has(blockKey)) blocks.set(blockKey, { order: item.order, tier: item.tier, marker: item.marker, author: item.author, works: [] });
      blocks.get(blockKey).works.push(item);
    }
    return Array.from(blocks.values()).sort((a,b)=>a.order-b.order)
      .flatMap(block => block.works.map(work => workRowTableHtml(block, work, noteCountMap)));
  }).join("");

  return `
    <section class="yearCard" data-year="all">
      <div class="yearHeader">
        <h2 class="yearTitle">All Years</h2>
        <div class="yearMeta">
          <span>${escapeHtml(done)}/${escapeHtml(total)} done</span>
          <span class="mono">•</span>
          <span class="bar" aria-label="progress bar"><span style="width:${pct}%"></span></span>
        </div>
      </div>
      <div class="planTableWrap">
        <table class="planTable" aria-label="All years reading list">
          <thead>${tableHeaderHtml(hiddenColStyle)}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function workRowTableHtml(block, w, noteCountMap){
  const checked   = !!state.checks[w.key];
  const title     = w.work.title || "Untitled";
  const noteCount = noteCountMap ? (noteCountMap.get(title) || 0) : state.notes.filter(n => n.book_tag === title).length;
  const statusKey = getCardStatusKey(w.author, title);
  const dateEntry = getCardDates(statusKey);
  const h = state.ui.tableHiddenCols;
  const hiddenColStyle = (id) => h.has(id) ? ' style="display:none"' : '';
  return `
    <tr class="workRow"
      data-workkey="${escapeHtml(w.key)}"
      data-book="${escapeHtml(title)}"
      data-author="${escapeHtml(w.author)}"
      data-year="${escapeHtml(w.year)}"
      data-order="${escapeHtml(w.order)}"
      data-tier="${escapeHtml(w.tier)}"
      data-selection="${escapeHtml(w.work.selection || "")}"
      ${w.sourceUrl ? `data-sourceurl="${escapeHtml(w.sourceUrl)}"` : ""}
      id="wk_${escapeHtml(hash32(w.key))}"
    >
      <td class="td-check" data-col="check"${hiddenColStyle("check")}>
        <input type="checkbox" ${checked ? "checked" : ""} aria-label="complete checkbox" data-action="toggleComplete" >
      </td>
      <td class="td-year" data-col="year"${hiddenColStyle("year")}>${escapeHtml(w.year)}</td>
      <td class="td-number" data-col="number"${hiddenColStyle("number")}>${escapeHtml(block.order)}</td>
      <td class="td-work" data-col="work"${hiddenColStyle("work")}>${escapeHtml(title)}${Number.isFinite(w.publishedYear) ? ` <span class="workYear">(${escapeHtml(formatWorkYear(w.publishedYear))})</span>` : ""}</td>
      <td class="td-author" data-col="author"${hiddenColStyle("author")}>${escapeHtml(block.author || "Unknown")}</td>
      <td class="td-type" data-col="type"${hiddenColStyle("type")}>${escapeHtml(w.tier)}</td>
      <td class="td-notes" data-col="notes"${hiddenColStyle("notes")}>${escapeHtml(noteCount)}</td>
      <td class="td-status" data-col="status"${hiddenColStyle("status")}>${renderStatusSelector(w.author, title)}</td>
      <td class="td-action" data-col="action"${hiddenColStyle("action")}>${renderTaskTracker(w.author, title)}</td>
      <td class="td-date" data-col="date-start"${hiddenColStyle("date-start")}>
        <input class="cardDateInput" type="date" data-action="setCardDate" data-datekey="${escapeHtml(statusKey)}" data-datefield="started" value="${escapeHtml(dateEntry.started)}" aria-label="Start date for ${escapeHtml(title)} by ${escapeHtml(w.author)}" >
      </td>
      <td class="td-date" data-col="date-end"${hiddenColStyle("date-end")}>
        <input class="cardDateInput" type="date" data-action="setCardDate" data-datekey="${escapeHtml(statusKey)}" data-datefield="finished" value="${escapeHtml(dateEntry.finished)}" aria-label="End date for ${escapeHtml(title)} by ${escapeHtml(w.author)}" >
      </td>
      <td class="td-colpicker" aria-hidden="true"></td>
    </tr>
  `;
}
function yearCardHtml(year, items){
  const total = items.length;
  const done = items.reduce((acc,x)=> acc + (state.checks[x.key] ? 1 : 0), 0);
  const pct = total ? Math.round((done/total)*100) : 0;
  const barW = pct;

  const blocks = new Map();
  for (const it of items){
    const blockKey = `${it.order}|${it.tier}|${it.marker||""}|${it.author}`;
    if (!blocks.has(blockKey)) blocks.set(blockKey, { order: it.order, tier: it.tier, marker: it.marker, author: it.author, works: [] });
    blocks.get(blockKey).works.push(it);
  }
  const blockArr = Array.from(blocks.values()).sort((a,b)=>a.order-b.order);

  return `
    <section class="yearCard" data-year="${year}">
      <div class="yearHeader">
        <h2 class="yearTitle">Year ${escapeHtml(year)}</h2>
        <div class="yearMeta">
          <span>${escapeHtml(done)}/${escapeHtml(total)} done</span>
          <span class="mono">•</span>
          <span class="bar" aria-label="progress bar"><span style="width:${barW}%"></span></span>
        </div>
      </div>
      ${blockArr.map(b => readingBlockHtml(year, b)).join("")}
    </section>
  `;
}

function readingBlockHtml(year, block){
  const tierLabel = block.tier || "—";
  const marker = block.marker ? `<span class="marker">${escapeHtml(block.marker)}</span>` : "";
  const worksHtml = block.works.map(w => workRowHtml(w)).join("");

  return `
    <div class="readingBlock" data-year="${year}" data-order="${block.order}">
      <div class="readingHead">
        <div class="readingLeft">
          <div class="order">#${escapeHtml(block.order)}</div>
          <div class="author">${escapeHtml(block.author || "Unknown")}</div>
          <span class="tier">${escapeHtml(tierLabel)}</span>
          ${marker}
        </div>

      </div>
      <div class="worksList">
        ${worksHtml}
      </div>
    </div>
  `;
}

function workRowHtml(w){
  const checked = !!state.checks[w.key];
  const title = w.work.title || "Untitled";
  const sel = w.work.selection ? `Selection: ${w.work.selection}` : "";
  const sels = Array.isArray(w.work.selections) && w.work.selections.length ? `Selections: ${w.work.selections.join("; ")}` : "";
  const subLines = [sel, sels].filter(Boolean);

  const noteCount = state.notes.filter(n => n.book_tag === title).length;

  const { statusLabel: wrStatusLabel, taskOpt: wrTaskOpt } = getCardPillData(w.author, title);

  return `
    <div class="workRow"
         data-workkey="${escapeHtml(w.key)}"
         data-book="${escapeHtml(title)}"
         data-author="${escapeHtml(w.author)}"
         data-year="${escapeHtml(w.year)}"
         data-order="${escapeHtml(w.order)}"
         data-tier="${escapeHtml(w.tier)}"
         data-selection="${escapeHtml(w.work.selection || "")}"
         ${w.sourceUrl ? `data-sourceurl="${escapeHtml(w.sourceUrl)}"` : ""}
         id="wk_${escapeHtml(hash32(w.key))}"
    >
      <div class="workCheck">
        <input type="checkbox" ${checked ? "checked" : ""} aria-label="complete checkbox" data-action="toggleComplete" >
      </div>

      <div class="workMain">
        <p class="workTitle">${escapeHtml(title)}${Number.isFinite(w.publishedYear) ? ` <span class="workYear">(${escapeHtml(formatWorkYear(w.publishedYear))})</span>` : ""}</p>
        <div class="workSub">
          <div class="tagRow">
            <span class="pill">Year ${escapeHtml(w.year)}</span>
            <span class="pill">Order ${escapeHtml(w.order)}</span>
            <span class="pill">${escapeHtml(w.tier)}</span>
            <span class="pill">Notes ${escapeHtml(noteCount)}</span>
            <span class="pill">${escapeHtml(wrStatusLabel)}</span>
            ${wrTaskOpt ? `<span class="pill">${escapeHtml(wrTaskOpt.label)}</span>` : ""}
          </div>
          ${(w.greatIdeas||[]).length || (w.customTags||[]).length ? `<div class="ideaTagRow">${(w.greatIdeas||[]).map(idea => `<button class="pill pillIdea pillButton" type="button" data-action="gotoLibraryGreatIdea" data-idea="${escapeHtml(idea)}" title="Show library works tagged ${escapeHtml(idea)}">${escapeHtml(idea)}</button>`).join("")}${(w.customTags||[]).map(tag => `<span class="pill pillTag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
          ${subLines.length ? `<div>${subLines.map(escapeHtml).join("<br>")}</div>` : ""}
        </div>
      </div>

      <div class="workDrawer"><div>
        ${renderReadingStageChecklist(w)}
        <div class="workDrawerBody">
        ${renderCardMetaControls(w.author, title)}
        <div class="workActions">
          <button class="btn" type="button" data-action="openWikipedia" data-btn-group="wikipedia" aria-label="Wikipedia" title="Wikipedia">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="7 8 9.5 16 12 11 14.5 16 17 8"></polyline></svg>
            <span class="btn-label">Wikipedia</span>
          </button>
          <button class="btn" type="button" data-action="openWikiSearch" data-btn-group="wikisearch" aria-label="WikiSearch" title="WikiSearch">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"></circle><path d="M11 3.5a10 10 0 0 1 2.5 7.5 10 10 0 0 1-2.5 7.5 10 10 0 0 1-2.5-7.5 10 10 0 0 1 2.5-7.5z"></path><line x1="3.5" y1="11" x2="18.5" y2="11"></line><path d="m21 21-4-4"></path></svg>
            <span class="btn-label">WikiSearch</span>
          </button>
          ${renderLearningButtons()}
          <button class="btn" type="button" data-action="openAudiobooks" data-btn-group="audiobooks" aria-label="Audiobooks" title="Audiobooks">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            <span class="btn-label">Audiobooks</span>
          </button>
          <button class="btn" type="button" data-action="openFreeBook" data-btn-group="freebook" aria-label="Free Online" title="Free Online">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span class="btn-label">Free Online</span>
          </button>
          <button class="btn" type="button" data-action="openBuyBook" data-btn-group="buybook" aria-label="Buy Book" title="Buy Book">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            <span class="btn-label">Buy Book</span>
          </button>
          <button class="btn" type="button" data-action="openGoodreads" data-btn-group="goodreads" aria-label="Goodreads" title="Goodreads">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            <span class="btn-label">Goodreads</span>
          </button>
          <button class="btn" type="button" data-action="openOutlines" data-btn-group="outlines" aria-label="Outlines" title="Outlines">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
            <span class="btn-label">Outlines</span>
          </button>
          <button class="btn" type="button" data-action="openBiography" data-btn-group="biography">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Biography
          </button>
          <button class="btn" type="button" data-action="openContext" data-btn-group="context">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Context
          </button>
          <button class="btn" type="button" data-action="openLibraryForWork" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span class="btn-label">View Library</span>
          </button>
          <button class="btn" type="button" data-action="newNoteFromWork" data-btn-group="always" aria-label="New note" title="New note">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span class="btn-label">New note</span>
          </button>
          <button class="btn" type="button" data-action="openNotesForBook" data-btn-group="always" aria-label="Open notes" title="Open notes">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            <span class="btn-label">Open notes</span>
          </button>
          <button class="btn" type="button" data-action="openDeskWork" data-btn-group="always" aria-label="Open Conversation Desk" title="Open Conversation Desk">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span class="btn-label">Desk</span>
          </button>
         </div>
        </div>
        <div class="drawerPanelRow">
          ${w.blackBox ? renderBlackBoxSection(w.blackBox, title) : ""}
          ${renderLinkedNotesSection(title)}
          ${renderBookDetailsSection(w.author, title)}
        </div>
      </div></div>
    </div>
  `;
function applyPlanFilters(){
  const f = state.filters;
  const q = normalizeText(f.q);
  const noteCountMap = new Map();
  for (const n of state.notes){
    if (n.book_tag) noteCountMap.set(n.book_tag, (noteCountMap.get(n.book_tag) || 0) + 1);
  }

  let items = state.flatWorks.slice();

  if (f.year !== "all"){
    const y = Number(f.year);
    items = items.filter(x => x.year === y);
  }
  if (f.tier !== "all"){
    items = items.filter(x => x.tier === f.tier);
  }
  if (f.greatIdea && f.greatIdea !== "all"){
    items = items.filter(x => x.greatIdeas && x.greatIdeas.includes(f.greatIdea));
  }
  if (q){
    items = items.filter(x => x.search.includes(q));
  }

  if (f.sort === "tracker_in_progress"){
    items = items.filter(x => getCardStatus(getCardStatusKey(x.author, x.work.title)) === "in_progress");
  } else if (f.sort === "tracker_complete"){
    items = items.filter(x => getCardStatus(getCardStatusKey(x.author, x.work.title)) === "complete");
  } else if (f.sort === "tracker_not_started"){
    items = items.filter(x => getCardStatus(getCardStatusKey(x.author, x.work.title)) === "not_started");
  } else if (f.sort === "tracker_skipped"){
    items = items.filter(x => getCardStatus(getCardStatusKey(x.author, x.work.title)) === "skipped");
  }

  const tieBreak = (a,b) => a.year-b.year || a.order-b.order || a.flatIndex-b.flatIndex;
  if (f.sort === "sort_year"){
    items.sort((a,b)=> a.year-b.year || tieBreak(a,b));
  } else if (f.sort === "sort_published_year"){
    items.sort((a,b)=> {
      const yearA = Number.isFinite(a.publishedYear) ? a.publishedYear : Number.MAX_SAFE_INTEGER;
      const yearB = Number.isFinite(b.publishedYear) ? b.publishedYear : Number.MAX_SAFE_INTEGER;
      return yearA - yearB || tieBreak(a,b);
    });
  } else if (f.sort === "sort_number"){
    items.sort((a,b)=> a.order-b.order || tieBreak(a,b));
  } else if (f.sort === "sort_work"){
    items.sort((a,b)=> a.work.title.localeCompare(b.work.title, undefined, { sensitivity:"base" }) || tieBreak(a,b));
  } else if (f.sort === "sort_author"){
    items.sort((a,b)=> a.author.localeCompare(b.author, undefined, { sensitivity:"base" }) || tieBreak(a,b));
  } else if (f.sort === "sort_type"){
    items.sort((a,b)=> a.tier.localeCompare(b.tier, undefined, { sensitivity:"base" }) || tieBreak(a,b));
  } else if (f.sort === "sort_notes"){
    items.sort((a,b)=> {
      const notesA = noteCountMap.get(a.work.title) || 0;
      const notesB = noteCountMap.get(b.work.title) || 0;
      return notesA - notesB || tieBreak(a,b);
    });
  } else if (f.sort === "sort_status"){
    items.sort((a,b)=> {
      const statusKeyA = getCardStatusKey(a.author, a.work.title);
      const statusKeyB = getCardStatusKey(b.author, b.work.title);
      const rankA = CARD_STATUS_SORT_RANK[getCardStatus(statusKeyA)] ?? Number.MAX_SAFE_INTEGER;
      const rankB = CARD_STATUS_SORT_RANK[getCardStatus(statusKeyB)] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB || tieBreak(a,b);
    });
  } else if (f.sort === "sort_action"){
    items.sort((a,b)=> {
      const statusKeyA = getCardStatusKey(a.author, a.work.title);
      const statusKeyB = getCardStatusKey(b.author, b.work.title);
      const rankA = CARD_TASK_SORT_RANK[getCardTask(statusKeyA).task] ?? Number.MAX_SAFE_INTEGER;
      const rankB = CARD_TASK_SORT_RANK[getCardTask(statusKeyB).task] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB || tieBreak(a,b);
    });
  } else if (f.sort === "sort_start_date"){
    items.sort((a,b)=> {
      const dateA = getCardDates(getCardStatusKey(a.author, a.work.title)).started || "9999-12-31";
      const dateB = getCardDates(getCardStatusKey(b.author, b.work.title)).started || "9999-12-31";
      return dateA.localeCompare(dateB) || tieBreak(a,b);
    });
  } else if (f.sort === "sort_end_date"){
    items.sort((a,b)=> {
      const dateA = getCardDates(getCardStatusKey(a.author, a.work.title)).finished || "9999-12-31";
      const dateB = getCardDates(getCardStatusKey(b.author, b.work.title)).finished || "9999-12-31";
      return dateA.localeCompare(dateB) || tieBreak(a,b);
    });
  } else {
    items.sort((a,b)=> {
      const checkA = state.checks[a.key] ? 1 : 0;
      const checkB = state.checks[b.key] ? 1 : 0;
      return checkA - checkB || tieBreak(a,b);
    });
  }

  return items;
}

function groupByYear(filtered){
  const map = new Map();
  for (const item of filtered){
    if (!map.has(item.year)) map.set(item.year, []);
    map.get(item.year).push(item);
  }
  const years = Array.from(map.keys()).sort((a,b)=>a-b);
  return years.map(y => ({ year:y, items: map.get(y) }));
}
async function loadPlan(){
  clearError();
  try{
    // Load project catalog for sourceUrls
    const projRes = await fetch(CLASSICS_DATA_FILES.libraryCatalog, { cache:"no-store" });
    if (!projRes.ok) throw new Error(`Could not load library.json (${projRes.status})`);
    const projectData = await projRes.json();
    if (!Array.isArray(projectData)) throw new Error("library.json must be an array");
    state.projectCatalog = projectData;

    state.readingGuideRows = await loadReadingGuides();
    state.readingGuideLookup = buildReadingGuideLookup(state.readingGuideRows);

    // Load reading plan
    const res = await fetch(CLASSICS_DATA_FILES.readingPlan, { cache:"no-store" });
    if (!res.ok) throw new Error(`Could not load bookclub.json (${res.status})`);
    const data = await res.json();
    if (!data || !Array.isArray(data.years)) throw new Error("bookclub.json must include { plan_name, years: [...] }");

    state.plan = data;

    const today = new Date().toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    $("#today").textContent = today;

    flattenPlan();
    buildLibraryWorks();
    buildGreatIdeasUniverse();
    fillYearOptions();
    buildTagsUniverse();
    wireUI();
    renderAll();
  } catch(err){
    setError(`LOAD ERROR: ${err.message}`);
  }
}

async function loadReadingGuides(){
  try{
    const res = await fetch(CLASSICS_DATA_FILES.readingGuide, { cache:"no-store" });
    if (!res.ok) throw new Error(`Could not load greatbooks.csv (${res.status})`);
    const text = await res.text();
    return parseCsvRecords(text);
  } catch(err){
    console.warn("Reading guidance CSV unavailable:", err);
    return [];
  }
}

function parseCsvRecords(text){
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const headers = rows[0].map(h => String(h || "").trim());
  return rows.slice(1)
    .filter(row => row.some(cell => String(cell || "").trim()))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function parseCsvRows(text){
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++){
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes){
      if (ch === '"' && next === '"'){
        cell += '"';
        i++;
      } else if (ch === '"'){
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"'){
      inQuotes = true;
    } else if (ch === ","){
      row.push(cell);
      cell = "";
    } else if (ch === "\n"){
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r"){
      cell += ch;
    }
  }
  if (cell || row.length){
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeGuideKeyPart(value){
  return normalizeText(value)
    .replaceAll("&", " and ")
    .replace(/\bst\.?\s+/g, "saint ")
    .replace(/gospel according to saint\s+/g, "gospel of ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|of|and|in)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGuideAuthor(value){
  return normalizeGuideKeyPart(value).replace(/\bsaint\b/g, "").trim();
}

function readingGuideKey({ year, order, author, title, selection }){
  return [
    Number(year) || "",
    Number(order) || "",
    normalizeGuideAuthor(author),
    normalizeGuideKeyPart(title),
    normalizeGuideKeyPart(selection)
  ].join("|");
}

function readingGuideIdentityKey({ year, author, title }){
  return [
    Number(year) || "",
    normalizeGuideAuthor(author),
    normalizeGuideKeyPart(title)
  ].join("|");
}

function readingGuideAuthorTitleKey({ author, title }){
  return [
    normalizeGuideAuthor(author),
    normalizeGuideKeyPart(title)
  ].join("|");
}

function buildReadingGuideLookup(rows){
  const exact = new Map();
  const loose = new Map();
  const byYearAuthorTitle = new Map();
  const byAuthorTitle = new Map();
  const byYearTitle = new Map();
  const byTitle = new Map();
  for (const row of rows){
    const entry = normalizeReadingGuideRow(row);
    const exactKey = readingGuideKey({
      year: entry.year,
      order: entry.order,
      author: entry.author,
      title: entry.title,
      selection: entry.selection
    });
    const looseKey = readingGuideKey({
      year: entry.year,
      order: entry.order,
      author: entry.author,
      title: entry.title,
      selection: ""
    });
    exact.set(exactKey, entry);
    if (!loose.has(looseKey)) loose.set(looseKey, entry);
    byYearAuthorTitle.set(readingGuideIdentityKey(entry), entry);
    byAuthorTitle.set(readingGuideAuthorTitleKey(entry), entry);
    byYearTitle.set(`${entry.year}|${normalizeGuideKeyPart(entry.title)}`, entry);

    const titleKey = normalizeGuideKeyPart(entry.title);
    if (byTitle.has(titleKey)) byTitle.set(titleKey, null);
    else byTitle.set(titleKey, entry);
  }
  return { exact, loose, byYearAuthorTitle, byAuthorTitle, byYearTitle, byTitle, rows: Array.from(exact.values()) };
}

function normalizeReadingGuideRow(row){
  return {
    status: String(row.Status || "").trim(),
    globalSeq: Number(row.GlobalSeq),
    year: Number(row.Year),
    order: Number(row.SeqInYear),
    author: String(row.Author || "").trim(),
    title: String(row.Work || "").trim(),
    selection: String(row.PlanSelection || "").trim(),
    beforeReading: String(row.BeforeReading || "").trim(),
    duringReading: String(row.DuringReading || "").trim(),
    afterReading: String(row.AfterReading || "").trim(),
    hook: String(row.Hook || "").trim(),
    resourceTitles: String(row.ResourceTitles || "").trim(),
    resourceUrls: String(row.ResourceURLs || "").trim(),
    themes: String(row.Themes || "").trim()
  };
}

function findReadingGuide(year, order, author, title, selection){
  const lookup = state.readingGuideLookup;
  if (!lookup) return null;
  const exactKey = readingGuideKey({ year, order, author, title, selection });
  const looseKey = readingGuideKey({ year, order, author, title, selection: "" });
  const yearAuthorTitleKey = readingGuideIdentityKey({ year, author, title });
  const authorTitleKey = readingGuideAuthorTitleKey({ author, title });
  const yearTitleKey = `${Number(year) || ""}|${normalizeGuideKeyPart(title)}`;
  const titleOnlyKey = normalizeGuideKeyPart(title);
  return lookup.exact.get(exactKey)
    || lookup.loose.get(looseKey)
    || lookup.byYearAuthorTitle.get(yearAuthorTitleKey)
    || lookup.byAuthorTitle.get(authorTitleKey)
    || lookup.byYearTitle.get(yearTitleKey)
    || lookup.byTitle.get(titleOnlyKey)
    || findBestReadingGuide(lookup.rows || [], year, author, title);
}

function readingGuideTokenScore(a, b){
  const aTokens = new Set(normalizeGuideKeyPart(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalizeGuideKeyPart(b).split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const token of aTokens){
    if (bTokens.has(token)) overlap++;
  }
  return Math.max(
    overlap / Math.max(aTokens.size, bTokens.size),
    overlap / Math.min(aTokens.size, bTokens.size)
  );
}

function findBestReadingGuide(rows, year, author, title){
  let best = null;
  for (const row of rows){
    const sameYear = Number(row.year) === Number(year);
    const sameAuthor = normalizeGuideAuthor(row.author) === normalizeGuideAuthor(author)
      || normalizeGuideAuthor(author).endsWith(` ${normalizeGuideAuthor(row.author)}`)
      || normalizeGuideAuthor(row.author).endsWith(` ${normalizeGuideAuthor(author)}`);
    const titleScore = readingGuideTokenScore(row.title, title);
    if (titleScore < 0.72) continue;
    const score = titleScore + (sameAuthor ? 0.35 : 0) + (sameYear ? 0.15 : 0);
    if (!best || score > best.score) best = { row, score };
  }
  return best ? best.row : null;
}

function normalizeForMatch(text){
  // Normalize text for matching between bookclub.json and library.json
  return String(text || "").toLowerCase().trim()
    .replace(/^the\s+/i, '')
    .replace(/^a\s+/i, '')
    .replace(/^an\s+/i, '');
}

function findCatalogMeta(author, title){
  // Look up sourceUrl and publication date from project catalog
  if (!state.projectCatalog?.length) return { sourceUrl: "", publishedYear: null };
  
  const normalizedTitle = normalizeForMatch(title);
  const normalizedAuthor = normalizeForMatch(author);
  
  // Try to find matching book in catalog
  for (const book of state.projectCatalog){
    const bookTitle = normalizeForMatch(book.title);
    const bookAuthor = normalizeForMatch(book.author);
    
    // Match by author and title
    if (normalizedAuthor && bookAuthor && 
        normalizedAuthor === bookAuthor && 
        normalizedTitle === bookTitle){
      return {
        sourceUrl: String(book.sourceUrl || ""),
        publishedYear: Number.isFinite(Number(book.date)) ? Number(book.date) : null
      };
    }
    
    // Match by title only if no author or author matches
    if (normalizedTitle === bookTitle){
      if (!normalizedAuthor || !bookAuthor || normalizedAuthor === bookAuthor){
        return {
          sourceUrl: String(book.sourceUrl || ""),
          publishedYear: Number.isFinite(Number(book.date)) ? Number(book.date) : null
        };
      }
    }
  }
  
  return { sourceUrl: "", publishedYear: null };
}

function flattenPlan(){
  const flat = [];
  const years = state.plan.years || [];
  for (const y of years){
    const yearNum = Number(y.year);
    const readings = y.readings || [];
    for (const r of readings){
      const order = Number(r.order);
      const tier = String(r.tier || "").toLowerCase();
      const marker = r.marker ?? "";
      const author = String(r.author || "").trim();

      const works = Array.isArray(r.works) ? r.works : [];
      for (const w of works){
        const title = String(w.title || "").trim();
        const selection = w.selection ? String(w.selection).trim() : "";
        const selections = Array.isArray(w.selections) ? w.selections.map(s=>String(s).trim()).filter(Boolean) : null;
        const greatIdeas = Array.isArray(w.great_ideas) ? w.great_ideas.map(s=>String(s).trim()).filter(Boolean) : [];
        const customTags = Array.isArray(w.custom_tags) ? w.custom_tags.map(s=>String(s).trim()).filter(Boolean) : [];
        const blackBox = w.black_box || null;
        // Look up sourceUrl and publication year from project catalog instead of bookclub.json
        const catalogMeta = findCatalogMeta(author, title);
        const readingGuide = findReadingGuide(yearNum, order, author, title, selection);

        const key = workKey({year:yearNum, order, tier, author, title, selection, selections});
        const search = normalizeText(`${author} ${title} ${selection} ${(selections||[]).join(" ")} ${(greatIdeas||[]).join(" ")} ${(customTags||[]).join(" ")}`);

        flat.push({
          year: yearNum,
          order,
          flatIndex: flat.length,
          tier,
          marker,
          author,
          work: { title, selection, selections },
          key,
          search,
          sourceUrl: catalogMeta.sourceUrl,
          publishedYear: catalogMeta.publishedYear,
          greatIdeas,
          customTags,
          blackBox,
          readingGuide
        });
      }
    }
  }
  state.flatWorks = flat;
}

function buildLibraryWorks(){
  // Aggregate by Author + Title (unique library cards)
  const map = new Map();

  for (const fw of state.flatWorks){
    const author = fw.author || "Unknown";
    const title = fw.work.title || "Untitled";
    const libKey = `${author}||${title}`.toLowerCase();
    if (!map.has(libKey)){
      map.set(libKey, {
        libKey,
        id: `lib_${hash32(libKey)}`,
        author,
        title,
        hasCore:false,
        hasSupplemental:false,
        occurrences: [], // { year, order, tier, marker, key, selection, selections }
        search: normalizeText(`${author} ${title}`),
        sourceUrl: "",
        publishedYear: null,
        greatIdeas: [],
        customTags: [],
        blackBox: null
      });
    }
    const item = map.get(libKey);
    if (fw.tier === "core") item.hasCore = true;
    if (fw.tier === "supplemental") item.hasSupplemental = true;
    // Pick up sourceUrl and publishedYear from any occurrence (prefer first non-empty)
    if (!item.sourceUrl && fw.sourceUrl) item.sourceUrl = fw.sourceUrl;
    if (item.publishedYear === null && Number.isFinite(fw.publishedYear)) item.publishedYear = fw.publishedYear;
    // Merge greatIdeas, customTags, blackBox
    for (const idea of (fw.greatIdeas || [])) {
      if (!item.greatIdeas.includes(idea)) item.greatIdeas.push(idea);
    }
    for (const tag of (fw.customTags || [])) {
      if (!item.customTags.includes(tag)) item.customTags.push(tag);
    }
    if (!item.blackBox && fw.blackBox) item.blackBox = fw.blackBox;
    // Update search to include ideas and tags
    item.search = normalizeText(`${author} ${title} ${(item.greatIdeas||[]).join(" ")} ${(item.customTags||[]).join(" ")}`);

    item.occurrences.push({
      year: fw.year,
      order: fw.order,
      tier: fw.tier,
      marker: fw.marker,
      key: fw.key,
      selection: fw.work.selection || "",
      selections: fw.work.selections || null
    });
  }

  const arr = Array.from(map.values());
  for (const it of arr){
    it.occurrences.sort((a,b)=> a.year-b.year || a.order-b.order);
  }
  state.libraryWorks = arr;
}

function buildGreatIdeasUniverse(){
  const set = new Set();
  for (const fw of state.flatWorks){
    for (const idea of (fw.greatIdeas || [])) set.add(idea);
  }
  state.greatIdeasUniverse = Array.from(set).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:"base" }));
  const opts = state.greatIdeasUniverse.map(idea => `<option value="${escapeHtml(idea)}">${escapeHtml(idea)}</option>`).join("");
  const greatIdeaSelEl = $("#greatIdeaSel");
  if (greatIdeaSelEl){
    greatIdeaSelEl.innerHTML = `<option value="all">All Ideas</option>${opts}`;
    greatIdeaSelEl.value = state.filters.greatIdea;
  }
  const libGreatIdeaSelEl = $("#libGreatIdeaSel");
  if (libGreatIdeaSelEl){
    libGreatIdeaSelEl.innerHTML = `<option value="all">All Ideas</option>${opts}`;
    libGreatIdeaSelEl.value = state.filters.libGreatIdea;
  }
}

function fillYearOptions(){
  state.availableYears = (state.plan.years || []).map(y=>Number(y.year)).filter(n=>Number.isFinite(n)).sort((a,b)=>a-b);
  if (state.availableYears.length){
    state.filters.year = String(state.availableYears[0]);
  }
  updateYearStepper();
}

function updateYearStepper(){
  const isAllYears = state.filters.year === "all";
  $("#yearDisplay").textContent = isAllYears ? "ALL" : `Year ${state.filters.year}`;
  $("#yearPrev").disabled = isAllYears;
  $("#yearNext").disabled = isAllYears;
  $("#yearPrev").setAttribute("aria-disabled", String(isAllYears));
  $("#yearNext").setAttribute("aria-disabled", String(isAllYears));
  const allYearsCheckbox = $("#showAllYears");
  if (allYearsCheckbox) allYearsCheckbox.checked = isAllYears;
}

function buildTagsUniverse(){
  // Keep notes "as they are": book_tag = title
  const set = new Set();
  for (const fw of state.flatWorks){
    if (fw.work.title) set.add(fw.work.title);
  }
  state.tagsUniverse = Array.from(set).sort((a,b)=>a.localeCompare(b, undefined, { sensitivity:"base" }));

  $("#noteTagFilter").innerHTML =
    `<option value="all">All</option>` +
    state.tagsUniverse.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");

  $("#editBookTag").innerHTML =
    state.tagsUniverse.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}
function wirePlanDelegation(){
  const grid = $("#planGrid");

  grid.onclick = (e) => {
    // Tap on the work title area (workMain) toggles drawer
    if (!e.target.closest("[data-action]") && !e.target.closest("input")) {
      const main = e.target.closest(".workMain");
      if (main) {
        const row = main.closest(".workRow");
        if (row) {
          const was = row.classList.contains("active");
          grid.querySelectorAll(".workRow.active").forEach(r => {
            r.classList.remove("active");
            const prevInner = r.querySelector(".bookDetailsPanel > div");
            if (prevInner) { prevInner.innerHTML = ""; prevInner._sources = null; prevInner._sourceIdx = 0; }
          });
          if (!was) {
            row.classList.add("active");
            const section = row.querySelector(".bookDetailsSection");
            if (section) loadBookDetails(section);
          }
          return;
        }
      }
    }

    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;

    // Handle column picker toggle (table header button)
    if (action === "toggleColPicker") {
      e.stopPropagation();
      toggleColPickerPanel();
      return;
    }

    // Handle task dropdown actions
    if (action === "toggleTaskDropdown" || action === "selectTaskOption") {
      handleTaskDropdownClickEvent(e);
      return;
    }

    if (action === "cycleBookDetails"){
      handleCycleBookDetails(btn);
      return;
    }

    if (action === "linkedNotesToggle"){
      handleLinkedNotesToggle(btn);
      return;
    }

    if (action === "gotoLibraryGreatIdea"){
      gotoLibraryGreatIdea(btn.dataset.idea || "");
      return;
    }

    if (action === "openLinkedNote"){
      const noteId = btn.dataset.noteid;
      if (noteId){ openDrawer("notes"); startEditNote(noteId); }
      return;
    }

    if (action === "markBlockDone" || action === "markBlockUndone"){
      const block = btn.closest(".readingBlock");
      if (!block) return;
      const workRows = Array.from(block.querySelectorAll(".workRow"));
      for (const row of workRows){
        const key = row.dataset.workkey;
        state.checks[key] = (action === "markBlockDone");
      }
      saveChecks(state.checks);
      renderAll();
      return;
    }

    const row = btn.closest(".workRow");
    if (!row) return;

    if (action === "openWikipedia"){
      const title = row.dataset.book || "";
      const wikiTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
      window.open(`https://en.wikipedia.org/wiki/${wikiTitle}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openWikiSearch"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      const statusKey = getCardStatusKey(author, title);
      const currentTask = getCardTask(statusKey).task;
      const taskTerms = TASK_SEARCH_TERMS[currentTask]?.wikisearch || "";
      const q = encodeURIComponent([title, author, taskTerms].filter(Boolean).join(" "));
      window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${q}`, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "toggleLearningGoals" || action === "toggleYouTubeGoals") {
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      const platform = btn.dataset.platform || (action === "toggleYouTubeGoals" ? "youtube" : "google");
      const statusKey = getCardStatusKey(author, title);
      const currentTask = getCardTask(statusKey).task;
      const taskHint = TASK_SEARCH_TERMS[currentTask]?.[platform] || "";
      
      // Try to get works from the reading block
      const readingBlock = row.closest(".readingBlock");
      let works = [];
      if (readingBlock) {
        // Get all work rows in this reading block
        const workRows = readingBlock.querySelectorAll(".workRow");
        works = Array.from(workRows).map(wr => wr.dataset.book || "").filter(Boolean);
      }
      
      closeLearningGoalDrawers();
      showSearchSettingsModal({ title, author, platform, goal: "", works, taskHint });
      return;
    }
    if (action === "openLearningGoal") {
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      const platform = btn.dataset.platform || "youtube";
      const goal = btn.dataset.goal || "";
      closeLearningGoalDrawers();
      window.open(buildLearningSearchUrl({ title, author, platform, goal }), "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "openGoogle") {
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      closeLearningGoalDrawers();
      window.open(buildLearningSearchUrl({ title, author, platform: "google", goal: "" }), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openYouTube") {
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      const q = encodeURIComponent(`${title} ${author}${YOUTUBE_SEARCH_SUFFIX}`.trim());
      window.open(`https://duckduckgo.com/?q=${q}&iax=videos&ia=videos`, "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openAudiobooks") {
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      window.open(buildAudiobookSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openFreeBook"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      window.open(buildFreeBookSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openBuyBook"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      window.open(buildBuyBookSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openGoodreads"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      window.open(buildGoodreadsSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openOutlines"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      window.open(buildOutlinesSearchUrl(title, author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openBiography") {
      const author = row.dataset.author || "";
      window.open(buildBiographySearchUrl(author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openContext") {
      const author = row.dataset.author || "";
      window.open(buildContextSearchUrl(author), "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "openLibraryForWork"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      gotoLibraryWork(author, title);
      return;
    }

    if (action === "newNoteFromWork" || action === "openNotesForBook"){
      const ctx = getWorkContextFromRow(row);

      if (action === "newNoteFromWork"){
        openDrawer("notes");
        startNewNote(ctx);
      } else {
        openDrawer("notes");
        state.notesUI.tag = ctx.book_tag;
        $("#noteTagFilter").value = ctx.book_tag;
        renderNotesList();
      }
      return;
    }

    if (action === "openDeskWork"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      openConversationDesk({ linkedBook: title, linkedAuthor: author });
      return;
    }
  };

  grid.onchange = (e) => {
    if (handleReadingStageCheckboxChangeEvent(e)){
      return;
    }
    if (handleCardStatusSelectChangeEvent(e)){
      return;
    }
    if (handleCardTaskControlChangeEvent(e)){
      return;
    }
    if (handleCardDateInputChangeEvent(e)){
      return;
    }
    const cb = e.target.closest('input[type="checkbox"][data-action="toggleComplete"]');
    if (!cb) return;
    const row = cb.closest(".workRow");
    const key = row.dataset.workkey;
    state.checks[key] = cb.checked;
    saveChecks(state.checks);
    renderAll();
  };
  grid.addEventListener("focus", handleFinishedDateFocusEvent, true);
  grid.addEventListener("blur",  handleFinishedDateBlurEvent,  true);

  // (year expand/collapse removed — single year view)
}
document.addEventListener("wheel", (e)=> {
  if (!e.shiftKey) return;
  const wrap = e.target.closest(".planTableWrap");
  if (!wrap) return;
  e.preventDefault();
  wrap.scrollLeft += e.deltaY || e.deltaX;
}, { passive: false });
export {
  loadPlan,
  renderPlan,
  toggleColPickerPanel,
  toggleStandaloneColPicker,
  updateYearStepper,
  applyPlanFilters,
  groupByYear,
  flattenPlan,
  buildLibraryWorks,
  buildGreatIdeasUniverse,
  fillYearOptions,
  buildTagsUniverse,
  loadReadingGuides,
  wirePlanDelegation
};
