/* views/plan.js — Ten-Year Plan view: renderPlan, year/work row templates, table view, column picker, condensed mode */
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
      <td class="td-work" data-col="work"${hiddenColStyle("work")}>${escapeHtml(title)}</td>
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
        <p class="workTitle">${escapeHtml(title)}</p>
        <div class="workSub">
          <div class="tagRow">
            <span class="pill">Year ${escapeHtml(w.year)}</span>
            <span class="pill">Order ${escapeHtml(w.order)}</span>
            <span class="pill">${escapeHtml(w.tier)}</span>
            <span class="pill">Notes ${escapeHtml(noteCount)}</span>
            <span class="pill">${escapeHtml(wrStatusLabel)}</span>
            ${wrTaskOpt ? `<span class="pill">${escapeHtml(wrTaskOpt.label)}</span>` : ""}
            ${(w.greatIdeas||[]).map(idea => `<span class="pill pillIdea">${escapeHtml(idea)}</span>`).join("")}
            ${(w.customTags||[]).map(tag => `<span class="pill pillTag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          ${subLines.length ? `<div>${subLines.map(escapeHtml).join("<br>")}</div>` : ""}
        </div>
      </div>

      <div class="workDrawer"><div>
        <div class="drawerPanelRow">
          ${renderBookDetailsSection(w.author, title)}
          ${w.blackBox ? renderBlackBoxSection(w.blackBox) : ""}
        </div>
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
          <button class="btn" type="button" data-action="openDiscussWork" data-btn-group="always" aria-label="Discuss" title="Discuss">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span class="btn-label">Discuss</span>
          </button>
         </div>
        </div>
      </div></div>
    </div>
  `;
}
