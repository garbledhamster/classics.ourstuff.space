/* storage.js — localStorage read/write for all persisted app data */
// Forward declaration for triggerAutoSync (actual implementation is after sync functions)
let triggerAutoSync = () => {};

function loadChecks(){
  return safeJsonParse(localStorage.getItem(LS_CHECKS) || "{}", {});
}
function saveChecks(obj){
  localStorage.setItem(LS_CHECKS, JSON.stringify(obj));
  triggerAutoSync();
}
function loadReadingStageChecks(){
  return safeJsonParse(localStorage.getItem(LS_READING_STAGE_CHECKS) || "{}", {});
}
function saveReadingStageChecks(obj){
  localStorage.setItem(LS_READING_STAGE_CHECKS, JSON.stringify(obj));
  triggerAutoSync();
}

function loadNotes(){
  return safeJsonParse(localStorage.getItem(LS_NOTES) || "[]", []);
}
function saveNotes(arr){
  localStorage.setItem(LS_NOTES, JSON.stringify(arr));
  triggerAutoSync();
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
  triggerAutoSync();
}
function loadCardTasks(){
  return safeJsonParse(localStorage.getItem(LS_CARD_TASKS) || "{}", {});
}
function saveCardTasks(obj){
  localStorage.setItem(LS_CARD_TASKS, JSON.stringify(obj));
  triggerAutoSync();
}
function loadCardDates(){
  return safeJsonParse(localStorage.getItem(LS_CARD_DATES) || "{}", {});
}
function saveCardDates(obj){
  localStorage.setItem(LS_CARD_DATES, JSON.stringify(obj));
  triggerAutoSync();
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
  triggerAutoSync();
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
  if (sync) triggerAutoSync();
  return normalized;
}

function loadTableHiddenCols(){
  try { return new Set(JSON.parse(localStorage.getItem(LS_TABLE_HIDDEN_COLS) || "[]")); } catch(e){ console.error("Failed to load table column preferences:", e); return new Set(); }
}
function saveTableHiddenCols(set){
  try { localStorage.setItem(LS_TABLE_HIDDEN_COLS, JSON.stringify(Array.from(set))); } catch(e){ console.error("Failed to save table column preferences:", e); }
}
