/* render.js — View switching, filtering, renderAll, renderLibrary, pagination/ABC bar helpers */
function setView(view){
  state.view = view;

  $("#libraryView").classList.toggle("on", view === "library");
  $("#planView").classList.toggle("on", view === "plan");
  $("#authorsView").classList.toggle("on", view === "authors");

  $("#tabLibrary").classList.toggle("tabOn", view === "library");
  $("#tabPlan").classList.toggle("tabOn", view === "plan");
  $("#tabAuthors").classList.toggle("tabOn", view === "authors");

  if (view === "library"){
    $("#planName").textContent = "Library";
  } else if (view === "plan"){
    $("#planName").textContent = state.plan?.plan_name || "Ten-Year Plan";
  } else if (view === "authors"){
    $("#planName").textContent = "Great Authors";
  }

  renderAll();
}

/* =========================================================
   FILTERING
   ========================================================= */
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

/* =========================================================
   RENDER
   ========================================================= */

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

function renderAll(){
  if (state.view === "library") renderLibrary();
  else if (state.view === "plan") renderPlan();
  else if (state.view === "authors") renderAuthors();

  // Notes list refresh if open
  if (state.drawer.open && state.drawer.which === "notes"){
    renderNotesList();
  }
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
