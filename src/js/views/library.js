/* views/library.js — Library view: libCardHtml() template; delegation is in render.js (wireLibraryDelegation) */
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
          <p class="libTitle">${escapeHtml(it.title)}</p>
          <div class="libAuthor">${escapeHtml(it.author)}</div>
          <div class="tagRow">
            <span class="pill">${escapeHtml(doneCount)}/${escapeHtml(occ.length)} done</span>
            <span class="pill">${allDone ? "Complete" : "Incomplete"}</span>
            <span class="pill">Notes ${escapeHtml(notesCount)}</span>
            ${tierPills}
            <span class="pill">${escapeHtml(libStatusLabel)}</span>
            ${libTaskOpt ? `<span class="pill">${escapeHtml(libTaskOpt.label)}</span>` : ""}
            ${(it.greatIdeas||[]).map(idea => `<span class="pill pillIdea">${escapeHtml(idea)}</span>`).join("")}
            ${(it.customTags||[]).map(tag => `<span class="pill pillTag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>

      </div>

      <div class="help">Plan occurrences (click a pill to jump):</div>
      <div class="occList">
        ${occPills}
        ${more}
      </div>

      <div class="libDrawer"><div>
        <div class="drawerPanelRow">
          ${renderBookDetailsSection(it.author, it.title)}
          ${it.blackBox ? renderBlackBoxSection(it.blackBox) : ""}
        </div>
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
          <button class="btn" type="button" data-action="openDiscussLib" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Discuss
          </button>
          <button class="btn" type="button" data-action="gotoPlanFirst" data-workkey="${escapeHtml(firstKey)}" data-btn-group="always">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            Go to plan
          </button>
         </div>
        </div>
      </div></div>
    </section>
  `;
}

