/* reader-routes.js — cross-view navigation, drawers, and render orchestration */
import {
  $,
  flashEl,
  hash32,
  normalizeText,
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
  renderNotesList,
  startEditNote,
  startNewNote
} from "./writing-desks.js";
import {
  openConversationDesk,
  renderConversationDesk
} from "./conversation-desk.js";
import { deriveHomeSummary } from "./study-overview.js";
import { renderStudyHome, wireStudyHome } from "./study-home.js";
import { getCardStatus, getCardStatusKey } from "./reader-progress.js";

// Home can reveal a reading without changing existing occurrence-link behavior.
function openHomePlanReading(key){
  const reading = state.flatWorks.find(item => item.key === key);
  if (!reading) return;
  const filters = state.filters;
  if (normalizeText(filters.q) && !reading.search.includes(normalizeText(filters.q))) filters.q = "";
  if (filters.tier !== "all" && filters.tier !== reading.tier) filters.tier = "all";
  if (filters.greatIdea !== "all" && !reading.greatIdeas?.includes(filters.greatIdea)) filters.greatIdea = "all";
  const filteredStatus = { tracker_in_progress: "in_progress", tracker_complete: "complete", tracker_not_started: "not_started", tracker_skipped: "skipped" }[filters.sort];
  if (filteredStatus && filteredStatus !== getCardStatus(getCardStatusKey(reading.author, reading.work.title))) filters.sort = "sort_check";
  // Table rows have no detail toggle. This is a transient presentation choice.
  filters.planViewMode = "default";
  for (const [id, value] of [["q", filters.q], ["tierSel", filters.tier], ["greatIdeaSel", filters.greatIdea], ["sortSel", filters.sort]]) {
    const control = document.getElementById(id);
    if (control) control.value = value;
  }
  gotoPlanWorkKey(key);
  requestAnimationFrame(() => {
    const row = document.getElementById(`wk_${hash32(key)}`);
    if (row && !row.classList.contains("active")) row.querySelector(".workMain")?.click();
  });
}

function openHomePage(page){
  if (page === "notes" || page === "great-idea-notes") {
    state.notesUI.search = "";
    state.notesUI.tag = "all";
    state.notesUI.showArchived = false;
    state.notesUI.bookclubFilter = false;
    state.notesUI.noteTypeFilter = page === "great-idea-notes" ? ["great_idea"] : [];
    const search = $("#noteSearch");
    if (search) search.value = "";
    openDrawer("notes");
    hideEditor();
  } else {
    // Rendering the existing Desk does not create a draft when it is empty.
    setView(page);
  }
}

function openHomeNote(id){
  if (!state.notes.some(note => note.id === id && !note.archived)) return;
  openDrawer("notes");
  startEditNote(id);
}

function openHomeDraft(id){
  if (!state.conversationDesk.drafts.some(draft => draft.id === id)) return;
  state.conversationDesk.selectedId = id;
  openConversationDesk();
}

let removeHomeListeners;
function renderHome(){
  const root = $("#homeView");
  if (!root) return;
  const selectedReadingKey = document.querySelector("#planGrid .workRow.active")?.dataset.workkey;
  renderStudyHome(root, deriveHomeSummary({ ...state, selectedReadingKey }));
  removeHomeListeners?.();
  removeHomeListeners = wireStudyHome(root, {
    openPage: openHomePage,
    openPlanReading: openHomePlanReading,
    openNote: openHomeNote,
    openDraft: openHomeDraft,
    startNote: () => { openDrawer("notes"); startNewNote({}); },
    startWriting: () => openConversationDesk()
  });
}

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

  $("#homeView")?.classList.toggle("on", view === "home");
  $("#libraryView")?.classList.toggle("on", view === "library");
  $("#planView")?.classList.toggle("on", view === "plan");
  $("#authorsView")?.classList.toggle("on", view === "authors");
  $("#deskView")?.classList.toggle("on", view === "desk");
  $("#glossaryView")?.classList.toggle("on", view === "glossary");
  $("#getStartedView")?.classList.toggle("on", view === "get-started");

  $("#tabHome")?.classList.toggle("tabOn", view === "home");
  $("#tabLibrary")?.classList.toggle("tabOn", view === "library");
  $("#tabPlan")?.classList.toggle("tabOn", view === "plan");
  $("#tabAuthors")?.classList.toggle("tabOn", view === "authors");
  $("#tabDesk")?.classList.toggle("tabOn", view === "desk");
  $("#tabGlossary")?.classList.toggle("tabOn", view === "glossary");
  $("#tabGetStarted")?.classList.toggle("tabOn", view === "get-started");

  if (view === "home"){
    $("#planName").textContent = "Home";
  } else if (view === "library"){
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
  if (state.view === "home") renderHome();
  else if (state.view === "library") renderLibrary();
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
