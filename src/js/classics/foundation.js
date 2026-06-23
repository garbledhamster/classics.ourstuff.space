/* Shared constants, storage keys, option arrays, and lookup maps */
/* =========================================================
   STORAGE KEYS
   ========================================================= */
const LS_CHECKS        = "greatworks.reading.checks.v2";
const LS_READING_STAGE_CHECKS = "greatworks.reading.stageChecks.v1";
const LS_NOTES         = "greatworks.reading.notes.v1";
const LS_DELETED_NOTES = "greatworks.reading.deletedNoteIds.v1";
const LS_CARD_STATUS       = "greatworks.reading.cardStatus.v1";
const LS_CARD_TASKS        = "greatworks.reading.cardTasks.v1";
const LS_CARD_DATES        = "greatworks.reading.cardDates.v1";
const LS_TABLE_HIDDEN_COLS = "greatworks.reading.tableHiddenCols.v1";
const LS_TIMER_SETTINGS    = "greatworks.reading.timerSettings.v1";
const LS_TIMER_STATE       = "greatworks.reading.timerState.v1";
const LS_PAYMENT_SUMMARIES = "greatworks.reading.paymentSummaries.v1";
const LS_USER_PROFILE      = "greatworks.reading.userProfile.v1";
const LS_CONVERSATION_DESK = "greatworks.reading.conversationDesk.v1";
const PAYMENTS_WORKER_BASE_URL = "https://stripe-worker-api.jrice.workers.dev";
const CLASSICS_APP_ID = "classics.ourstuff.space";
const SITE_ID = "classics";
const DEFAULT_CARD_STATUS = "not_started";
const DEFAULT_CARD_TASK = "no_task";
const DEFAULT_NOTE_TYPE = "note";
const NOTE_TYPE_OPTIONS = [
  { value: "note",       label: "Note" },
  { value: "quote",      label: "Quote" },
  { value: "excerpt",    label: "Excerpt" },
  { value: "reflection", label: "Reflection" },
  { value: "essay",      label: "Essay" },
  { value: "great_idea", label: "Great Idea" }
];
const CARD_STATUS_OPTIONS = [
  { value: DEFAULT_CARD_STATUS, label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "complete", label: "Complete" },
  { value: "skipped", label: "Skipped" }
];
const CARD_TASK_GROUPS = [
  {
    label: "Reading Sequence",
    options: [
      { value: "period_documentary",            label: "Period Documentary",                    description: "Establishes the \u201cpastness of the past\u201d and social context to prime your mind before engaging the text." },
      { value: "author_documentary_biography",  label: "Author Documentary/Biography",          description: "Provides human \u201canchor points\u201d and serves as an intellectual \u201con-ramp\u201d for difficult classics, while humanizing the author\u2019s personal transaction and reinforcing story-based memory." },
      { value: "pre_reading_breakdown",         label: "Pre-reading Breakdown",                 description: "A chapter-by-chapter or part-by-part structural roadmap of the work before the inspectional read. Reveals the book\u2019s architecture, major movements, recurring questions, and likely points of difficulty so the first reading has context without replacing direct engagement with the text." },
      { value: "audiobook_listen_1",             label: "Reading 1 \u2014 Inspectional", description: "A \u201csuperficial reading\u201d where you race through the text \u2014 via audiobook, digital, or physical book \u2014 to find its basic pulsebeat without stopping for difficult parts." },
      { value: "summary_of_book_or_works",       label: "Summary of Book or Works",              description: "Used only as a final refinement and memory jog to ensure you are not at the \u201cmercy\u201d of a commentator\u2019s interpretation before possessing the book yourself." },
      { value: "lecture_on_book_or_works",       label: "Lecture/Discussion",                    description: "Functions as \u201caided discovery\u201d where an expert helps you bridge the gap to higher levels of understanding. Using AI is a great option here \u2014 have a discussion, ask questions, and fill in gaps of knowledge before moving on to the analytical reading." },
      { value: "audiobook_listen_2",             label: "Reading 2 \u2014 Analytical",   description: "The \u201cdeep dive\u201d for \u201cchewing and digesting\u201d the author\u2019s specific arguments and propositions \u2014 available as an audiobook, digital, or physical book." }
    ]
  }
];
const CARD_TASK_OPTIONS = [
  { value: DEFAULT_CARD_TASK, label: "No Action" },
  ...CARD_TASK_GROUPS.flatMap(group => group.options)
];
const CARD_STATUS_SORT_RANK = Object.fromEntries(CARD_STATUS_OPTIONS.map((opt, idx) => [opt.value, idx]));
const CARD_TASK_SORT_RANK = Object.fromEntries(CARD_TASK_OPTIONS.map((opt, idx) => [opt.value, idx]));

