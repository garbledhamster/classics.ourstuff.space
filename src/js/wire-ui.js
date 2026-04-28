/* wire-ui.js — wireUI(): one-time binding of nav tabs, dark mode, search inputs, export, notes drawer, etc. */

/* =========================================================
   WIRE UI
   ========================================================= */
function wireUI(){
  // Tabs
  $("#tabLibrary").addEventListener("click", ()=> setView("library"));
  $("#tabPlan").addEventListener("click", ()=> setView("plan"));
  $("#tabAuthors").addEventListener("click", ()=> setView("authors"));
  // Global drawer buttons
  $("#openNotesBtn").addEventListener("click", () => openDrawer("notes"));
  $("#closeNotesBtn").addEventListener("click", closeDrawer);
  $("#closeCommentsBtn").addEventListener("click", closeDrawer);

  // Great Conversation — comment type pills
  $("#commentTypeRow").addEventListener("click", (e) => {
    const pill = e.target.closest(".commentTypePill");
    if (!pill) return;
    $("#commentTypeRow").querySelectorAll(".commentTypePill").forEach(p => { p.classList.remove("selected"); });
    pill.classList.add("selected");
    state.commentsUI.selectedType = pill.dataset.type;
  });

  // Great Conversation — submit comment
  $("#submitCommentBtn").addEventListener("click", submitBookComment);

  // Great Conversation — delete comment (event delegation on comments list)
  $("#commentsList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='deleteComment']");
    if (!btn) return;
    const commentId = btn.dataset.commentid;
    if (commentId) deleteBookComment(commentId);
  });

  $("#overlay").addEventListener("click", () => {
    closeDrawer();
  });

  // Authentication button - handles both login and logout
  $("#authBtn").addEventListener("click", () => {
    if (currentUser) {
      handleLogout();
    } else {
      showLoginModal();
    }
  });

  // Manual sync button
  $("#manualSyncBtn").addEventListener("click", async () => {
    if (state.currentUser && !state.sync.syncing) {
      const btn = $("#manualSyncBtn");
      btn.disabled = true;
      try {
        await performFullSync(state.currentUser.uid);
        renderAll();
      } finally {
        btn.disabled = false;
      }
    }
  });
  
  $("#closeLoginModalBtn").addEventListener("click", hideLoginModal);
  $("#loginSubmitBtn").addEventListener("click", handleLogin);
  $("#showSignupBtn").addEventListener("click", showSignupModal);
  
  $("#closeSignupModalBtn").addEventListener("click", hideSignupModal);
  $("#signupSubmitBtn").addEventListener("click", handleSignup);
  $("#showLoginBtn").addEventListener("click", () => {
    hideSignupModal();
    showLoginModal();
  });

  // Search Settings Modal
  $("#closeSearchSettingsModalBtn").addEventListener("click", hideSearchSettingsModal);
  $("#searchSettingsCancelBtn").addEventListener("click", hideSearchSettingsModal);
  $("#searchSettingsOpenBtn").addEventListener("click", () => {
    const url = buildSearchUrlFromSettings();
    hideSearchSettingsModal();
    window.open(url, "_blank", "noopener,noreferrer");
  });
  
  // Update search preview when settings change
  $("#includeTitle").addEventListener("change", updateSearchPreview);
  $("#includeAuthor").addEventListener("change", updateSearchPreview);
  $("#includeSelectedWorks").addEventListener("change", (e) => {
    const container = $("#selectedWorksContainer");
    container.style.display = e.target.checked ? "block" : "none";
    updateSearchPreview();
  });
  $("#selectedWorksDropdown").addEventListener("change", updateSearchPreview);
  $("#customSearch").addEventListener("input", updateSearchPreview);
  
  // Handle Bloom's taxonomy button clicks (event delegation)
  $("#bloomsButtonsContainer").addEventListener("click", (e) => {
    const btn = e.target.closest(".btnBloom");
    if (!btn) return;
    
    const level = btn.dataset.bloomsLevel;
    
    // Toggle: if clicking the active button, deselect it
    if (searchSettingsModalContext.bloomsLevel === level) {
      searchSettingsModalContext.bloomsLevel = null;
      btn.classList.remove("active");
    } else {
      // Deselect all other buttons
      $("#bloomsButtonsContainer").querySelectorAll(".btnBloom").forEach(b => { b.classList.remove("active"); });
      // Select this button
      searchSettingsModalContext.bloomsLevel = level;
      btn.classList.add("active");
    }
    
    updateSearchPreview();
  });

  // Handle Enter key in login/signup forms
  $("#loginPassword").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  $("#signupPasswordConfirm").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSignup();
  });

  // Close modals with backdrop click
  $("#modalBackdrop").addEventListener("click", () => {
    hideLoginModal();
    hideSignupModal();
    hideSearchSettingsModal();
    if (window._closeTimerModal) window._closeTimerModal();
  });

  document.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && state.drawer.open) closeDrawer();
    if (e.key === "Escape" && $("#loginModal").classList.contains("open")) hideLoginModal();
    if (e.key === "Escape" && $("#signupModal").classList.contains("open")) hideSignupModal();
    if (e.key === "Escape" && $("#timerModal").classList.contains("open") && window._closeTimerModal) window._closeTimerModal();
    if (e.key === "Escape") closeLearningGoalDrawers(document, { restoreFocus: true });
    if (e.key === "Escape") closeAllTaskDropdowns();
  });

  // Close learning goal drawers when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".ytGoalWrap")) {
      closeLearningGoalDrawers(document, { restoreFocus: false });
    }
    if (!e.target.closest(".taskDrop")) {
      closeAllTaskDropdowns();
    }
  });

  // Library filters
  $("#libQ").addEventListener("input", e => { state.filters.libQ = e.target.value; state.filters.libPage = 1; renderLibrary(); });
  $("#libGreatIdeaSel").addEventListener("change", e => { state.filters.libGreatIdea = e.target.value; state.filters.libPage = 1; renderLibrary(); });

  // Authors filters
  $("#authorsQ").addEventListener("input", e => { state.filters.authorsQ = e.target.value; state.filters.authorsPage = 1; renderAuthors(); });
  $("#authorsResetBtn").addEventListener("click", ()=> {
    state.filters.authorsQ = "";
    state.filters.authorsLetterFilter = "";
    state.filters.authorsPage = 1;
    state.filters.authorsPageSize = 10;
    $("#authorsQ").value = "";
    renderAuthors();
  });

  // Library ABC bar + pagination (wired once; content is replaced by renderLibrary)
  $("#libAbcBar").onclick = (e) => {
    const btn = e.target.closest(".abcBtn");
    if (!btn || btn.disabled) return;
    state.filters.libLetterFilter = btn.dataset.letter;
    state.filters.libPage = 1;
    renderLibrary();
  };
  $("#libPagination").onclick = (e) => {
    const btn = e.target.closest("[data-paction]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.paction === "prev") state.filters.libPage = Math.max(1, state.filters.libPage - 1);
    if (btn.dataset.paction === "next") state.filters.libPage += 1;
    renderLibrary();
  };
  $("#libPagination").onchange = (e) => {
    if (!e.target.closest(".pageSizeSel")) return;
    state.filters.libPageSize = Number(e.target.value);
    state.filters.libPage = 1;
    renderLibrary();
  };

  // Authors ABC bar + pagination (wired once; content is replaced by renderAuthors)
  $("#authorsAbcBar").onclick = (e) => {
    const btn = e.target.closest(".abcBtn");
    if (!btn || btn.disabled) return;
    state.filters.authorsLetterFilter = btn.dataset.letter;
    state.filters.authorsPage = 1;
    renderAuthors();
  };
  $("#authorsPagination").onclick = (e) => {
    const btn = e.target.closest("[data-paction]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.paction === "prev") state.filters.authorsPage = Math.max(1, state.filters.authorsPage - 1);
    if (btn.dataset.paction === "next") state.filters.authorsPage += 1;
    renderAuthors();
  };
  $("#authorsPagination").onchange = (e) => {
    if (!e.target.closest(".pageSizeSel")) return;
    state.filters.authorsPageSize = Number(e.target.value);
    state.filters.authorsPage = 1;
    renderAuthors();
  };

  // Plan filters
  $("#q").value = state.filters.q;
  $("#sortSel").value = state.filters.sort;
  $("#q").addEventListener("input", e => { state.filters.q = e.target.value; renderPlan(); });
  $("#yearPrev").addEventListener("click", () => {
    const idx = state.availableYears.indexOf(Number(state.filters.year));
    if (idx > 0){ state.filters.year = String(state.availableYears[idx - 1]); updateYearStepper(); renderPlan(); }
  });
  $("#yearNext").addEventListener("click", () => {
    const idx = state.availableYears.indexOf(Number(state.filters.year));
    if (idx < state.availableYears.length - 1){ state.filters.year = String(state.availableYears[idx + 1]); updateYearStepper(); renderPlan(); }
  });
  $("#showAllYears").addEventListener("change", (e) => {
    if (e.target.checked){
      if (state.filters.year !== "all") state.ui.lastPlanYear = state.filters.year;
      state.filters.year = "all";
    } else {
      const hasSavedYear = !!state.ui.lastPlanYear && state.availableYears.includes(Number(state.ui.lastPlanYear));
      let fallbackYear = "all";
      if (hasSavedYear) {
        fallbackYear = state.ui.lastPlanYear;
      } else if (state.availableYears.length > 0) {
        fallbackYear = String(state.availableYears[0]);
      }
      state.filters.year = fallbackYear;
    }
    updateYearStepper();
    renderPlan();
  });
  $("#greatIdeaSel").addEventListener("change", e => { state.filters.greatIdea = e.target.value; renderPlan(); });
  $("#sortSel").addEventListener("change", e => { state.filters.sort = e.target.value; renderPlan(); });

  // View-mode cycle: default → table → default
  $("#planViewModeBtn").addEventListener("click", () => {
    const modes = ["default", "table"];
    const cur = state.filters.planViewMode || "default";
    state.filters.planViewMode = modes[(modes.indexOf(cur) + 1) % modes.length];
    renderPlan();
  });

  // Close column picker when clicking outside the th-colpicker header cell
  document.addEventListener("click", (e) => {
    const panel = document.querySelector("#planGrid .colPickerPanel");
    if (panel && !panel.hasAttribute("hidden") && !e.target.closest(".th-colpicker")) toggleColPickerPanel(false);
    const standalonePanel = document.getElementById("planColPickerPanel");
    if (standalonePanel && !standalonePanel.hasAttribute("hidden") && !e.target.closest("#planColPickerWrap")) toggleStandaloneColPicker(false);
  });

  // Standalone column picker button
  const planColPickerBtn = document.getElementById("planColPickerBtn");
  if (planColPickerBtn) {
    planColPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStandaloneColPicker();
    });
  }

  // Handle column visibility checkboxes (delegated on #planGrid and standalone panel)
  function applyColToggle(colId, checked){
    if (checked){
      state.ui.tableHiddenCols.delete(colId);
    } else {
      state.ui.tableHiddenCols.add(colId);
    }
    saveTableHiddenCols(state.ui.tableHiddenCols);
    // Update column visibility directly without re-rendering (keeps panel open)
    const escapedColId = CSS.escape(colId);
    const grid = $("#planGrid");
    grid.querySelectorAll(`[data-col="${escapedColId}"]`).forEach(el => {
      el.style.display = state.ui.tableHiddenCols.has(colId) ? "none" : "";
    });
    // Sync checkboxes across all col picker panels
    document.querySelectorAll(`[data-action="toggleTableCol"][data-col-id="${escapedColId}"]`).forEach(cb => {
      cb.checked = checked;
    });
  }
  $("#planGrid").addEventListener("change", (e) => {
    const cb = e.target.closest('[data-action="toggleTableCol"]');
    if (!cb) return;
    const colId = cb.dataset.colId;
    if (!colId) return;
    applyColToggle(colId, cb.checked);
  });
  const planColPickerPanel = document.getElementById("planColPickerPanel");
  if (planColPickerPanel) {
    planColPickerPanel.addEventListener("change", (e) => {
      const cb = e.target.closest('[data-action="toggleTableCol"]');
      if (!cb) return;
      const colId = cb.dataset.colId;
      if (!colId) return;
      applyColToggle(colId, cb.checked);
    });
  }

  $("#resetChecksBtn").addEventListener("click", () => {
    state.filters.q = "";
    state.filters.greatIdea = "all";
    state.filters.sort = "sort_check";
    const fallbackYear = state.availableYears.length ? String(state.availableYears[0]) : "all";
    state.filters.year = fallbackYear;
    state.ui.lastPlanYear = fallbackYear;
    const qInput = $("#q");
    const greatIdeaSel = $("#greatIdeaSel");
    const sortSel = $("#sortSel");
    const showAllYears = $("#showAllYears");
    if (qInput) qInput.value = "";
    if (greatIdeaSel) greatIdeaSel.value = "all";
    if (sortSel) sortSel.value = "sort_check";
    if (showAllYears) showAllYears.checked = false;
    updateYearStepper();
    renderPlan();
  });

  $("#exportProgressBtn").addEventListener("click", showExportModal);

  $("#resetProfileBtn").addEventListener("click", () => {
    showConfirm("Reset your Classics profile? This will permanently delete all reading progress, notes, and settings for this site. This cannot be undone.", "Reset Classics Profile").then(async confirmed => {
      if (!confirmed) return;
      // Clear all site-specific localStorage keys
      try {
        localStorage.removeItem(LS_CHECKS);
        localStorage.removeItem(LS_NOTES);
        localStorage.removeItem(LS_CARD_STATUS);
        localStorage.removeItem(LS_CARD_DATES);
        localStorage.removeItem(LS_CARD_TASKS);
      } catch(e) {
        console.error('Error clearing localStorage during profile reset:', e);
      }
      // If signed in, delete the Firestore document for this user
      if (state.currentUser && window.firebaseDB && window.firestoreDeleteDoc) {
        try {
          const db = window.firebaseDB;
          const userRef = window.firestoreDoc(db, 'userPrivate', state.currentUser.uid);
          await window.firestoreDeleteDoc(userRef);
        } catch(e) {
          console.error('Error deleting Firestore profile:', e);
        }
      }
      // Reset in-memory state
      state.checks = {};
      state.cardStatuses = {};
      state.cardDates = {};
      state.cardTasks = {};
      state.notes = [];
      state.sync.lastSync = null;
      state.sync.syncing = false;
      state.sync.error = null;
      renderAll();
      showAlert("Classics profile has been reset.");
    });
  });

  $("#noteSearch").addEventListener("input", (e)=>{ state.notesUI.search = e.target.value; renderNotesList(); });
  $("#noteTagFilter").addEventListener("change", (e)=>{ state.notesUI.tag = e.target.value; renderNotesList(); });

  $("#newNoteBtn").addEventListener("click", () => startNewNote({}));
  $("#exportNotesBtn").addEventListener("click", exportNotes);
  $("#importNotesBtn").addEventListener("click", ()=> $("#importFile").click());
  $("#importFile").addEventListener("change", importNotesFile);

  $("#saveNoteBtn").addEventListener("click", saveEditorNote);
  $("#deleteNoteBtn").addEventListener("click", deleteEditorNote);
  $("#archiveNoteBtn").addEventListener("click", archiveEditorNote);
  $("#cancelEditBtn").addEventListener("click", hideEditor);

  // Toggle archived/active notes view
  $("#toggleArchivedBtn").addEventListener("click", () => {
    state.notesUI.showArchived = !state.notesUI.showArchived;
    // Clear selection when switching views
    state.notesUI.selectedIds = new Set();
    state.notesUI.selectMode = false;
    renderNotesList();
  });

  // Multi-select controls
  $("#toggleNoteSelectBtn").addEventListener("click", toggleNoteSelectMode);
  $("#selectAllNotesBtn").addEventListener("click", () => {
    const notes = filteredNotes();
    state.notesUI.selectedIds = new Set(notes.map(n => n.id));
    renderNotesList();
  });
  $("#deselectAllNotesBtn").addEventListener("click", () => {
    state.notesUI.selectedIds = new Set();
    renderNotesList();
  });
  $("#deleteSelectedNotesBtn").addEventListener("click", deleteSelectedNotes);
  $("#archiveSelectedNotesBtn").addEventListener("click", archiveSelectedNotes);

}

/* =========================================================
   TABLE HORIZONTAL SCROLL — shift+wheel on desktop
   ========================================================= */
document.addEventListener("wheel", (e)=> {
  if (!e.shiftKey) return;
  const wrap = e.target.closest(".planTableWrap");
  if (!wrap) return;
  e.preventDefault();
  wrap.scrollLeft += e.deltaY || e.deltaX;
}, { passive: false });
