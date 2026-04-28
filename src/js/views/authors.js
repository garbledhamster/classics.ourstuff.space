/* views/authors.js — Great Authors view: build data, filter, render author cards, wire delegation */
/* =========================================================
   GREAT AUTHORS
   ========================================================= */
function buildAuthorsData(){
  // Aggregate unique authors from libraryWorks
  const map = new Map();
  for (const work of state.libraryWorks){
    const author = work.author || "Unknown";
    const key = author.toLowerCase();
    if (!map.has(key)){
      map.set(key, {
        key,
        author,
        works: [],
        totalOccurrences: 0,
        doneOccurrences: 0,
        hasCore: false,
        hasSupplemental: false,
        notesCount: 0,
      });
    }
    const entry = map.get(key);
    entry.works.push(work);
    entry.totalOccurrences += work.occurrences.length;
    entry.doneOccurrences += work.occurrences.reduce((a,o)=> a + (state.checks[o.key] ? 1 : 0), 0);
    if (work.hasCore) entry.hasCore = true;
    if (work.hasSupplemental) entry.hasSupplemental = true;
    entry.notesCount += state.notes.filter(n => n.book_tag === work.title || n.author === author).length;
  }
  return Array.from(map.values());
}

function filteredAuthors(){
  const q = normalizeText(state.filters.authorsQ);
  let items = buildAuthorsData();
  if (q){
    items = items.filter(it => normalizeText(it.author).includes(q));
  }
  items.sort((a,b) => a.author.localeCompare(b.author, undefined, { sensitivity:"base" }));
  return items;
}

function authorCardHtml(it){
  const allDone = it.totalOccurrences > 0 && it.doneOccurrences === it.totalOccurrences;

  const tierPills = [
    it.hasSupplemental ? `<span class="pill">Has supplemental</span>` : ""
  ].filter(Boolean).join("");

  const workPills = it.works.slice(0, 12).map(w => {
    return `<button class="btn btnGhost" type="button"
              data-action="gotoLibraryForAuthorWork"
              data-libkey="${escapeHtml(w.libKey)}"
              title="${escapeHtml(w.title)}"
            >${escapeHtml(w.title)}</button>`;
  }).join("");
  const moreWorks = it.works.length > 12 ? `<span class="pill">+${escapeHtml(it.works.length - 12)} more</span>` : "";

  return `
    <section class="libCard" data-author="${escapeHtml(it.author)}">
      <div class="libHead">
        <div style="min-width:0;">
          <p class="libTitle">${escapeHtml(it.author)}</p>
          <div class="tagRow">
            <span class="pill">${escapeHtml(it.doneOccurrences)}/${escapeHtml(it.totalOccurrences)} done</span>
            <span class="pill">${allDone ? "Complete" : "Incomplete"}</span>
            <span class="pill">${escapeHtml(it.works.length)} work${it.works.length === 1 ? "" : "s"}</span>
            <span class="pill">Notes ${escapeHtml(it.notesCount)}</span>
            ${tierPills}
          </div>
        </div>
      </div>

      <div class="help">Works (click to view in library):</div>
      <div class="occList">
        ${workPills}
        ${moreWorks}
      </div>

      <div class="libDrawer"><div>
        <div class="libActions">
          <button class="btn" type="button" data-action="openWikipediaAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="7 8 9.5 16 12 11 14.5 16 17 8"></polyline></svg>
            Wikipedia
          </button>
          <button class="btn" type="button" data-action="openWikiSearchAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7.5"></circle><path d="M11 3.5a10 10 0 0 1 2.5 7.5 10 10 0 0 1-2.5 7.5 10 10 0 0 1-2.5-7.5 10 10 0 0 1 2.5-7.5z"></path><line x1="3.5" y1="11" x2="18.5" y2="11"></line><path d="m21 21-4-4"></path></svg>
            WikiSearch
          </button>
          <button class="btn" type="button" data-action="openGoogleAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
            Search
          </button>
          <button class="btn" type="button" data-action="openYouTubeAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Videos
          </button>
          <button class="btn" type="button" data-action="openAudiobooksAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
            Audiobooks
          </button>
          <button class="btn" type="button" data-action="openBuyBookAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            Buy Books
          </button>
          <button class="btn" type="button" data-action="openGoodreadsAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            Goodreads
          </button>
          <button class="btn" type="button" data-action="openBiographyAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Biography
          </button>
          <button class="btn" type="button" data-action="openContextAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Context
          </button>
          <button class="btn" type="button" data-action="newNoteAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New note
          </button>
          <button class="btn" type="button" data-action="openNotesAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            Open notes
          </button>
          <button class="btn" type="button" data-action="openDiscussAuthor">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Discuss
          </button>
        </div>
      </div></div>
    </section>
  `;
}

