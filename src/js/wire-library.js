/* wire-library.js — wireLibraryDelegation(): click/change handler for library card actions */
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

    if (btn.dataset.action === "openDiscussLib"){
      openCommentsDrawer(title, author);
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

