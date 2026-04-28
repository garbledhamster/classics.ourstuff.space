/* state.js — Singleton app state object; initialized once at boot from localStorage */
/* =========================================================
   APP STATE
   ========================================================= */
const state = {
  plan: null,
  projectCatalog: [],  // book catalog from library.json with sourceUrls
  flatWorks: [],     // plan entries (can include duplicates across years)
  libraryWorks: [],  // aggregated unique works for default browsing
  checks: loadChecks(),
  cardStatuses: loadCardStatuses(),
  cardDates: loadCardDates(),
  cardTasks: loadCardTasks(),
  notes: loadNotes(),
  deletedNoteIds: loadDeletedNoteIds(),
  view: "library",   // "library" | "plan" | "authors"
  availableYears: [],
  filters: {
    // plan view
    q: "",
    year: "1",
    tier: "all",
    greatIdea: "all",
    sort: "sort_check",
    planViewMode: "default", // "default" | "table"
    // library view
    libQ: "",
    libGreatIdea: "all",
    libSort: "author",
    libShow: "all",
    // authors view
    authorsQ: "",
    authorsLetterFilter: "",
    authorsPage: 1,
    authorsPageSize: 10,
    // library view pagination/letter
    libLetterFilter: "",
    libPage: 1,
    libPageSize: 10,
  },
  ui: { tableHiddenCols: loadTableHiddenCols() },
  drawer: { open:false, which:null }, // notes
  notesUI: { search:"", tag:"all", editingId:null, showArchived: false, selectMode: false, selectedIds: new Set() },
  tagsUniverse: [], // note tags (titles)
  greatIdeasUniverse: [],
  commentsUI: {
    bookTitle: "",
    bookAuthor: "",
    bookKey: "",
    selectedType: "argument",
    submitting: false
  },
  commentsCache: {}, // bookKey -> array of comment objects
  sync: {
    enabled: false,
    lastSync: null,
    syncing: false,
    error: null
  },
  currentUser: null
};
