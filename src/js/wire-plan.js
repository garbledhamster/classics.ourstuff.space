/* wire-plan.js — wirePlanDelegation(): click/change handler for plan view actions */
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
            if (prevInner) prevInner.innerHTML = "";
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

    if (action === "openDiscussWork"){
      const title = row.dataset.book || "";
      const author = row.dataset.author || "";
      openCommentsDrawer(title, author);
      return;
    }
  };

  grid.onchange = (e) => {
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