// Which button groups to show for each task (all groups shown when no task selected)
const TASK_VISIBLE_GROUPS = {
  period_documentary:              ["context", "biography", "wikipedia", "wikisearch", "google", "youtube"],
  author_documentary_biography:    ["biography", "wikipedia", "google", "youtube"],
  pre_reading_breakdown:           ["outlines", "wikipedia", "wikisearch", "google", "youtube"],
  audiobook_listen_1:              ["audiobooks", "freebook", "buybook", "wikipedia"],
  summary_of_book_or_works:        ["outlines", "wikisearch", "goodreads", "google"],
  lecture_on_book_or_works:        ["google", "youtube", "outlines", "wikipedia", "wikisearch"],
  audiobook_listen_2:              ["audiobooks", "freebook", "outlines", "goodreads", "google", "youtube"],
};

// Task-specific search terms appended to search queries (per platform)
const TASK_SEARCH_TERMS = {
  period_documentary:              { google: "historical context documentary time period", youtube: "documentary history period", wikisearch: "historical context era period" },
  author_documentary_biography:    { google: "biography documentary life history",         youtube: "biography documentary life" },
  pre_reading_breakdown:           { google: "chapter breakdown structure outline table of contents guide", youtube: "chapter breakdown book structure overview", wikisearch: "structure outline summary contents" },
  audiobook_listen_1:              { google: "audiobook public domain",                    youtube: "audiobook" },
  summary_of_book_or_works:        { google: "summary analysis overview themes",           youtube: "summary analysis",         wikisearch: "summary analysis themes" },
  lecture_on_book_or_works:        { google: "lecture course university analysis",          youtube: "lecture course",           wikisearch: "analysis interpretation themes" },
  audiobook_listen_2:              { google: "analysis critical themes",                   youtube: "audiobook deep dive" },
};