function renderAuthors(){
  const grid = $("#authorsGrid");
  const pagination = $("#authorsPagination");

  // Get all filtered authors (without letter filter)
  const baseItems = filteredAuthors();

  // Render ABC bar
  renderAbcBar("authorsAbcBar", baseItems, authLetterKey, state.filters.authorsLetterFilter);

  // Apply letter filter
  const letter = state.filters.authorsLetterFilter;
  const items = letter ? baseItems.filter(it => authLetterKey(it) === letter) : baseItems;

  // Pagination
  const pageSize = state.filters.authorsPageSize;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (state.filters.authorsPage > totalPages) state.filters.authorsPage = 1;
  const page = state.filters.authorsPage;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  if (!items.length){
    grid.innerHTML = `
      <section class="libCard">
        <div class="libHead">
          <div>
            <p class="libTitle">No matches</p>
            <div class="libAuthor">Try a different search</div>
          </div>
        </div>
        <div class="help">Nothing matched your author search.</div>
      </section>
    `;
    pagination.innerHTML = "";
  } else {
    grid.innerHTML = pageItems.map(authorCardHtml).join("");
    wireAuthorsDelegation();
    pagination.innerHTML = paginationHtml(page, totalPages, pageSize, items.length);
  }
}

function wireAuthorsDelegation(){
  const grid = $("#authorsGrid");

  grid.onclick = (e) => {
    // Tap on the card header (libHead) toggles drawer
    if (!e.target.closest("[data-action]") && !e.target.closest("input")) {
      const head = e.target.closest(".libHead");
      if (head) {
        const card = head.closest(".libCard");
        if (card) {
          const was = card.classList.contains("active");
          grid.querySelectorAll(".libCard.active").forEach(c => { c.classList.remove("active"); });
          if (!was) card.classList.add("active");
          return;
        }
      }
    }

    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const card = btn.closest(".libCard");
    if (!card) return;

    const author = card.dataset.author || "";

    if (btn.dataset.action === "gotoLibraryForAuthorWork"){
      const libKey = btn.dataset.libkey || "";
      // Switch to library view and filter by this author
      state.filters.libQ = author;
      state.filters.libLetterFilter = "";
      // Navigate to the page that contains this specific work
      const filteredItems = filteredLibrary();
      const pageSize = state.filters.libPageSize;
      const idx = filteredItems.findIndex(it => it.libKey === libKey);
      state.filters.libPage = idx !== -1 ? Math.floor(idx / pageSize) + 1 : 1;
      setView("library");
      // Try to scroll to the specific work card
      requestAnimationFrame(() => {
        const el = document.querySelector(`.libCard[data-libkey="${CSS.escape(libKey)}"]`);
        if (el) {
          el.scrollIntoView({ behavior:"smooth", block:"center" });
          flashEl(el);
        }
      });
      return;
    }

    if (btn.dataset.action === "openWikipediaAuthor"){
      const wikiTitle = encodeURIComponent(author.replace(/\s+/g, "_"));
      window.open(`https://en.wikipedia.org/wiki/${wikiTitle}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openWikiSearchAuthor"){
      const q = encodeURIComponent(author);
      window.open(`https://en.wikipedia.org/wiki/Special:Search?search=${q}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openGoogleAuthor"){
      const q = encodeURIComponent(author);
      window.open(`https://duckduckgo.com/?q=${q}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openYouTubeAuthor"){
      const q = encodeURIComponent(`${author}${YOUTUBE_SEARCH_SUFFIX}`.trim());
      window.open(`https://duckduckgo.com/?q=${q}&iax=videos&ia=videos`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openAudiobooksAuthor"){
      window.open(buildAudiobookSearchUrl("", author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openBuyBookAuthor"){
      const buySites = `site:amazon.com OR site:ebay.com OR site:abebooks.com OR site:barnesandnoble.com OR site:thriftbooks.com OR site:bookshop.org`;
      const q = encodeURIComponent(`${author} (${buySites})`.trim());
      window.open(`https://duckduckgo.com/?q=${q}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openGoodreadsAuthor"){
      window.open(buildGoodreadsSearchUrl("", author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openBiographyAuthor"){
      window.open(buildBiographySearchUrl(author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "openContextAuthor"){
      window.open(buildContextSearchUrl(author), "_blank", "noopener,noreferrer");
      return;
    }

    if (btn.dataset.action === "newNoteAuthor"){
      openDrawer("notes");
      startNewNote({ author, book_tag:"", year:"", selection:"" });
      return;
    }

    if (btn.dataset.action === "openNotesAuthor"){
      openDrawer("notes");
      state.notesUI.search = author;
      $("#notesSearch").value = author;
      renderNotesList();
      return;
    }

    if (btn.dataset.action === "openDiscussAuthor"){
      // Use author name as book title to discuss the author's body of work
      openCommentsDrawer(author, author);
      return;
    }
  };
}

