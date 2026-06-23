/* reader-routes.js — cross-view navigation, drawers, and render orchestration */
import {
  $,
  flashEl,
  hash32,
  loadConversationDesk,
  state
} from "./foundation.js";
import {
  filteredLibrary,
  renderLibrary
} from "./library-shelf.js";
import {
  renderAuthors
} from "./authors-atlas.js";
import {
  renderPlan,
  updateYearStepper
} from "./reading-plan.js";
import {
  hideEditor,
  openConversationDesk,
  renderConversationDesk,
  renderNotesList
} from "./writing-desks.js";
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

function gotoLibraryGreatIdea(idea){
  const selectedIdea = String(idea || "").trim();
  if (!selectedIdea) return;

  state.filters.libGreatIdea = selectedIdea;
  state.filters.libQ = "";
  state.filters.libLetterFilter = "";
  state.filters.libPage = 1;

  const libQ = $("#libQ");
  const libGreatIdeaSel = $("#libGreatIdeaSel");
  if (libQ) libQ.value = "";
  if (libGreatIdeaSel) libGreatIdeaSel.value = selectedIdea;

  setView("library");
  renderLibrary();

  requestAnimationFrame(() => {
    const firstMatch = document.querySelector(".libCard");
    if (firstMatch){
      firstMatch.scrollIntoView({ behavior:"smooth", block:"start" });
      flashEl(firstMatch);
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
    renderNotesList();
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

  hideEditor();
}



function setView(view){
  state.view = view;

  $("#libraryView")?.classList.toggle("on", view === "library");
  $("#planView")?.classList.toggle("on", view === "plan");
  $("#authorsView")?.classList.toggle("on", view === "authors");
  $("#deskView")?.classList.toggle("on", view === "desk");
  $("#glossaryView")?.classList.toggle("on", view === "glossary");
  $("#getStartedView")?.classList.toggle("on", view === "get-started");

  $("#tabLibrary")?.classList.toggle("tabOn", view === "library");
  $("#tabPlan")?.classList.toggle("tabOn", view === "plan");
  $("#tabAuthors")?.classList.toggle("tabOn", view === "authors");
  $("#tabDesk")?.classList.toggle("tabOn", view === "desk");
  $("#tabGlossary")?.classList.toggle("tabOn", view === "glossary");
  $("#tabGetStarted")?.classList.toggle("tabOn", view === "get-started");

  if (view === "library"){
    $("#planName").textContent = "Library";
  } else if (view === "plan"){
    $("#planName").textContent = state.plan?.plan_name || "Ten-Year Plan";
  } else if (view === "authors"){
    $("#planName").textContent = "Great Authors";
  } else if (view === "desk"){
    $("#planName").textContent = "Conversation Desk";
  } else if (view === "glossary"){
    $("#planName").textContent = "Glossary";
  } else if (view === "get-started"){
    $("#planName").textContent = "Get Started";
  }

  renderAll();
}
function renderAll(){
  if (state.view === "library") renderLibrary();
  else if (state.view === "plan") renderPlan();
  else if (state.view === "authors") renderAuthors();
  else if (state.view === "desk") renderConversationDesk();

  // Notes list refresh if open
  if (state.drawer.open && state.drawer.which === "notes"){
    renderNotesList();
  }
}
export {
  setView,
  renderAll,
  gotoPlanWorkKey,
  gotoLibraryWork,
  gotoLibraryGreatIdea,
  getWorkContextFromRow,
  openDrawer,
  closeDrawer
};