const YOUTUBE_SEARCH_SUFFIX = ""; // No default suffix; extra terms are only added when learning goals or custom search are selected
const LEARNING_GOAL_OPTIONS = [
  { label: "Remember", query: "summary overview introduction" },
  { label: "Understand", query: "main ideas explained" },
  { label: "Apply", query: "real world examples and practice" },
  { label: "Analyze", query: "compare themes and analysis" },
  { label: "Evaluate", query: "critical review and evaluation" },
  { label: "Create", query: "creative project prompts" }
];
const AUTO_SYNC_DEBOUNCE_MS = 2000; // Wait 2 seconds after last change before auto-syncing
const CONVERSATION_DESK_MODE_OPTIONS = [
  { value: "reader", label: "Reader" },
  { value: "editor", label: "Editor" }
];
const CONVERSATION_PUBLICATION_OPTIONS = [
  { value: "unpublished", label: "Unpublished" },
  { value: "pending_review", label: "Unpublished / awaiting approval" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Hidden" }
];
const CONVERSATION_VISIBILITY_OPTIONS = [
  { value: "private", label: "Private" },
  { value: "members", label: "Logged-in users" }
];
const TABLE_COLUMNS = [
  { id: "check", label: "Done" },
  { id: "year", label: "Year" },
  { id: "number", label: "Number" },
  { id: "work", label: "Work" },
  { id: "author", label: "Author" },
  { id: "type", label: "Type" },
  { id: "notes", label: "Notes" },
  { id: "status", label: "Status" },
  { id: "action", label: "Current Action" },
  { id: "date-start", label: "Start Date" },
  { id: "date-end", label: "End Date" }
];


/* Pure utility functions with no shared mutable state */
const $ = (sel, root=document) => root.querySelector(sel);

function buildAudiobookSearchUrl(title, author) {
  const q = encodeURIComponent(`"${title}" ${author} public domain audiobook site:librivox.org OR site:archive.org OR site:gutenberg.org`.trim());
  return `https://duckduckgo.com/?q=${q}`;
}

function buildFreeBookSearchUrl(title, author) {
  const freeSites = `site:gutenberg.org OR site:gutenberg.net.au OR site:gutenberg.ca OR site:archive.org OR site:wikisource.org OR site:fadedpage.com OR site:standardebooks.org OR site:freeread.de`;
  const q = encodeURIComponent(`"${title}" ${author} (${freeSites})`.trim());
  return `https://duckduckgo.com/?q=${q}`;
}
function buildBuyBookSearchUrl(title, author) {
  const buySites = `site:amazon.com OR site:ebay.com OR site:abebooks.com OR site:barnesandnoble.com OR site:thriftbooks.com OR site:bookshop.org`;
  const q = encodeURIComponent(`"${title}" ${author} (${buySites})`.trim());
  return `https://duckduckgo.com/?q=${q}`;
}
function buildOutlinesSearchUrl(title, author) {
  const sites = `site:sparknotes.com OR site:litcharts.com OR site:gradesaver.com OR site:cliffsnotes.com OR site:shmoop.com OR site:wikipedia.org OR site:britannica.com OR site:plato.stanford.edu`;
  const q = encodeURIComponent(`"${title}" ${author} (${sites})`.trim());
  return `https://duckduckgo.com/?q=${q}`;
}
function buildGoodreadsSearchUrl(title, author) {
  const q = encodeURIComponent(`${title} ${author}`.trim());
  return `https://www.goodreads.com/search?q=${q}`;
}
function buildBiographySearchUrl(author) {
  const q = encodeURIComponent(`"${author}" biography life history documentary lecture video`.trim());
  return `https://duckduckgo.com/?q=${q}`;
}
function buildContextSearchUrl(author) {
  const q = encodeURIComponent(`"${author}" historical context era time period contemporaries influences philosophy culture`.trim());
  return `https://duckduckgo.com/?q=${q}`;
}
function buildLearningSearchUrl({ title, author, platform, goal }) {
  const goalText = String(goal || "").trim();
  const q = encodeURIComponent(`${title} ${author}${platform === "youtube" ? YOUTUBE_SEARCH_SUFFIX : ""} ${goalText}`.trim());
  if (platform === "youtube") {
    return `https://duckduckgo.com/?q=${q}&iax=videos&ia=videos`;
  }
  return `https://duckduckgo.com/?q=${q}`;
}

function formatWorkYear(year){
  if (!Number.isFinite(year)) return "";
  return year < 1 ? `${Math.abs(year) || 1} BCE` : `${year}`;
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function normalizeText(s){
  return String(s ?? "").toLowerCase().replace(/\s+/g," ").trim();
}

// Keep every dashboard-side action visible. The current task still adjusts search terms,
// but it no longer hides resource buttons from the drawer.
function applyTaskVisibility(actionsEl, taskValue) {
  if (!actionsEl) return;
  void taskValue;
  actionsEl.querySelectorAll("[data-btn-group]").forEach(el => {
    el.style.display = "";
  });
}

// Apply task visibility to every .workActions/.libActions inside containerEl after a render.
function applyAllTaskVisibilities(containerEl) {
  if (!containerEl) return;
  containerEl.querySelectorAll(".workActions, .libActions").forEach(actionsEl => {
    const row  = actionsEl.closest(".workRow");
    const card = actionsEl.closest(".libCard");
    let taskValue = DEFAULT_CARD_TASK;
    if (row) {
      const author = row.dataset.author || "";
      const title  = row.dataset.book   || "";
      taskValue = getCardTask(getCardStatusKey(author, title)).task;
    } else if (card) {
      const author = card.dataset.author || "";
      const title  = card.dataset.title  || "";
      taskValue = getCardTask(getCardStatusKey(author, title)).task;
    }
    applyTaskVisibility(actionsEl, taskValue);
  });
}

function setError(msg){
  const box = $("#errorBox");
  box.style.display = "block";
  box.textContent = msg;
}
function clearError(){
  const box = $("#errorBox");
  box.style.display = "none";
  box.textContent = "";
}

function uid(){
  return `n_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function nowIso(){
  return new Date().toISOString();
}

function safeJsonParse(str, fallback){
  try{ return JSON.parse(str); } catch { return fallback; }
}

function _isValidUrl(str){
  try{
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch { return false; }
}

// Simple stable hash for DOM ids (no crypto needed)
function hash32(str){
  let h = 2166136261;
  for (let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function flashEl(el){
  if (!el) return;
  el.classList.remove("flash");
  // force reflow
  void el.offsetWidth;
  el.classList.add("flash");
  setTimeout(()=> el.classList.remove("flash"), 1300);
}

function workKey({year, order, tier, author, title, selection, selections}){
  const sel = selection ? `|${selection}` : "";
  const sels = Array.isArray(selections) ? `|${selections.join(" / ")}` : "";
  return `y${year}|o${order}|${tier}|${author}|${title}${sel}${sels}`.toLowerCase();
}


/* localStorage read/write helpers for persisted app data */
let afterSaveCallback = () => {};

function setAfterSaveCallback(callback){
  afterSaveCallback = typeof callback === "function" ? callback : () => {};
}

function notifyAfterSave(){
  afterSaveCallback();
}

function loadChecks(){
  return safeJsonParse(localStorage.getItem(LS_CHECKS) || "{}", {});
}
function saveChecks(obj){
  localStorage.setItem(LS_CHECKS, JSON.stringify(obj));
  notifyAfterSave();
}
function loadReadingStageChecks(){
  return safeJsonParse(localStorage.getItem(LS_READING_STAGE_CHECKS) || "{}", {});
}
function saveReadingStageChecks(obj){
  localStorage.setItem(LS_READING_STAGE_CHECKS, JSON.stringify(obj));
  notifyAfterSave();
}

function loadNotes(){
  return safeJsonParse(localStorage.getItem(LS_NOTES) || "[]", []);
}
function saveNotes(arr){
  localStorage.setItem(LS_NOTES, JSON.stringify(arr));
  notifyAfterSave();
}

function loadDeletedNoteIds(){
  return new Set(safeJsonParse(localStorage.getItem(LS_DELETED_NOTES) || "[]", []));
}
function saveDeletedNoteIds(idSet){
  localStorage.setItem(LS_DELETED_NOTES, JSON.stringify(Array.from(idSet)));
}
function loadCardStatuses(){
  return safeJsonParse(localStorage.getItem(LS_CARD_STATUS) || "{}", {});
}
function saveCardStatuses(obj){
  localStorage.setItem(LS_CARD_STATUS, JSON.stringify(obj));
  notifyAfterSave();
}
function loadCardTasks(){
  return safeJsonParse(localStorage.getItem(LS_CARD_TASKS) || "{}", {});
}
function saveCardTasks(obj){
  localStorage.setItem(LS_CARD_TASKS, JSON.stringify(obj));
  notifyAfterSave();
}
function loadCardDates(){
  return safeJsonParse(localStorage.getItem(LS_CARD_DATES) || "{}", {});
}
function saveCardDates(obj){
  localStorage.setItem(LS_CARD_DATES, JSON.stringify(obj));
  notifyAfterSave();
}
function loadPaymentSummaries(){
  return safeJsonParse(localStorage.getItem(LS_PAYMENT_SUMMARIES) || "{}", {});
}
function savePaymentSummaries(obj){
  localStorage.setItem(LS_PAYMENT_SUMMARIES, JSON.stringify(obj || {}));
}
function loadUserProfile(){
  return safeJsonParse(localStorage.getItem(LS_USER_PROFILE) || "{}", {});
}
function saveUserProfile(profile){
  localStorage.setItem(LS_USER_PROFILE, JSON.stringify(profile || {}));
  notifyAfterSave();
}

function defaultHouseStyle(){
  return {
    voicePreferences: "Plainspoken, serious, and grounded in the user's own phrasing.",
    editorialPosture: "socratic_editor",
    sourcePriority: "my_notes_first",
    rewritePermissions: "preserve_voice_only",
    challengeLevel: "moderate",
    preferredTraditions: "",
    forbiddenBehaviors: "Do not replace my argument with generic prose. Do not invent sources, claims, or personal facts.",
    defaultStructure: "Central question, claim, reasons, objections, source notes, final contribution."
  };
}

function defaultConversationDeskState(){
  return {
    drafts: [],
    selectedId: null,
    houseStyle: defaultHouseStyle(),
    ui: {
      loading: false,
      loaderStep: 0,
      mode: CONVERSATION_DESK_MODE_OPTIONS[0].value,
      activeSpace: CONVERSATION_DESK_MODE_OPTIONS[0].value
    },
    updatedAt: nowIso(),
    schemaVersion: 2
  };
}

function conversationDeskRecord(value){
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeConversationDraft(source = {}){
  source = conversationDeskRecord(source);
  const now = nowIso();
  const createdAt = source.createdAt || now;
  const updatedAt = source.updatedAt || createdAt;
  const publicationStatus = CONVERSATION_PUBLICATION_OPTIONS.some(opt => opt.value === source.publicationStatus)
    ? source.publicationStatus
    : source.draftStatus === "contribution"
      ? "published"
      : "unpublished";
  const visibility = CONVERSATION_VISIBILITY_OPTIONS.some(opt => opt.value === source.visibility)
    ? source.visibility
    : source.visibility === "shared"
      ? "members"
      : "private";
  const approvalStatus = String(source.approvalStatus || (
    publicationStatus === "published" ? "approved" :
    publicationStatus === "pending_review" ? "needs_review" :
    "draft"
  ));
  return {
    id: String(source.id || uid()),
    title: String(source.title || ""),
    centralQuestion: String(source.centralQuestion || ""),
    body: String(source.body || ""),
    publicationStatus,
    linkedBook: String(source.linkedBook || ""),
    linkedAuthor: String(source.linkedAuthor || ""),
    linkedThemes: Array.isArray(source.linkedThemes) ? source.linkedThemes.map(String).filter(Boolean) : [],
    linkedNotes: Array.isArray(source.linkedNotes) ? source.linkedNotes.map(String).filter(Boolean) : [],
    linkedSourceCards: Array.isArray(source.linkedSourceCards)
      ? source.linkedSourceCards.map(card => ({
          id: String(card?.id || uid()),
          title: String(card?.title || ""),
          url: String(card?.url || ""),
          note: String(card?.note || "")
        })).filter(card => card.title || card.url || card.note)
      : [],
    visibility,
    approvalStatus,
    publicIndexId: String(source.publicIndexId || ""),
    publishRequestedAt: String(source.publishRequestedAt || ""),
    publicationReview: conversationDeskRecord(source.publicationReview),
    aiBrainMemoryObject: source.aiBrainMemoryObject || null,
    publishedAt: publicationStatus === "published" ? String(source.publishedAt || updatedAt) : "",
    createdAt,
    updatedAt
  };
}

function normalizeConversationDeskState(source = {}){
  source = conversationDeskRecord(source);
  const base = defaultConversationDeskState();
  const drafts = Array.isArray(source.drafts) ? source.drafts.map(normalizeConversationDraft) : [];
  const selectedId = drafts.some(draft => draft.id === source.selectedId)
    ? source.selectedId
    : drafts[0]?.id || null;
  return {
    ...base,
    drafts,
    selectedId,
    houseStyle: { ...base.houseStyle, ...(source.houseStyle || {}) },
    ui: {
      ...base.ui,
      ...(source.ui || {}),
      loading: false,
      mode: CONVERSATION_DESK_MODE_OPTIONS.some(opt => opt.value === source?.ui?.mode)
        ? source.ui.mode
        : base.ui.mode,
      activeSpace: CONVERSATION_DESK_MODE_OPTIONS.some(opt => opt.value === source?.ui?.activeSpace)
        ? source.ui.activeSpace
        : CONVERSATION_DESK_MODE_OPTIONS.some(opt => opt.value === source?.ui?.mode)
          ? source.ui.mode
          : base.ui.activeSpace
    },
    updatedAt: source.updatedAt || base.updatedAt,
    schemaVersion: 2
  };
}

function loadConversationDesk(){
  return normalizeConversationDeskState(safeJsonParse(localStorage.getItem(LS_CONVERSATION_DESK) || "{}", {}));
}

function saveConversationDesk(value, { sync = true } = {}){
  const normalized = normalizeConversationDeskState({ ...value, updatedAt: nowIso() });
  localStorage.setItem(LS_CONVERSATION_DESK, JSON.stringify(normalized));
  if (sync) notifyAfterSave();
  return normalized;
}

function loadTableHiddenCols(){
  try { return new Set(JSON.parse(localStorage.getItem(LS_TABLE_HIDDEN_COLS) || "[]")); } catch(e){ console.error("Failed to load table column preferences:", e); return new Set(); }
}
function saveTableHiddenCols(set){
  try { localStorage.setItem(LS_TABLE_HIDDEN_COLS, JSON.stringify(Array.from(set))); } catch(e){ console.error("Failed to save table column preferences:", e); }
}


/* Singleton app state object initialized from local persistence */
/* =========================================================
   APP STATE
   ========================================================= */
const state = {
  plan: null,
  projectCatalog: [],  // book catalog from library.json with sourceUrls
  flatWorks: [],     // plan entries (can include duplicates across years)
  libraryWorks: [],  // aggregated unique works for default browsing
  readingGuideRows: [],
  readingGuideLookup: null,
  checks: loadChecks(),
  readingStageChecks: loadReadingStageChecks(),
  cardStatuses: loadCardStatuses(),
  cardDates: loadCardDates(),
  cardTasks: loadCardTasks(),
  notes: loadNotes(),
  deletedNoteIds: loadDeletedNoteIds(),
  paymentSummaries: loadPaymentSummaries(),
  userProfile: loadUserProfile(),
  conversationDesk: loadConversationDesk(),
  view: "library",   // "library" | "plan" | "authors" | "desk"
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
  notesUI: { search:"", tag:"all", noteTypeFilter:[], editingId:null, showArchived: false, selectMode: false, selectedIds: new Set(), bookclubFilter: false },
  tagsUniverse: [], // note tags (titles)
  greatIdeasUniverse: [],
  sync: {
    enabled: false,
    lastSync: null,
    syncing: false,
    error: null
  },
  currentUser: null
};


/* Promise-based modal dialogs and shared shell prompts */
/* =========================================================
   MODAL
   ========================================================= */
// Generic modal helpers for alert, confirm, and prompt
function showAlert(message, title = "Alert"){
  return new Promise((resolve) => {
    const modal = $("#alertModal");
    const overlay = $("#overlay");
    
    $("#alertModalTitle").textContent = title;
    $("#alertModalMessage").textContent = message;
    
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    
    const okBtn = $("#alertModalOkBtn");
    
    function handleOk(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", handleOk);
      resolve();
    }
    
    okBtn.addEventListener("click", handleOk);
    setTimeout(() => okBtn.focus(), 100);
  });
}

function showConfirm(message, title = "Confirm"){
  return new Promise((resolve) => {
    const modal = $("#confirmModal");
    const overlay = $("#overlay");
    
    $("#confirmModalTitle").textContent = title;
    $("#confirmModalMessage").textContent = message;
    
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    
    const okBtn = $("#confirmModalOkBtn");
    const cancelBtn = $("#confirmModalCancelBtn");
    
    function handleOk(){
      cleanup();
      resolve(true);
    }
    
    function handleCancel(){
      cleanup();
      resolve(false);
    }
    
    function cleanup(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
    }
    
    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    setTimeout(() => cancelBtn.focus(), 100);
  });
}

function _showPrompt(message, defaultValue = "", title = "Input Required"){
  return new Promise((resolve) => {
    const modal = $("#promptModal");
    const overlay = $("#overlay");
    const input = $("#promptModalInput");
    
    $("#promptModalTitle").textContent = title;
    $("#promptModalMessage").textContent = message;
    input.value = defaultValue;
    
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    
    const okBtn = $("#promptModalOkBtn");
    const cancelBtn = $("#promptModalCancelBtn");
    
    function handleOk(){
      const value = input.value;
      cleanup();
      resolve(value);
    }
    
    function handleCancel(){
      cleanup();
      resolve(null);
    }
    
    function handleEnter(e){
      if (e.key === "Enter"){
        handleOk();
      }
    }
    
    function cleanup(){
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", handleOk);
      cancelBtn.removeEventListener("click", handleCancel);
      input.removeEventListener("keydown", handleEnter);
    }
    
    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    input.addEventListener("keydown", handleEnter);
    setTimeout(() => input.focus(), 100);
  });
}

const storyHooks = {
  renderApp: () => {},
  navigateToView: () => {},
  openLibraryWork: () => {},
  filterLibraryByIdea: () => {},
  refreshReaderAccountUi: () => {}
};

function registerRenderApp(fn){
  storyHooks.renderApp = typeof fn === "function" ? fn : () => {};
}

function rerenderApp(){
  return storyHooks.renderApp();
}

function registerViewNavigator(fn){
  storyHooks.navigateToView = typeof fn === "function" ? fn : () => {};
}

function goToView(view){
  return storyHooks.navigateToView(view);
}

function registerLibraryWorkNavigator(fn){
  storyHooks.openLibraryWork = typeof fn === "function" ? fn : () => {};
}

function goToLibraryWork(author, title){
  return storyHooks.openLibraryWork(author, title);
}

function registerLibraryIdeaNavigator(fn){
  storyHooks.filterLibraryByIdea = typeof fn === "function" ? fn : () => {};
}

function goToLibraryGreatIdea(idea){
  return storyHooks.filterLibraryByIdea(idea);
}

function registerReaderAccountRefresh(fn){
  storyHooks.refreshReaderAccountUi = typeof fn === "function" ? fn : () => {};
}

function refreshReaderAccountUi(){
  return storyHooks.refreshReaderAccountUi();
}

export {
  $,
  LS_CHECKS,
  LS_READING_STAGE_CHECKS,
  LS_NOTES,
  LS_DELETED_NOTES,
  LS_CARD_STATUS,
  LS_CARD_TASKS,
  LS_CARD_DATES,
  LS_TABLE_HIDDEN_COLS,
  LS_TIMER_SETTINGS,
  LS_TIMER_STATE,
  LS_PAYMENT_SUMMARIES,
  LS_USER_PROFILE,
  LS_CONVERSATION_DESK,
  PAYMENTS_WORKER_BASE_URL,
  CLASSICS_APP_ID,
  SITE_ID,
  DEFAULT_CARD_STATUS,
  DEFAULT_CARD_TASK,
  DEFAULT_NOTE_TYPE,
  NOTE_TYPE_OPTIONS,
  CARD_STATUS_OPTIONS,
  CARD_TASK_GROUPS,
  CARD_TASK_OPTIONS,
  CARD_STATUS_SORT_RANK,
  CARD_TASK_SORT_RANK,
  TASK_VISIBLE_GROUPS,
  TASK_SEARCH_TERMS,
  YOUTUBE_SEARCH_SUFFIX,
  LEARNING_GOAL_OPTIONS,
  AUTO_SYNC_DEBOUNCE_MS,
  CONVERSATION_DESK_MODE_OPTIONS,
  CONVERSATION_PUBLICATION_OPTIONS,
  CONVERSATION_VISIBILITY_OPTIONS,
  TABLE_COLUMNS,
  buildAudiobookSearchUrl,
  buildFreeBookSearchUrl,
  buildBuyBookSearchUrl,
  buildOutlinesSearchUrl,
  buildGoodreadsSearchUrl,
  buildBiographySearchUrl,
  buildContextSearchUrl,
  buildLearningSearchUrl,
  formatWorkYear,
  escapeHtml,
  normalizeText,
  setError,
  clearError,
  uid,
  nowIso,
  safeJsonParse,
  _isValidUrl,
  hash32,
  flashEl,
  workKey,
  setAfterSaveCallback,
  notifyAfterSave,
  loadChecks,
  saveChecks,
  loadReadingStageChecks,
  saveReadingStageChecks,
  loadNotes,
  saveNotes,
  loadDeletedNoteIds,
  saveDeletedNoteIds,
  loadCardStatuses,
  saveCardStatuses,
  loadCardTasks,
  saveCardTasks,
  loadCardDates,
  saveCardDates,
  loadPaymentSummaries,
  savePaymentSummaries,
  loadUserProfile,
  saveUserProfile,
  defaultHouseStyle,
  defaultConversationDeskState,
  conversationDeskRecord,
  normalizeConversationDraft,
  normalizeConversationDeskState,
  loadConversationDesk,
  saveConversationDesk,
  loadTableHiddenCols,
  saveTableHiddenCols,
  state,
  showAlert,
  showConfirm,
  _showPrompt,
  registerRenderApp,
  rerenderApp,
  registerViewNavigator,
  goToView,
  registerLibraryWorkNavigator,
  goToLibraryWork,
  registerLibraryIdeaNavigator,
  goToLibraryGreatIdea,
  registerReaderAccountRefresh,
  refreshReaderAccountUi
};


