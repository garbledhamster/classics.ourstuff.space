/* cross-refs.js — Cross-view navigation (gotoPlanWorkKey, gotoLibraryWork), openDrawer/closeDrawer */
/* =========================================================
   CROSS REFERENCES
   ========================================================= */
function gotoPlanWorkKey(workkey){
  if (!workkey) return;

  setView("plan");

  // Switch stepper to the target year then scroll to the work row
  const fw = state.flatWorks.find(x => x.key === workkey);
  if (fw){
    state.filters.year = String(fw.year);
    updateYearStepper();
    renderPlan();
  }

  requestAnimationFrame(() => {
    const id = `wk_${hash32(workkey)}`;
    const el = document.getElementById(id);
    if (el){
      el.scrollIntoView({ behavior:"smooth", block:"start" });
      flashEl(el);
    }
  });
}

function gotoLibraryWork(author, title){
  // Clear letter filter so the target book is not hidden by it
  state.filters.libLetterFilter = "";

  // Determine which page the book is on and navigate there
  const baseItems = filteredLibrary();
  const pageSize = state.filters.libPageSize;
  const libKey = `${author}||${title}`.toLowerCase();
  const idx = baseItems.findIndex(it => it.libKey === libKey);
  if (idx !== -1){
    state.filters.libPage = Math.floor(idx / pageSize) + 1;
  }

  setView("library");
  renderLibrary();

  requestAnimationFrame(() => {
    const id = `lib_${hash32(libKey)}`;
    const el = document.getElementById(id);
    if (el){
      el.scrollIntoView({ behavior:"smooth", block:"start" });
      flashEl(el);
    } else {
      // Fallback: try to find by dataset (in case id mismatch)
      const fallback = document.querySelector(`.libCard[data-libkey="${CSS.escape(libKey)}"]`);
      if (fallback){
        fallback.scrollIntoView({ behavior:"smooth", block:"start" });
        flashEl(fallback);
      }
    }
  });
}

function getWorkContextFromRow(row){
  const book = row.dataset.book || "";
  const author = row.dataset.author || "";
  const year = Number(row.dataset.year) || "";
  const selection = row.dataset.selection || "";
  return { book_tag: book, author, year, selection };
}

/* =========================================================
   DRAWERS
   ========================================================= */
function openDrawer(which){
  state.drawer.open = true;
  state.drawer.which = which;

  $("#overlay").classList.add("open");
  $("#overlay").setAttribute("aria-hidden", "false");

  if (which === "notes"){
    $("#notesDrawer").classList.add("open");
    $("#notesDrawer").setAttribute("aria-hidden", "false");
    $("#notesDrawer").removeAttribute("inert");
    $("#commentsDrawer").classList.remove("open");
    $("#commentsDrawer").setAttribute("aria-hidden", "true");
    $("#commentsDrawer").setAttribute("inert", "");
    renderNotesList();
  } else if (which === "comments") {
    $("#commentsDrawer").classList.add("open");
    $("#commentsDrawer").setAttribute("aria-hidden", "false");
    $("#commentsDrawer").removeAttribute("inert");
    $("#notesDrawer").classList.remove("open");
    $("#notesDrawer").setAttribute("aria-hidden", "true");
    $("#notesDrawer").setAttribute("inert", "");
    hideEditor();
  }
}

function closeDrawer(){
  state.drawer.open = false;
  state.drawer.which = null;

  $("#overlay").classList.remove("open");
  $("#overlay").setAttribute("aria-hidden", "true");

  $("#notesDrawer").classList.remove("open");
  $("#notesDrawer").setAttribute("aria-hidden", "true");
  $("#notesDrawer").setAttribute("inert", "");

  $("#commentsDrawer").classList.remove("open");
  $("#commentsDrawer").setAttribute("aria-hidden", "true");
  $("#commentsDrawer").setAttribute("inert", "");

  hideEditor();
}
