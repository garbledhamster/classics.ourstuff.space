
import {
  $,
  CLASSICS_APP_ID,
  CONVERSATION_DESK_MODE_OPTIONS,
  CONVERSATION_PUBLICATION_OPTIONS,
  CONVERSATION_VISIBILITY_OPTIONS,
  DEFAULT_NOTE_TYPE,
  NOTE_TYPE_OPTIONS,
  escapeHtml,
  goToLibraryGreatIdea,
  goToLibraryWork,
  goToView as setView,
  normalizeConversationDeskState,
  normalizeConversationDraft,
  nowIso,
  rerenderApp as renderAll,
  saveConversationDesk,
  saveDeletedNoteIds,
  saveNotes,
  showAlert,
  showConfirm,
  state,
  uid
} from "./foundation.js";
import {
  CLASSICS_DATA_FILES
} from "./data-paths.js";
/* =========================================================
   NOTE TYPE HELPERS
   ========================================================= */
function getNoteTypes(n){
  if (Array.isArray(n.note_type)) return n.note_type.length ? n.note_type : [DEFAULT_NOTE_TYPE];
  if (n.note_type && typeof n.note_type === "string") return [n.note_type];
  return [DEFAULT_NOTE_TYPE];
}

function getCheckGroupValues(containerId){
  const container = $("#" + containerId);
  if (!container) return [];
  return Array.from(container.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
}

function setCheckGroupValues(containerId, values){
  const container = $("#" + containerId);
  if (!container) return;
  const arr = Array.isArray(values) ? values : (values && values !== "all" ? [values] : []);
  container.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.checked = arr.includes(cb.value);
  });
}

/* =========================================================
   NOTES (kept same behavior)
   ========================================================= */
function toggleNoteSelectMode(){
  state.notesUI.selectMode = !state.notesUI.selectMode;
  if (!state.notesUI.selectMode) {
    state.notesUI.selectedIds = new Set();
  }
  renderNotesList();
}

function deleteSelectedNotes(){
  const ids = state.notesUI.selectedIds;
  if (!ids.size) return;
  showConfirm(`Delete ${ids.size} note${ids.size > 1 ? "s" : ""}?`).then(confirmed => {
    if (!confirmed) return;
    // Tombstone each deleted ID so the next sync removes them from Firestore
    // instead of re-importing them.
    for (const id of ids) {
      state.deletedNoteIds.add(id);
    }
    state.notes = state.notes.filter(n => !ids.has(n.id));
    saveNotes(state.notes);
    saveDeletedNoteIds(state.deletedNoteIds);
    state.notesUI.selectedIds = new Set();
    state.notesUI.selectMode = false;
    renderNotesList();
    renderAll();
  });
}

function archiveSelectedNotes(){
  const ids = state.notesUI.selectedIds;
  if (!ids.size) return;
  // In "Show Archived" view archive→unarchive; in active view archive
  const targetArchived = !state.notesUI.showArchived;
  const now = nowIso();
  state.notes.filter(n => ids.has(n.id)).forEach(n => {
    n.archived = targetArchived;
    n.updated_at = now;
  });
  saveNotes(state.notes);
  state.notesUI.selectedIds = new Set();
  state.notesUI.selectMode = false;
  renderNotesList();
  renderAll();
}

function filteredNotes(){
  const q = normalizeText(state.notesUI.search);
  const tag = state.notesUI.tag;
  const noteTypeFilter = state.notesUI.noteTypeFilter;
  const showArchived = state.notesUI.showArchived;
  const bookclubFilter = state.notesUI.bookclubFilter;

  let notes = state.notes.slice();

  // Filter by archived status
  if (showArchived) {
    notes = notes.filter(n => n.archived === true);
  } else {
    notes = notes.filter(n => !n.archived);
  }

  if (tag !== "all"){
    notes = notes.filter(n => n.book_tag === tag);
  }
  if (noteTypeFilter.length > 0){
    notes = notes.filter(n => {
      const types = getNoteTypes(n);
      return noteTypeFilter.every(t => types.includes(t));
    });
  }
  if (q){
    notes = notes.filter(n => {
      const hay = normalizeText(`${n.title} ${n.body} ${n.book_tag} ${n.author} ${n.selection}`);
      return hay.includes(q);
    });
  }

  if (bookclubFilter) {
    // Build a map of title -> chronological sort key from flatWorks
    const orderMap = new Map();
    for (const fw of state.flatWorks) {
      const title = fw.work.title;
      const key = fw.year * 10000 + fw.order;
      if (!orderMap.has(title) || key < orderMap.get(title)) {
        orderMap.set(title, key);
      }
    }
    // Hide notes whose book_tag is not in the bookclub
    notes = notes.filter(n => orderMap.has(n.book_tag));
    // Sort by bookclub chronological order
    notes.sort((a, b) => {
      const ka = orderMap.get(a.book_tag) ?? Infinity;
      const kb = orderMap.get(b.book_tag) ?? Infinity;
      return ka - kb;
    });
  } else {
    notes.sort((a,b)=> (b.updated_at || "").localeCompare(a.updated_at || ""));
  }

  return notes;
}

function renderNotesList(){
  const tagSel = $("#noteTagFilter");
  if (tagSel && tagSel.value !== state.notesUI.tag) tagSel.value = state.notesUI.tag;

  setCheckGroupValues("noteTypeFilter", state.notesUI.noteTypeFilter);

  // Update toggle button appearance
  const toggleBtn = $("#toggleArchivedBtn");
  if (toggleBtn) {
    if (state.notesUI.showArchived) {
      toggleBtn.classList.add("tabOn");
      $("#toggleArchivedBtnText").textContent = "Show Active";
    } else {
      toggleBtn.classList.remove("tabOn");
      $("#toggleArchivedBtnText").textContent = "Show Archived";
    }
  }

  // Update multi-select mode UI
  const selectBtn = $("#toggleNoteSelectBtn");
  const selectBtnText = $("#toggleNoteSelectBtnText");
  const multiBar = $("#noteMultiBar");
  const selectCountEl = $("#noteSelectCount");
  const archiveSelBtnText = $("#archiveSelectedBtnText");
  if (selectBtn) selectBtn.classList.toggle("tabOn", state.notesUI.selectMode);
  if (selectBtnText) selectBtnText.textContent = state.notesUI.selectMode ? "Cancel Select" : "Select";
  if (multiBar) multiBar.style.display = state.notesUI.selectMode ? "flex" : "none";
  if (selectCountEl) {
    const cnt = state.notesUI.selectedIds.size;
    selectCountEl.textContent = `${cnt} selected`;
  }
  if (archiveSelBtnText) {
    archiveSelBtnText.textContent = state.notesUI.showArchived ? "Unarchive Selected" : "Archive Selected";
  }

  // Update bookclub filter button appearance
  const bookclubBtn = $("#filterBookclubBtn");
  if (bookclubBtn) {
    bookclubBtn.classList.toggle("tabOn", state.notesUI.bookclubFilter);
    bookclubBtn.setAttribute("aria-pressed", String(state.notesUI.bookclubFilter));
  }

  const list = $("#noteList");
  const notes = filteredNotes();

  if (state.notesUI.selectMode) {
    list.classList.add("noteSelectMode");
  } else {
    list.classList.remove("noteSelectMode");
  }

  if (!notes.length){
    list.innerHTML = `
      <div class="noteItem">
        <div class="noteItemHead">
          <p class="noteItemTitle">No notes</p>
          <div class="noteItemMeta"><span>Create one</span></div>
        </div>
        <div class="noteItemPreview">Use “New note” or click “New note” on a work.</div>
      </div>
    `;
  } else {
    list.innerHTML = notes.map(n => noteItemHtml(n)).join("");
  }

  list.onclick = (e) => {
    const item = e.target.closest("[data-noteid]");
    if (!item) return;
    const id = item.dataset.noteid;
    if (state.notesUI.selectMode) {
      // Toggle selection
      if (state.notesUI.selectedIds.has(id)) {
        state.notesUI.selectedIds.delete(id);
        item.classList.remove("noteSelected");
      } else {
        state.notesUI.selectedIds.add(id);
        item.classList.add("noteSelected");
      }
      // Update count live
      if (selectCountEl) {
        const cnt = state.notesUI.selectedIds.size;
        selectCountEl.textContent = `${cnt} selected`;
      }
    } else {
      startEditNote(id);
    }
  };
}

function noteItemHtml(n){
  const title = n.title ? escapeHtml(n.title) : "Untitled note";
  const book = n.book_tag ? escapeHtml(n.book_tag) : "—";
  const year = n.year ? `Year ${escapeHtml(n.year)}` : "—";
  const updated = n.updated_at ? new Date(n.updated_at).toLocaleString() : "";
  const preview = (n.body || "").slice(0, 220);
  const isSelected = state.notesUI.selectedIds.has(n.id);
  const selectedCls = isSelected ? " noteSelected" : "";
  const checked = isSelected ? " checked" : "";
  const noteTypeLabels = getNoteTypes(n).map(t => NOTE_TYPE_OPTIONS.find(o => o.value === t)?.label || t);

  const pills = [
    `<span class="pill">${book}</span>`,
    `<span class="pill">${year}</span>`,
    n.author ? `<span class="pill">${escapeHtml(n.author)}</span>` : "",
    ...noteTypeLabels.map(l => `<span class="pill">${escapeHtml(l)}</span>`)
  ].filter(Boolean).join("");

  return `
    <div class="noteItem${selectedCls}" data-noteid="${escapeHtml(n.id)}">
      <div class="noteItemHead">
        <label class="noteItemCheckWrap" aria-hidden="true">
          <input type="checkbox" class="noteItemCheck"${checked} tabindex="-1" aria-hidden="true">
        </label>
        <p class="noteItemTitle">${title}</p>
        <div class="noteItemMeta">
          <span>${escapeHtml(updated)}</span>
        </div>
      </div>
      <div class="tagRow">${pills}</div>
      <div class="noteItemPreview">${escapeHtml(preview)}${(n.body||"").length>220 ? "…" : ""}</div>
    </div>
  `;
}

function showEditor(){
  $("#noteEditor").style.display = "grid";
  $("#noteList").style.display = "none";
}
function hideEditor(){
  $("#noteEditor").style.display = "none";
  $("#noteList").style.display = "block";
  state.notesUI.editingId = null;
}

function startNewNote(ctx){
  const id = uid();
  state.notesUI.editingId = id;

  $("#editTitle").value = ctx.book_tag ? `${ctx.book_tag} — ` : "";
  $("#editBookTag").value = ctx.book_tag && state.tagsUniverse.includes(ctx.book_tag) ? ctx.book_tag : (state.tagsUniverse[0] || "");
  $("#editYear").value = ctx.year ? String(ctx.year) : "";
  $("#editAuthor").value = ctx.author || "";
  $("#editSelection").value = ctx.selection || "";
  $("#editBody").value = "";
  setCheckGroupValues("editNoteType", [DEFAULT_NOTE_TYPE]);

  $("#editMeta").textContent = "New note — not saved yet.";
  showEditor();
  $("#editTitle").focus();
}

function startEditNote(id){
  const n = state.notes.find(x => x.id === id);
  if (!n) return;

  state.notesUI.editingId = id;

  $("#editTitle").value = n.title || "";
  $("#editBookTag").value = n.book_tag && state.tagsUniverse.includes(n.book_tag) ? n.book_tag : (state.tagsUniverse[0] || "");
  $("#editYear").value = n.year ? String(n.year) : "";
  $("#editAuthor").value = n.author || "";
  $("#editSelection").value = n.selection || "";
  $("#editBody").value = n.body || "";
  setCheckGroupValues("editNoteType", getNoteTypes(n));

  const meta = `Saved • Created: ${n.created_at ? new Date(n.created_at).toLocaleString() : "—"} • Updated: ${n.updated_at ? new Date(n.updated_at).toLocaleString() : "—"}`;
  $("#editMeta").textContent = meta;

  // Update archive button label based on note's archived state
  const archiveBtnText = $("#archiveNoteBtnText");
  if (archiveBtnText) archiveBtnText.textContent = n.archived ? "Unarchive" : "Archive";

  showEditor();
  $("#editBody").focus();
}

function saveEditorNote(){
  const id = state.notesUI.editingId;
  if (!id) return;

  const title = $("#editTitle").value.trim();
  const book_tag = $("#editBookTag").value;
  const year = Number($("#editYear").value) || null;
  const author = $("#editAuthor").value.trim();
  const selection = $("#editSelection").value.trim();
  const body = $("#editBody").value;
  const selectedTypes = getCheckGroupValues("editNoteType");
  const note_type = selectedTypes.length > 0 ? selectedTypes : [DEFAULT_NOTE_TYPE];

  const existingIdx = state.notes.findIndex(n => n.id === id);

  if (existingIdx === -1){
    const note = {
      id,
      title: title || `Note — ${book_tag}`,
      book_tag,
      year,
      author,
      selection,
      body,
      note_type,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    state.notes.unshift(note);
  } else {
    const n = state.notes[existingIdx];
    n.title = title || `Note — ${book_tag}`;
    n.book_tag = book_tag;
    n.year = year;
    n.author = author;
    n.selection = selection;
    n.body = body;
    n.note_type = note_type;
    n.updated_at = nowIso();
  }

  saveNotes(state.notes);

  if (state.notesUI.tag !== "all" && state.notesUI.tag !== book_tag){
    state.notesUI.tag = book_tag;
    $("#noteTagFilter").value = book_tag;
  }

  renderNotesList();
  hideEditor();
  renderAll();
}

function deleteEditorNote(){
  const id = state.notesUI.editingId;
  if (!id) return;
  showConfirm("Delete this note?").then(confirmed => {
    if (!confirmed) return;

    state.notes = state.notes.filter(n => n.id !== id);
    saveNotes(state.notes);
    state.deletedNoteIds.add(id);
    saveDeletedNoteIds(state.deletedNoteIds);

    renderNotesList();
    hideEditor();
    renderAll();
  });
}

function archiveEditorNote(){
  const id = state.notesUI.editingId;
  if (!id) return;

  const existingIdx = state.notes.findIndex(n => n.id === id);
  if (existingIdx === -1) return;

  const note = state.notes[existingIdx];
  note.archived = !note.archived;
  note.updated_at = nowIso();

  saveNotes(state.notes);
  renderNotesList();
  hideEditor();
  renderAll();
}

function exportNotes(){
  const payload = { exported_at: nowIso(), notes: state.notes };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `reading-notes-export-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

async function importNotesFile(e){
  const file = e.target.files?.[0];
  if (!file) return;

  try{
    const text = await file.text();
    const parsed = JSON.parse(text);

    let notesIn = [];
    if (Array.isArray(parsed)) notesIn = parsed;
    else if (parsed && Array.isArray(parsed.notes)) notesIn = parsed.notes;
    else throw new Error("Import must be an array of notes, or { notes: [...] }");

    const existing = new Map(state.notes.map(n => [n.id, n]));
    for (const n of notesIn){
      if (!n?.id) continue;
      existing.set(n.id, {
        id: String(n.id),
        title: String(n.title || "").trim() || `Note — ${String(n.book_tag || "Unknown")}`,
        book_tag: String(n.book_tag || "").trim(),
        year: (n.year === null || n.year === undefined || n.year === "") ? null : Number(n.year),
        author: String(n.author || "").trim(),
        selection: String(n.selection || "").trim(),
        body: String(n.body || ""),
        note_type: (() => {
            if (Array.isArray(n.note_type)) {
              const valid = n.note_type.filter(t => NOTE_TYPE_OPTIONS.some(o => o.value === t));
              return valid.length ? valid : [DEFAULT_NOTE_TYPE];
            }
            return NOTE_TYPE_OPTIONS.some(o => o.value === n.note_type) ? [n.note_type] : [DEFAULT_NOTE_TYPE];
          })(),
        created_at: n.created_at ? String(n.created_at) : nowIso(),
        updated_at: n.updated_at ? String(n.updated_at) : nowIso()
      });
    }

    state.notes = Array.from(existing.values()).sort((a,b)=> (b.updated_at||"").localeCompare(a.updated_at||""));
    saveNotes(state.notes);

    $("#importFile").value = "";

    renderAll();
    showAlert("Notes imported.");
  } catch(err){
    showAlert(`Import failed: ${err.message}`);
  }
}

/* Reader and editor contribution workspace */

const DESK_LOADER_LINES = [
  "Preparing the Desk",
  "Gathering your contributions",
  "Opening the Reader",
  "Loading published work"
];

const DESK_READER_SECTIONS = [
  { key: "unpublished", label: "Unpublished" },
  { key: "published", label: "Published" }
];

const MARKDOWN_TOOLBAR = [
  { action: "heading", label: "H", title: "Heading" },
  { action: "bold", label: "B", title: "Bold" },
  { action: "italic", label: "I", title: "Italic" },
  { action: "quote", label: "\"", title: "Block quote" },
  { action: "list", label: "List", title: "Bullet list" },
  { action: "numberedList", label: "1.", title: "Numbered list" },
  { action: "link", label: "Link", title: "Link" },
  { action: "code", label: "</>", title: "Inline code" },
  { action: "divider", label: "--", title: "Divider" }
];

let deskLoaderTimer = null;
let publishedContributionCache = [];
let publishedContributionCacheLoaded = false;
let publishedContributionCacheBusy = false;

function selectedConversationDraft(){
  const desk = normalizeConversationDeskState(state.conversationDesk);
  state.conversationDesk = desk;
  return desk.drafts.find(draft => draft.id === desk.selectedId) || desk.drafts[0] || null;
}

function saveConversationDeskState({ render = false } = {}){
  const draft = selectedConversationDraft();
  if (draft) {
    draft.aiBrainMemoryObject = buildConversationMemoryObject(draft);
    draft.updatedAt = nowIso();
  }
  state.conversationDesk = saveConversationDesk(state.conversationDesk);
  if (render) renderConversationDesk();
}

function createConversationDraft(context = {}){
  const title = context.linkedBook
    ? `On ${context.linkedBook}`
    : context.linkedAuthor
      ? `On ${context.linkedAuthor}`
      : "Untitled contribution";
  const draft = normalizeConversationDraft({
    title,
    centralQuestion: "",
    body: "",
    draftStatus: "draft",
    linkedBook: context.linkedBook || "",
    linkedAuthor: context.linkedAuthor || "",
    linkedThemes: context.linkedThemes || [],
    visibility: "private",
    publicationStatus: "unpublished",
    approvalStatus: "draft"
  });
  draft.aiBrainMemoryObject = buildConversationMemoryObject(draft);
  state.conversationDesk.drafts.unshift(draft);
  state.conversationDesk.selectedId = draft.id;
  state.conversationDesk.ui.activeSpace = "editor";
  saveConversationDeskState();
  return draft;
}

function openConversationDesk(context = {}){
  closeDrawer();
  if (context.linkedBook || context.linkedAuthor) {
    createConversationDraft(context);
  } else if (!selectedConversationDraft()) {
    createConversationDraft();
  }
  startDeskLoader();
  setView("desk");
}

function startDeskLoader(){
  clearInterval(deskLoaderTimer);
  state.conversationDesk.ui.loading = true;
  state.conversationDesk.ui.loaderStep = 0;
  renderConversationDesk();
  deskLoaderTimer = setInterval(() => {
    const ui = state.conversationDesk.ui;
    ui.loaderStep += 1;
    if (ui.loaderStep >= DESK_LOADER_LINES.length) {
      clearInterval(deskLoaderTimer);
      ui.loading = false;
    }
    renderConversationDesk();
  }, 180);
}

function buildConversationMemoryObject(draft){
  const userPosition = String(draft.body || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
  const relatedWorks = draft.linkedBook ? [draft.linkedBook] : [];
  const relatedAuthors = draft.linkedAuthor ? [draft.linkedAuthor] : [];
  return {
    sourceApp: "classics.ourstuff.space",
    memoryType: "great_conversation_contribution",
    title: draft.title || "",
    centralQuestion: draft.centralQuestion || "",
    relatedAuthors,
    relatedWorks,
    relatedThemes: draft.linkedThemes || [],
    userPosition,
    draftStatus: draft.draftStatus || "draft",
    visibility: draft.visibility || "private",
    publicationStatus: draft.publicationStatus || "unpublished",
    approvalStatus: draft.approvalStatus || "draft",
    createdAt: draft.createdAt || "",
    updatedAt: draft.updatedAt || nowIso()
  };
}

function renderConversationDesk(){
  const root = $("#conversationDeskRoot");
  if (!root) return;
  const desk = normalizeConversationDeskState(state.conversationDesk);
  state.conversationDesk = desk;
  const draft = selectedConversationDraft();

  if (desk.ui.loading) {
    const step = Math.min(desk.ui.loaderStep, DESK_LOADER_LINES.length - 1);
    root.innerHTML = `
      <div class="deskLoader" role="status" aria-live="polite">
        <div class="deskLoaderTitle">${escapeHtml(DESK_LOADER_LINES[step])}</div>
        <div class="deskLoaderTrack">
          ${DESK_LOADER_LINES.map((line, idx) => `<span class="${idx <= step ? "on" : ""}">${escapeHtml(line)}</span>`).join("")}
        </div>
      </div>
    `;
    return;
  }

  const activeSpace = desk.ui.activeSpace === "editor" ? "editor" : "reader";
  root.innerHTML = `
    <section class="conversationDesk">
      <div class="deskSpaceTabs" role="tablist" aria-label="Conversation Desk spaces">
        <button class="deskSpaceTab ${activeSpace === "reader" ? "on" : ""}" type="button" role="tab" aria-selected="${activeSpace === "reader"}" data-desk-action="setSpace" data-space="reader">Reader</button>
        <button class="deskSpaceTab ${activeSpace === "editor" ? "on" : ""}" type="button" role="tab" aria-selected="${activeSpace === "editor"}" data-desk-action="setSpace" data-space="editor">Editor</button>
      </div>
      ${activeSpace === "editor" ? deskEditorHtml(draft) : deskReaderHtml(desk, draft)}
    </section>
  `;

  if (activeSpace === "reader" && state.currentUser && !publishedContributionCacheLoaded && !publishedContributionCacheBusy && window.firestoreGetDocs && window.firestoreQuery) {
    loadPublishedContributionIndex().then(() => {
      if (state.view === "desk" && state.conversationDesk.ui.activeSpace === "reader") renderConversationDesk();
    });
  }
}

function deskReaderHtml(desk, activeDraft){
  const grouped = readerContributionGroups(desk);
  const selected = activeDraft || grouped.unpublished[0] || grouped.published[0] || null;
  return `
    <section class="deskReaderLayout">
      <aside class="deskContributionRail" aria-label="Contribution list">
        <div class="deskRailHeader">
          <div>
            <p class="deskEyebrow">Signed-in contribution reader</p>
            <h2>Reader</h2>
          </div>
          <button class="btn btnIconOnly" type="button" data-desk-action="newDraft" aria-label="New contribution" title="New contribution">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
        ${!state.currentUser ? `<div class="deskNotice">Sign in to load synced private contributions and the published reader index.</div>` : ""}
        ${DESK_READER_SECTIONS.map(section => readerSectionHtml(section.label, grouped[section.key], activeDraft)).join("")}
      </aside>
      <article class="deskReaderPanel" aria-label="Selected contribution">
        ${selected ? contributionArticleHtml(selected) : deskEmptyReaderHtml()}
      </article>
    </section>
  `;
}

function readerContributionGroups(desk){
  const ownDrafts = desk.drafts.map(draft => ({ ...draft, source: "private" }));
  return {
    unpublished: ownDrafts
      .filter(draft => draft.publicationStatus !== "published")
      .sort(sortByUpdatedDesc),
    published: [
      ...ownDrafts.filter(draft => draft.publicationStatus === "published"),
      ...publishedContributionCache
    ].sort(sortByPublishedDesc)
  };
}

function sortByUpdatedDesc(a, b){
  return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
}

function sortByPublishedDesc(a, b){
  return String(b.publishedAt || b.updatedAt || "").localeCompare(String(a.publishedAt || a.updatedAt || ""));
}

function readerSectionHtml(title, items, activeDraft){
  return `
    <section class="deskReaderSection">
      <h3>${escapeHtml(title)}</h3>
      <div class="deskDraftList">
        ${items.length ? items.map(item => contributionListItemHtml(item, activeDraft)).join("") : `<div class="deskEmptySmall">No ${escapeHtml(title.toLowerCase())} contributions yet.</div>`}
      </div>
    </section>
  `;
}

function contributionListItemHtml(item, activeDraft){
  const isLocal = item.source !== "publishedIndex";
  const action = isLocal ? "selectDraft" : "selectPublished";
  const id = item.id || item.indexId || "";
  const active = isLocal && activeDraft?.id === id;
  return `
    <button class="deskDraftItem ${active ? "on" : ""}" type="button" data-desk-action="${action}" data-id="${escapeHtml(id)}">
      <span class="deskDraftTitle">${escapeHtml(item.title || "Untitled contribution")}</span>
      <span class="deskDraftMeta">${escapeHtml(contributionMetaLine(item))}</span>
    </button>
  `;
}

function contributionMetaLine(item){
  const status = publicationLabel(item.publicationStatus, item.approvalStatus);
  const scope = item.visibility === "members" ? "Logged-in users" : "Private";
  return [scope, status, item.linkedBook || item.linkedAuthor || ""].filter(Boolean).join(" / ");
}

function contributionArticleHtml(item){
  return `
    <div class="deskArticleHeader">
      <p class="deskEyebrow">${escapeHtml(contributionMetaLine(item))}</p>
      <h1>${escapeHtml(item.title || "Untitled contribution")}</h1>
      ${item.centralQuestion ? `<p class="deskArticleQuestion">${escapeHtml(item.centralQuestion)}</p>` : ""}
    </div>
    <div class="deskMarkdown" data-markdown-root>
      ${renderMarkdown(item.body || "") || `<p class="deskEmptySmall">No contribution body yet.</p>`}
    </div>
  `;
}

function deskEmptyReaderHtml(){
  return `
    <div class="deskEmpty">
      <h1>Reader</h1>
      <button class="btn" type="button" data-desk-action="newDraft">New contribution</button>
    </div>
  `;
}

function deskEditorHtml(draft){
  if (!draft) return deskEmptyEditorHtml();
  return `
    <section class="deskEditorLayout">
      <div class="deskEditorPanel">
        <div class="deskTopbar">
          <div>
            <p class="deskEyebrow">Markdown contribution editor</p>
            <h1>${escapeHtml(draft.title || "Untitled contribution")}</h1>
          </div>
          <div class="deskTopActions">
            <button class="btn" type="button" data-desk-action="saveDraft">Save</button>
            <button class="btn" type="button" data-desk-action="requestPublish">${draft.publicationStatus === "pending_review" ? "Update Request" : "Request Publish"}</button>
            <button class="btn btnGhost" type="button" data-desk-action="deleteDraft">Delete</button>
          </div>
        </div>

        <div class="deskMetaGrid">
          <label class="control">
            <span class="label">Title</span>
            <input class="input" type="text" data-desk-field="title" value="${escapeHtml(draft.title)}" autocomplete="off">
          </label>
          <label class="control">
            <span class="label">Visibility</span>
            <select class="select" data-desk-field="visibility">
              <option value="private"${draft.visibility !== "members" ? " selected" : ""}>Private</option>
              <option value="members"${draft.visibility === "members" ? " selected" : ""}>Logged-in users after approval</option>
            </select>
          </label>
          <label class="control">
            <span class="label">Publication</span>
            <input class="input" type="text" value="${escapeHtml(publicationLabel(draft.publicationStatus, draft.approvalStatus))}" readonly>
          </label>
          <label class="control">
            <span class="label">Linked book</span>
            <input class="input" type="text" data-desk-field="linkedBook" value="${escapeHtml(draft.linkedBook)}" autocomplete="off">
          </label>
          <label class="control">
            <span class="label">Linked author</span>
            <input class="input" type="text" data-desk-field="linkedAuthor" value="${escapeHtml(draft.linkedAuthor)}" autocomplete="off">
          </label>
          <label class="control deskQuestionField">
            <span class="label">Central question</span>
            <input class="input" type="text" data-desk-field="centralQuestion" value="${escapeHtml(draft.centralQuestion)}" autocomplete="off">
          </label>
        </div>

        <div class="deskMarkdownToolbar" role="toolbar" aria-label="Markdown tools">
          ${MARKDOWN_TOOLBAR.map(tool => `
            <button class="deskToolButton" type="button" data-desk-action="markdownTool" data-tool="${escapeHtml(tool.action)}" title="${escapeHtml(tool.title)}" aria-label="${escapeHtml(tool.title)}">${escapeHtml(tool.label)}</button>
          `).join("")}
        </div>

        <label class="deskWritingSurface">
          <span class="label">Markdown body</span>
          <textarea id="deskBody" class="textarea deskMarkdownTextarea" data-desk-field="body" placeholder="# My contribution&#10;&#10;State the question, test the claim, answer the strongest objection.">${escapeHtml(draft.body)}</textarea>
        </label>
      </div>

      <aside class="deskPreviewRail" aria-label="Markdown preview">
        <div class="deskPanelHeader">
          <h2>Reader Preview</h2>
          <button class="btn btnGhost" type="button" data-desk-action="copyContribution">Copy Markdown</button>
        </div>
        <div class="deskMarkdown">
          ${renderMarkdown(draft.body || "") || `<p class="deskEmptySmall">Preview appears as you write.</p>`}
        </div>
        ${publicationPipelineHtml(draft)}
        ${sourceCardsHtml(draft)}
        ${themeEditorHtml(draft)}
      </aside>
    </section>
  `;
}

function deskEmptyEditorHtml(){
  return `
    <div class="deskEmpty">
      <h1>Editor</h1>
      <button class="btn" type="button" data-desk-action="newDraft">New contribution</button>
    </div>
  `;
}

function publicationPipelineHtml(draft){
  return `
    <section class="railSection">
      <h3>Publishing</h3>
      <div class="deskPublicationState">${escapeHtml(publicationLabel(draft.publicationStatus, draft.approvalStatus))}</div>
      <p class="deskPublicationNote">Public listing is wired for approved documents. Admin approval controls belong in the review gap before any request becomes published.</p>
    </section>
  `;
}

function sourceCardsHtml(draft){
  return `
    <section class="railSection">
      <h3>Source cards</h3>
      ${(draft.linkedSourceCards || []).map(card => `
        <div class="sourceCard">
          <strong>${escapeHtml(card.title || card.url || "Source")}</strong>
          ${card.note ? `<p>${escapeHtml(card.note)}</p>` : ""}
          ${card.url ? `<small>${escapeHtml(card.url)}</small>` : ""}
          <button class="btn btnGhost" type="button" data-desk-action="removeSource" data-id="${escapeHtml(card.id)}">Remove</button>
        </div>
      `).join("") || `<div class="deskEmptySmall">No source cards linked.</div>`}
      <input class="input" id="sourceTitle" type="text" placeholder="Source title" autocomplete="off">
      <input class="input" id="sourceUrl" type="url" placeholder="https://..." autocomplete="off">
      <textarea class="textarea smallTextarea" id="sourceNote" placeholder="Why this source matters"></textarea>
      <button class="btn" type="button" data-desk-action="addSource">Add source</button>
    </section>
  `;
}

function themeEditorHtml(draft){
  return `
    <section class="railSection">
      <h3>Linked themes</h3>
      <div class="deskChipRow">
        ${(draft.linkedThemes || []).map(theme => `<button class="deskChip" type="button" data-desk-action="removeTheme" data-theme="${escapeHtml(theme)}">${escapeHtml(theme)} x</button>`).join("") || `<span class="deskEmptySmall">No themes linked.</span>`}
      </div>
      <input class="input" id="themeInput" type="text" placeholder="justice, virtue, law" autocomplete="off">
      <button class="btn" type="button" data-desk-action="addTheme">Add theme</button>
    </section>
  `;
}

function bindConversationDeskUI(){
  const root = $("#conversationDeskRoot");
  if (!root || root.dataset.bound === "true") return;
  root.dataset.bound = "true";
  root.addEventListener("input", handleDeskInput);
  root.addEventListener("change", handleDeskChange);
  root.addEventListener("click", handleDeskClick);
}

function handleDeskInput(event){
  const field = event.target.closest("[data-desk-field]");
  if (!field) return;
  const draft = selectedConversationDraft();
  if (!draft) return;
  draft[field.dataset.deskField] = field.value;
  if (field.dataset.deskField === "body") draft.body = field.value;
  saveConversationDeskState();
}

function handleDeskChange(event){
  if (event.target.closest("[data-desk-field]")) {
    handleDeskInput(event);
    if (event.target.tagName === "SELECT") renderConversationDesk();
  }
}

async function handleDeskClick(event){
  const btn = event.target.closest("[data-desk-action]");
  if (!btn) return;
  const action = btn.dataset.deskAction;
  const draft = selectedConversationDraft();
  if (action === "setSpace") {
    state.conversationDesk.ui.activeSpace = btn.dataset.space === "editor" ? "editor" : "reader";
    saveConversationDeskState({ render: true });
  } else if (action === "newDraft") {
    createConversationDraft();
    renderConversationDesk();
  } else if (action === "selectDraft") {
    state.conversationDesk.selectedId = btn.dataset.id;
    saveConversationDeskState({ render: true });
  } else if (action === "selectPublished") {
    const published = publishedContributionCache.find(item => item.id === btn.dataset.id);
    if (!published) return;
    renderSelectedPublishedContribution(published);
  } else if (action === "saveDraft") {
    saveConversationDeskState({ render: true });
  } else if (action === "requestPublish" && draft) {
    await requestContributionPublication(draft);
  } else if (action === "archiveDraft" && draft) {
    draft.draftStatus = "archived";
    draft.publicationStatus = draft.publicationStatus === "published" ? "published" : "archived";
    saveConversationDeskState({ render: true });
  } else if (action === "deleteDraft" && draft) {
    const confirmed = await showConfirm("Delete this contribution? This cannot be undone.", "Delete Contribution");
    if (!confirmed) return;
    state.conversationDesk.drafts = state.conversationDesk.drafts.filter(item => item.id !== draft.id);
    state.conversationDesk.selectedId = state.conversationDesk.drafts[0]?.id || null;
    saveConversationDeskState({ render: true });
  } else if (action === "markdownTool") {
    applyMarkdownTool(btn.dataset.tool);
  } else if (action === "copyContribution") {
    await copyContributionMarkdown();
  } else if (action === "addTheme" && draft) {
    const input = $("#themeInput");
    const value = String(input?.value || "").trim();
    if (!value) return;
    draft.linkedThemes = Array.from(new Set([...(draft.linkedThemes || []), value]));
    saveConversationDeskState({ render: true });
  } else if (action === "removeTheme" && draft) {
    draft.linkedThemes = (draft.linkedThemes || []).filter(theme => theme !== btn.dataset.theme);
    saveConversationDeskState({ render: true });
  } else if (action === "addSource" && draft) {
    const card = {
      id: uid(),
      title: $("#sourceTitle")?.value.trim() || "",
      url: $("#sourceUrl")?.value.trim() || "",
      note: $("#sourceNote")?.value.trim() || ""
    };
    if (!card.title && !card.url && !card.note) return;
    draft.linkedSourceCards = [...(draft.linkedSourceCards || []), card];
    saveConversationDeskState({ render: true });
  } else if (action === "removeSource" && draft) {
    draft.linkedSourceCards = (draft.linkedSourceCards || []).filter(card => card.id !== btn.dataset.id);
    saveConversationDeskState({ render: true });
  }
}

function renderSelectedPublishedContribution(published){
  const panel = $(".deskReaderPanel");
  if (panel) panel.innerHTML = contributionArticleHtml(published);
}

function applyMarkdownTool(tool){
  const textarea = $("#deskBody");
  const draft = selectedConversationDraft();
  if (!textarea || !draft) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const fallback = selected || markdownFallbackText(tool);
  const wrapped = markdownToolText(tool, fallback, Boolean(selected));
  textarea.value = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;
  const cursorStart = start + wrapped.length;
  textarea.focus();
  textarea.setSelectionRange(cursorStart, cursorStart);
  draft.body = textarea.value;
  saveConversationDeskState({ render: true });
}

function markdownFallbackText(tool){
  if (tool === "heading") return "Heading";
  if (tool === "link") return "link text";
  if (tool === "list" || tool === "numberedList") return "List item";
  if (tool === "quote") return "Quoted idea";
  if (tool === "code") return "code";
  return "selected text";
}

function markdownToolText(tool, text, hadSelection){
  if (tool === "heading") return `\n## ${text}\n`;
  if (tool === "bold") return `**${text}**`;
  if (tool === "italic") return `*${text}*`;
  if (tool === "quote") return text.split(/\r?\n/).map(line => `> ${line}`).join("\n");
  if (tool === "list") return text.split(/\r?\n/).map(line => `- ${line}`).join("\n");
  if (tool === "numberedList") return text.split(/\r?\n/).map((line, idx) => `${idx + 1}. ${line}`).join("\n");
  if (tool === "link") return `[${text}](https://)`;
  if (tool === "code") return hadSelection && text.includes("\n") ? `\n\`\`\`\n${text}\n\`\`\`\n` : `\`${text}\``;
  if (tool === "divider") return "\n\n---\n\n";
  return text;
}

async function copyContributionMarkdown(){
  const draft = selectedConversationDraft();
  if (!draft?.body) return;
  try {
    await navigator.clipboard.writeText(draft.body);
    await showAlert("Markdown copied.");
  } catch {
    await showAlert("Copy failed. Select the Markdown and copy it manually.");
  }
}

async function requestContributionPublication(draft){
  if (!draft) return;
  if (!state.currentUser) {
    await showAlert("Sign in to request publication for logged-in readers.");
    return;
  }
  draft.visibility = "members";
  draft.publicationStatus = "pending_review";
  draft.approvalStatus = "needs_review";
  draft.publishRequestedAt = nowIso();
  draft.publicIndexId = contributionIndexId(state.currentUser?.uid || "local", draft.id);
  draft.publicationReview = {
    adminApprovalRequired: true,
    reviewState: "queued",
    reviewedAt: "",
    reviewerUid: ""
  };
  await writeContributionIndexRequest(draft);
  saveConversationDeskState({ render: true });
  await showAlert("Publish request saved. It will remain unpublished until admin approval is added.");
}

function publicationLabel(publicationStatus, approvalStatus){
  if (publicationStatus === "published") return "Published";
  if (publicationStatus === "pending_review") return "Unpublished / awaiting approval";
  if (publicationStatus === "archived") return "Hidden";
  if (approvalStatus === "approved") return "Approved";
  return "Unpublished";
}

function contributionIndexId(userId, draftId){
  return `${CLASSICS_APP_ID}_${userId}_${draftId}`.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function contributionIndexPayload(draft, user = state.currentUser){
  const ownerName = getProfileDisplayName?.(user) || state.userProfile?.name || "Classics reader";
  const now = nowIso();
  return {
    appId: CLASSICS_APP_ID,
    owner: user?.uid || "",
    ownerName,
    sourceDraftId: draft.id,
    title: draft.title || "Untitled contribution",
    centralQuestion: draft.centralQuestion || "",
    body: draft.body || "",
    excerpt: String(draft.body || "").replace(/\s+/g, " ").trim().slice(0, 240),
    linkedBook: draft.linkedBook || "",
    linkedAuthor: draft.linkedAuthor || "",
    linkedThemes: draft.linkedThemes || [],
    visibility: "members",
    publicationStatus: draft.publicationStatus || "pending_review",
    approvalStatus: draft.approvalStatus || "needs_review",
    adminApprovalRequired: true,
    publishedAt: draft.publicationStatus === "published" ? (draft.publishedAt || now) : "",
    publishRequestedAt: draft.publishRequestedAt || now,
    updatedAt: now
  };
}

async function writeContributionIndexRequest(draft){
  if (!state.currentUser || !window.firebaseDB || !window.firestoreDoc || !window.firestoreSetDoc) return;
  const ref = publicContributionFirestoreRef(draft.publicIndexId || contributionIndexId(state.currentUser.uid, draft.id));
  if (!ref) return;
  await window.firestoreSetDoc(ref, contributionIndexPayload(draft), { merge: true });
}

function publicContributionFirestoreRef(indexId){
  if (!indexId || !window.firebaseDB) return null;
  return window.firestoreDoc(window.firebaseDB, "classicContributions", indexId);
}

async function loadPublishedContributionIndex(){
  if (!state.currentUser || !window.firebaseDB || !window.firestoreCollection || !window.firestoreGetDocs) return [];
  publishedContributionCacheBusy = true;
  try {
    const base = window.firestoreCollection(window.firebaseDB, "classicContributions");
    const q = window.firestoreQuery(
      base,
      window.firestoreWhere("appId", "==", CLASSICS_APP_ID),
      window.firestoreWhere("visibility", "==", "members"),
      window.firestoreWhere("publicationStatus", "==", "published"),
      window.firestoreWhere("approvalStatus", "==", "approved"),
      window.firestoreOrderBy("publishedAt", "desc")
    );
    const snap = await window.firestoreGetDocs(q);
    publishedContributionCache = snap.docs.map(docSnap => normalizePublishedContribution({ id: docSnap.id, ...docSnap.data() }));
    publishedContributionCacheLoaded = true;
    return publishedContributionCache;
  } catch (error) {
    console.error("Error loading published contributions:", error);
    return publishedContributionCache;
  } finally {
    publishedContributionCacheBusy = false;
  }
}

function normalizePublishedContribution(source = {}){
  return {
    id: String(source.id || source.publicIndexId || ""),
    source: "publishedIndex",
    title: String(source.title || ""),
    centralQuestion: String(source.centralQuestion || ""),
    body: String(source.body || ""),
    linkedBook: String(source.linkedBook || ""),
    linkedAuthor: String(source.linkedAuthor || ""),
    linkedThemes: Array.isArray(source.linkedThemes) ? source.linkedThemes.map(String).filter(Boolean) : [],
    visibility: "members",
    publicationStatus: "published",
    approvalStatus: "approved",
    publishedAt: source.publishedAt || "",
    updatedAt: source.updatedAt || ""
  };
}

function renderMarkdown(markdown){
  const text = String(markdown || "").replace(/\r\n/g, "\n");
  if (!text.trim()) return "";
  const lines = text.split("\n");
  const html = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let quote = [];
  let inCode = false;
  let codeLines = [];

  function flushParagraph(){
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }
  function flushList(){
    if (!listType) return;
    html.push(`<${listType}>${listItems.map(item => `<li>${inlineMarkdown(item)}</li>`).join("")}</${listType}>`);
    listType = null;
    listItems = [];
  }
  function flushQuote(){
    if (!quote.length) return;
    html.push(`<blockquote>${quote.map(item => `<p>${inlineMarkdown(item)}</p>`).join("")}</blockquote>`);
    quote = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        flushParagraph();
        flushList();
        flushQuote();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = Math.min(heading[1].length, 6);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      html.push("<hr>");
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    const numbered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const nextType = bullet ? "ul" : "ol";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((bullet || numbered)[1]);
      continue;
    }
    const quoteMatch = /^>\s?(.+)$/.exec(trimmed);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  flushQuote();
  if (inCode) html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  return html.join("");
}

function inlineMarkdown(text){
  const placeholders = [];
  let safe = escapeHtml(text);
  safe = safe.replace(/`([^`]+)`/g, (_match, code) => {
    const key = `@@CODE${placeholders.length}@@`;
    placeholders.push([key, `<code>${code}</code>`]);
    return key;
  });
  safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  for (const [key, value] of placeholders) safe = safe.replaceAll(key, value);
  return safe;
}

/* glossary.js — Glossary page, modal, idea map, dictionary lookup, Wikipedia summary, related book matching. */
(()=> {
  const TERMS_URLS = [CLASSICS_DATA_FILES.glossaryTerms, CLASSICS_DATA_FILES.glossaryEntries];
  const DICT_CACHE_KEY = "classicsDictionaryCacheV2";
  const WIKI_CACHE_KEY = "classicsWikipediaGlossaryCacheV1";
  const PAGES = ["references", "ideas", "dictionary", "wikipedia", "library"];
  const PAGE_LABELS = { references:"References", ideas:"Idea Map", dictionary:"Dictionary", wikipedia:"Wikipedia", library:"Related Library" };
  const glossaryState = {
    initialized:false, loading:false, error:"", terms:[], filteredTerms:[], activeLetter:"", query:"",
    selectedTerm:null, pageIndex:0, dictionaryCache:loadCache(DICT_CACHE_KEY), wikipediaCache:loadCache(WIKI_CACHE_KEY)
  };
  function appState(){ return state; }

  function $(selector, root=document){ return root.querySelector(selector); }
  function escapeHtml(value){
    return String(value ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function normalizeText(value){ return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
  function slugify(value){ return normalizeText(value).replace(/\s+/g,"-") || "term"; }
  function loadCache(key){ try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch(e){ return {}; } }
  function saveCache(key, value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(e){} }
  function saveDictionaryCache(){ saveCache(DICT_CACHE_KEY, glossaryState.dictionaryCache); }
  function saveWikipediaCache(){ saveCache(WIKI_CACHE_KEY, glossaryState.wikipediaCache); }

  function normalizeTerm(raw){
    const baseTerm = raw.term || raw.title || "Untitled Term";
    const qualifier = raw.qualifier || null;
    const displayTerm = qualifier ? `${baseTerm} (${qualifier})` : baseTerm;
    return {
      id: raw.id || slugify(displayTerm),
      letter: String(raw.letter || baseTerm[0] || "#").toUpperCase(),
      term: baseTerm,
      qualifier,
      displayTerm,
      entry: raw.entry || `${displayTerm}: ${raw.see || ""}`.trim(),
      see: raw.see || null,
      seeAlso: raw.seeAlso || raw.see_also || null,
      search: normalizeText([baseTerm, qualifier, raw.entry, raw.see, raw.seeAlso || raw.see_also].filter(Boolean).join(" "))
    };
  }

  function getRawTermsPayload(data){
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.entries)) return data.entries;
    if (Array.isArray(data.terms)) return data.terms;
    return [];
  }

  async function loadGlossaryTerms(){
    if (glossaryState.terms.length || glossaryState.loading) return;
    glossaryState.loading = true;
    glossaryState.error = "";
    renderGlossary();
    try {
      const results = await Promise.allSettled(
        TERMS_URLS.map(url => fetch(url, { cache:"no-store" }).then(r => r.ok ? r.json() : null))
      );
      const allRaw = [];
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) allRaw.push(...getRawTermsPayload(result.value));
      }
      if (!allRaw.length) throw new Error("No glossary data could be loaded.");
      glossaryState.terms = allRaw.map(normalizeTerm).sort((a,b) =>
        a.letter.localeCompare(b.letter) || a.term.localeCompare(b.term, undefined, { sensitivity:"base" })
      );
      applyGlossaryFilters();
    } catch(err){
      glossaryState.error = err.message || String(err);
    } finally {
      glossaryState.loading = false;
      renderGlossary();
    }
  }

  function applyGlossaryFilters(){
    const q = normalizeText(glossaryState.query);
    glossaryState.filteredTerms = glossaryState.terms.filter(term => {
      if (glossaryState.activeLetter && term.letter !== glossaryState.activeLetter) return false;
      if (q && !term.search.includes(q)) return false;
      return true;
    });
  }

  function groupByLetter(terms){
    const grouped = new Map();
    for (const term of terms){
      if (!grouped.has(term.letter)) grouped.set(term.letter, []);
      grouped.get(term.letter).push(term);
    }
    return Array.from(grouped.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }
  function availableLetters(){ return Array.from(new Set(glossaryState.terms.map(t => t.letter))).sort(); }

  function buildGlossaryView(){
    const after = $("#authorsView") || $("#planView") || $("#libraryView");
    if (!after) return;
    const tabRow = $(".navRow");
    if (tabRow && !$("#tabGlossary")) {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.id = "tabGlossary";
      btn.type = "button";
      btn.setAttribute("aria-label", "View glossary");
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M8 7h8"></path><path d="M8 11h8"></path><path d="M8 15h5"></path></svg>
        Glossary
      `;
      tabRow.appendChild(btn);
      btn.addEventListener("click", () => setGlossaryView());
    }
    if (!$("#glossaryView")) {
      const section = document.createElement("section");
      section.id = "glossaryView";
      section.className = "view";
      section.setAttribute("aria-label", "Glossary view");
      section.innerHTML = `
        <div class="glossaryMasthead">
          <h1 class="glossaryTitle">Glossary</h1>
          <div class="glossaryDesc">Browse terms from the Great Conversation. Click any term to explore its references, Great Ideas, dictionary definition, Wikipedia summary, and related books.</div>
        </div>
        <section class="glossaryControls" aria-label="glossary filters">
          <div class="control"><div class="label">Search terms, references, and ideas</div><input id="glossaryQ" class="input" type="search" placeholder="e.g., Justice, Soul, Matter…" autocomplete="search"></div>
          <div class="control"><div class="label">Letter</div><select id="glossaryLetterSel" class="select"><option value="">All Letters</option></select></div>
        </section>
        <div class="glossaryLayout">
          <aside class="glossaryLetters" aria-label="Glossary letters"><div class="glossaryLettersTitle">Letters</div><div id="glossaryLetterGrid" class="glossaryLetterGrid"></div></aside>
          <div id="glossaryIndex" aria-live="polite"></div>
        </div>
      `;
      after.insertAdjacentElement("afterend", section);
    }
    buildGlossaryModal();
    wireGlossaryEvents();
  }

  function buildGlossaryModal(){
    if ($("#glossaryModal")) return;
    const modal = document.createElement("div");
    modal.id = "glossaryModal";
    modal.className = "glossaryModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "glossaryModalTitle");
    modal.innerHTML = `
      <button id="glossaryPrevBtn" class="glossaryModalNav glossaryModalPrev" type="button" aria-label="Previous glossary panel"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
      <div class="glossaryModalMain">
        <div class="glossaryModalHeader"><div><h2 id="glossaryModalTitle" class="glossaryModalTitle"></h2><div id="glossaryModalSub" class="glossaryModalSub"></div></div><button id="glossaryCloseBtn" class="glossaryCloseBtn" type="button" aria-label="Close glossary term">×</button></div>
        <div id="glossaryModalBody" class="glossaryModalBody"></div>
      </div>
      <button id="glossaryNextBtn" class="glossaryModalNav glossaryModalNext" type="button" aria-label="Next glossary panel"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
    `;
    document.body.appendChild(modal);
  }

  function wireGlossaryEvents(){
    if (glossaryState.initialized) return;
    glossaryState.initialized = true;
    $("#glossaryQ")?.addEventListener("input", e => { glossaryState.query = e.target.value; applyGlossaryFilters(); renderGlossary(); });
    $("#glossaryLetterSel")?.addEventListener("change", e => { glossaryState.activeLetter = e.target.value; applyGlossaryFilters(); renderGlossary(); });
    $("#glossaryLetterGrid")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-letter]");
      if (!btn) return;
      glossaryState.activeLetter = btn.dataset.letter;
      const sel = $("#glossaryLetterSel");
      if (sel) sel.value = glossaryState.activeLetter;
      applyGlossaryFilters();
      renderGlossary();
    });
    $("#glossaryIndex")?.addEventListener("click", e => {
      const btn = e.target.closest("[data-term-id]");
      if (!btn) return;
      const term = glossaryState.terms.find(t => t.id === btn.dataset.termId);
      if (term) openTermModal(term);
    });
    $("#glossaryModalBody")?.addEventListener("click", e => {
      const ideaBtn = e.target.closest("[data-glossary-idea]");
      if (ideaBtn) {
        closeTermModal();
        goToLibraryGreatIdea(ideaBtn.dataset.glossaryIdea || "");
        return;
      }
      const workBtn = e.target.closest("[data-glossary-work-author][data-glossary-work-title]");
      if (workBtn) {
        closeTermModal();
        goToLibraryWork(workBtn.dataset.glossaryWorkAuthor || "", workBtn.dataset.glossaryWorkTitle || "");
      }
    });
    $("#glossaryCloseBtn")?.addEventListener("click", closeTermModal);
    $("#glossaryPrevBtn")?.addEventListener("click", () => moveModalPage(-1));
    $("#glossaryNextBtn")?.addEventListener("click", () => moveModalPage(1));
    document.addEventListener("keydown", e => {
      if (!$("#glossaryModal")?.classList.contains("open")) return;
      if (e.key === "Escape") closeTermModal();
      if (e.key === "ArrowLeft") moveModalPage(-1);
      if (e.key === "ArrowRight") moveModalPage(1);
    });
  }

  function setGlossaryView(){
    const currentState = appState();
    if (currentState) currentState.view = "glossary";
    ["#libraryView", "#planView", "#authorsView", "#glossaryView", "#getStartedView"].forEach(sel => $(sel)?.classList.toggle("on", sel === "#glossaryView"));
    ["#tabLibrary", "#tabPlan", "#tabAuthors", "#tabGlossary", "#tabGetStarted"].forEach(sel => $(sel)?.classList.remove("tabOn"));
    $("#tabGlossary")?.classList.add("tabOn");
    const planName = $("#planName");
    if (planName) planName.textContent = "Glossary";
    loadGlossaryTerms();
  }

  function renderGlossary(){
    const index = $("#glossaryIndex"), letterGrid = $("#glossaryLetterGrid"), letterSel = $("#glossaryLetterSel");
    if (!index || !letterGrid || !letterSel) return;
    const letters = availableLetters();
    letterSel.innerHTML = `<option value="">All Letters</option>` + letters.map(letter => `<option value="${escapeHtml(letter)}"${letter === glossaryState.activeLetter ? " selected" : ""}>${escapeHtml(letter)}</option>`).join("");
    letterGrid.innerHTML = [`<button class="btn glossaryLetterBtn${!glossaryState.activeLetter ? " active" : ""}" data-letter="" type="button">All</button>`]
      .concat(letters.map(letter => `<button class="btn glossaryLetterBtn${letter === glossaryState.activeLetter ? " active" : ""}" data-letter="${escapeHtml(letter)}" type="button">${escapeHtml(letter)}</button>`)).join("");
    if (glossaryState.loading) { index.innerHTML = `<div class="glossaryEmpty">Loading glossary terms…</div>`; return; }
    if (glossaryState.error) { index.innerHTML = `<div class="glossaryEmpty"><strong>Glossary data not loaded.</strong><br>Error: ${escapeHtml(glossaryState.error)}</div>`; return; }
    if (!glossaryState.filteredTerms.length) { index.innerHTML = `<div class="glossaryEmpty">No glossary terms match the current filters.</div>`; return; }
    const grouped = groupByLetter(glossaryState.filteredTerms);
    index.innerHTML = grouped.map(([letter, terms]) => `
      <section class="glossarySection" id="glossary-letter-${escapeHtml(letter)}">
        <div class="glossarySectionHeader">${escapeHtml(letter)}</div>
        <div class="glossaryTermList">${terms.map(term => `<button class="glossaryTermBtn" type="button" data-term-id="${escapeHtml(term.id)}"><span>${escapeHtml(term.term)}</span>${term.qualifier ? `<span class="glossaryTermQualifier"> (${escapeHtml(term.qualifier)})</span>` : ""}</button>`).join("")}</div>
      </section>`).join("");
  }

  function openTermModal(term){
    glossaryState.selectedTerm = term;
    glossaryState.pageIndex = 0;
    $("#modalBackdrop")?.classList.add("open");
    $("#glossaryModal")?.classList.add("open");
    renderTermModal();
  }
  function closeTermModal(){
    $("#glossaryModal")?.classList.remove("open");
    if (!["loginModal", "signupModal", "searchSettingsModal", "timerModal"].some(id => $("#" + id)?.classList.contains("open"))) $("#modalBackdrop")?.classList.remove("open");
  }
  function moveModalPage(delta){
    const next = Math.max(0, Math.min(PAGES.length - 1, glossaryState.pageIndex + delta));
    if (next === glossaryState.pageIndex) return;
    glossaryState.pageIndex = next;
    renderTermModal();
    if (PAGES[next] === "dictionary") loadDictionaryForSelectedTerm();
    if (PAGES[next] === "wikipedia") loadWikipediaForSelectedTerm();
  }

  function knownGreatIdeas(){
    const ideas = new Map();
    const currentState = appState();
    for (const idea of (currentState?.greatIdeasUniverse || [])) ideas.set(normalizeText(idea), idea);
    for (const work of (currentState?.libraryWorks || [])) for (const idea of (work.greatIdeas || [])) ideas.set(normalizeText(idea), idea);
    return ideas;
  }

  function extractIdeaCandidates(text){
    return String(text || "")
      .replace(/\/\s*see also\s+/gi, "; ")
      .split(";")
      .map(part => part.trim())
      .map(part => part.replace(/^see\s+/i, "").replace(/^and\s+/i, "").trim())
      .flatMap(part => {
        const chMatch = part.match(/^CH\s+\d+:\s*(.+)/i);
        if (chMatch) return [chMatch[1].replace(/[,/]+$/g, "").trim()];
        if (/^CH\s+\d+/i.test(part)) return [];
        const match = part.match(/^(.+?)\s+\d/);
        const cleaned = (match ? match[1] : part).replace(/[,/]+$/g, "").trim();
        return cleaned ? [cleaned] : [];
      })
      .filter(Boolean);
  }

  function mappedIdeas(term){
    const known = knownGreatIdeas();
    const seen = new Set();
    const out = [];
    for (const candidate of extractIdeaCandidates([term.see, term.seeAlso].filter(Boolean).join("; "))) {
      const key = normalizeText(candidate);
      const canonical = known.get(key);
      if (!canonical || seen.has(normalizeText(canonical))) continue;
      seen.add(normalizeText(canonical));
      out.push(canonical);
    }
    return out;
  }

  function relatedLibraryItems(term){
    const works = (appState()?.libraryWorks || []);
    const ideas = mappedIdeas(term);
    const ideaKeys = new Set(ideas.map(normalizeText));
    const termNorm = normalizeText(term.term);

    return works.map(work => {
      const greatIdeas = work.greatIdeas || [];
      const matchedIdeas = greatIdeas.filter(idea => ideaKeys.has(normalizeText(idea)));
      let score = matchedIdeas.length * 100;

      if (!matchedIdeas.length) {
        const haystack = normalizeText([work.title, work.author, greatIdeas.join(" "), work.search].filter(Boolean).join(" "));
        if (termNorm && haystack.includes(termNorm)) score += 10;
      }

      return { work, score, matchedIdeas };
    }).filter(x => x.score > 0).sort((a,b) =>
      b.score - a.score || b.matchedIdeas.length - a.matchedIdeas.length || a.work.author.localeCompare(b.work.author)
    ).slice(0, 18);
  }

  function renderTermModal(){
    const term = glossaryState.selectedTerm;
    if (!term) return;
    const page = PAGES[glossaryState.pageIndex];
    $("#glossaryModalTitle").textContent = term.displayTerm;
    $("#glossaryModalSub").textContent = `${term.letter} • ${PAGE_LABELS[page]} • ${glossaryState.pageIndex + 1} of ${PAGES.length}`;
    $("#glossaryPrevBtn").disabled = glossaryState.pageIndex === 0;
    $("#glossaryNextBtn").disabled = glossaryState.pageIndex === PAGES.length - 1;
    if (page === "references") renderReferencesPage(term);
    if (page === "ideas") renderIdeaMapPage(term);
    if (page === "dictionary") renderDictionaryPage(term);
    if (page === "wikipedia") renderWikipediaPage(term);
    if (page === "library") renderRelatedLibraryPage(term);
  }
  function renderPageShell(term, label, contentHtml){
    $("#glossaryModalBody").innerHTML = `<div class="glossaryPagerLabel">${escapeHtml(label)}</div>${contentHtml}`;
  }

  function renderReferencesPage(term){
    renderPageShell(term, "References", `
      <div class="glossaryBlock"><div class="glossaryBlockTitle">See</div><div class="glossaryRefText">${escapeHtml(term.see || "No primary references listed.")}</div></div>
      <div class="glossaryBlock"><div class="glossaryBlockTitle">See Also</div><div class="glossaryRefText">${escapeHtml(term.seeAlso || "No secondary references listed.")}</div></div>
    `);
  }

  function renderIdeaMapPage(term){
    const ideas = mappedIdeas(term);
    const related = relatedLibraryItems(term);
    renderPageShell(term, "Idea Map", `
      <div class="glossaryFlow">
        <div class="glossaryFlowNode"><div class="glossaryBlockTitle">Term</div><div>${escapeHtml(term.displayTerm)}</div></div>
        <div class="glossaryFlowArrow">→</div>
        <div class="glossaryFlowNode"><div class="glossaryBlockTitle">Great Ideas</div><div>${ideas.length ? `${ideas.length} mapped idea${ideas.length === 1 ? "" : "s"}` : "No mapped ideas found"}</div></div>
        <div class="glossaryFlowArrow">→</div>
        <div class="glossaryFlowNode"><div class="glossaryBlockTitle">Books</div><div>${related.length} related work${related.length === 1 ? "" : "s"}</div></div>
      </div>
      <div class="glossaryBlock">
        <div class="glossaryBlockTitle">Mapped Great Ideas</div>
        ${ideas.length ? `<div class="glossaryIdeaPillRow">${ideas.map(idea => `<button class="glossaryIdeaPill" type="button" data-glossary-idea="${escapeHtml(idea)}">${escapeHtml(idea)}</button>`).join("")}</div>` : `<div class="glossaryRefText">No matching Great Ideas found in the local library tags. This usually means the term references need normalization or the books need Great Ideas tags.</div>`}
      </div>
      <div class="glossaryBlock">
        <div class="glossaryBlockTitle">Mapping Rule</div>
        <div class="glossaryRefText">This page maps the glossary term through its cross-references, then finds books whose Great Ideas tags match those references.</div>
      </div>
    `);
  }

  function lookupKeys(term){
    const phrase = term.term.replace(/\s+/g," ").trim();
    const words = phrase.split(/\s+/).filter(w => !/^(and|or|of|the|a|an|to|in)$/i.test(w));
    return Array.from(new Set([phrase, words[0]].filter(Boolean)));
  }
  function dictionaryLookupKeys(term){ return lookupKeys(term); }
  function wikipediaLookupKeys(term){ return lookupKeys(term); }

  function renderDictionaryDefinitions(hit){
    const entries = Array.isArray(hit.entries) ? hit.entries : [];
    const blocks = [];
    for (const entry of entries) {
      for (const meaning of (entry.meanings || [])) {
        const defs = (meaning.definitions || []).filter(d => d.definition).slice(0, 8);
        if (!defs.length) continue;
        blocks.push(`<div class="glossaryBlock"><div class="glossaryBlockTitle">${escapeHtml(entry.word || hit.word || "Dictionary")} ${meaning.partOfSpeech ? `• ${escapeHtml(meaning.partOfSpeech)}` : ""}</div><ol class="glossaryDefinitionList">${defs.map(def => `<li><div class="glossaryRefText">${escapeHtml(def.definition)}</div>${def.example ? `<div class="glossaryDefinitionExample">Example: ${escapeHtml(def.example)}</div>` : ""}${Array.isArray(def.synonyms) && def.synonyms.length ? `<div class="glossaryDefinitionTags">Synonyms: ${escapeHtml(def.synonyms.slice(0, 8).join(", "))}</div>` : ""}</li>`).join("")}</ol></div>`);
      }
    }
    return blocks.join("") || `<div class="glossaryBlock"><div class="glossaryRefText">No definition text found.</div></div>`;
  }
  function renderDictionaryPage(term){
    const keys = dictionaryLookupKeys(term);
    const hit = keys.map(k => glossaryState.dictionaryCache[k.toLowerCase()]).find(Boolean);
    if (!hit) { renderPageShell(term, "Dictionary", `<div class="glossaryBlock"><div class="glossaryRefText">Loading dictionary definitions…</div></div>`); loadDictionaryForSelectedTerm(); return; }
    if (hit.error) { renderPageShell(term, "Dictionary", `<div class="glossaryBlock"><div class="glossaryRefText">No dictionary definition found for this term.</div></div>`); return; }
    renderPageShell(term, "Dictionary", renderDictionaryDefinitions(hit));
  }
  async function loadDictionaryForSelectedTerm(){
    const term = glossaryState.selectedTerm;
    if (!term || PAGES[glossaryState.pageIndex] !== "dictionary") return;
    const keys = dictionaryLookupKeys(term);
    if (keys.some(k => glossaryState.dictionaryCache[k.toLowerCase()])) return;
    for (const key of keys){
      const cacheKey = key.toLowerCase();
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
        if (!response.ok) continue;
        const data = await response.json();
        const entries = Array.isArray(data) ? data : [];
        const hasDefinitions = entries.some(entry => (entry.meanings || []).some(meaning => (meaning.definitions || []).some(def => def.definition)));
        if (hasDefinitions) {
          glossaryState.dictionaryCache[cacheKey] = { word: entries[0]?.word || key, entries: entries.map(entry => ({ word: entry.word || key, phonetic: entry.phonetic || "", meanings: (entry.meanings || []).map(meaning => ({ partOfSpeech: meaning.partOfSpeech || "", definitions: (meaning.definitions || []).map(def => ({ definition: def.definition || "", example: def.example || "", synonyms: Array.isArray(def.synonyms) ? def.synonyms : [] })) })) })) };
          saveDictionaryCache();
          renderTermModal();
          return;
        }
      } catch(e){}
    }
    glossaryState.dictionaryCache[keys[0].toLowerCase()] = { error:true };
    saveDictionaryCache();
    renderTermModal();
  }

  function renderWikipediaPage(term){
    const keys = wikipediaLookupKeys(term);
    const hit = keys.map(k => glossaryState.wikipediaCache[k.toLowerCase()]).find(Boolean);
    if (!hit) { renderPageShell(term, "Wikipedia Summary", `<div class="glossaryBlock"><div class="glossaryRefText">Loading Wikipedia summary…</div></div>`); loadWikipediaForSelectedTerm(); return; }
    if (hit.error) { renderPageShell(term, "Wikipedia Summary", `<div class="glossaryBlock"><div class="glossaryRefText">No Wikipedia summary found for this term.</div></div>`); return; }
    renderPageShell(term, "Wikipedia Summary", `<div class="glossaryBlock glossaryWikipediaBlock">${hit.thumbnail ? `<img class="glossaryWikipediaThumb" src="${escapeHtml(hit.thumbnail)}" alt="" loading="lazy">` : ""}<div><div class="glossaryBlockTitle">${escapeHtml(hit.title || term.term)}</div><div class="glossaryRefText">${escapeHtml(hit.extract || "No summary text found.")}</div>${hit.url ? `<a class="btn glossaryExternalLink" href="${escapeHtml(hit.url)}" target="_blank" rel="noopener noreferrer">Open Wikipedia</a>` : ""}</div></div>`);
  }
  async function loadWikipediaForSelectedTerm(){
    const term = glossaryState.selectedTerm;
    if (!term || PAGES[glossaryState.pageIndex] !== "wikipedia") return;
    const keys = wikipediaLookupKeys(term);
    if (keys.some(k => glossaryState.wikipediaCache[k.toLowerCase()])) return;
    for (const key of keys){
      const cacheKey = key.toLowerCase();
      try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`);
        if (!response.ok) continue;
        const data = await response.json();
        if (data?.extract) {
          glossaryState.wikipediaCache[cacheKey] = { title: data.title || key, extract: data.extract, url: data.content_urls?.desktop?.page || data.content_urls?.mobile?.page || "", thumbnail: data.thumbnail?.source || "" };
          saveWikipediaCache();
          renderTermModal();
          return;
        }
      } catch(e){}
    }
    glossaryState.wikipediaCache[keys[0].toLowerCase()] = { error:true };
    saveWikipediaCache();
    renderTermModal();
  }

  function formatDate(date){
    const n = Number(date);
    if (!Number.isFinite(n)) return "";
    return n < 0 ? `${Math.abs(n)} BCE` : String(n);
  }

  function renderRelatedLibraryPage(term){
    const related = relatedLibraryItems(term);
    renderPageShell(term, "Related Library", related.length ? `<div class="glossaryRelatedList">${related.map(({ work, matchedIdeas }) => `<button class="glossaryRelatedItem glossaryRelatedButton" type="button" data-glossary-work-author="${escapeHtml(work.author || "")}" data-glossary-work-title="${escapeHtml(work.title || "")}"><span class="glossaryRelatedTitle">${escapeHtml(work.author ? `${work.author} — ${work.title}` : work.title)}${work.date ? ` (${escapeHtml(formatDate(work.date))})` : ""}</span><span class="glossaryRelatedMeta">Matched by: ${escapeHtml(matchedIdeas.length ? matchedIdeas.join(", ") : term.term)}</span></button>`).join("")}</div>` : `<div class="glossaryBlock"><div class="glossaryRefText">No related books found yet. Add matching Great Ideas tags to library data or normalize the cross-references.</div></div>`);
  }

  function installSetViewPatch(){
    return true;
  }
  function initGlossary(){ buildGlossaryView(); installSetViewPatch(); renderGlossary(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGlossary);
  else initGlossary();
})();

/* get-started.js — "Get Started" newspaper-style landing page. */
(()=> {
  function $(sel, root){ return (root||document).querySelector(sel); }

  const GREAT_IDEAS_SAMPLE = [
    "Angel","Animal","Aristocracy","Art","Astronomy","Beauty","Being","Cause","Chance","Change",
    "Citizen","Constitution","Courage","Custom and Convention","Definition","Democracy","Desire",
    "Dialectic","Duty","Education","Element","Emotion","Equality","Eternity","Evolution",
    "Experience","Family","Fate","Form","God","Good and Evil","Government","Habit","Happiness",
    "History","Honor","Hypothesis","Idea","Immortality","Induction","Infinity","Judgment",
    "Justice","Knowledge","Labor","Language","Law","Liberty","Life and Death","Logic","Love",
    "Man","Mathematics","Matter","Mechanics","Medicine","Memory and Imagination","Metaphysics",
    "Mind","Monarchy","Nature","Necessity and Contingency","Oligarchy","One and Many","Opinion",
    "Opposition","Philosophy","Physics","Pleasure and Pain","Poetry","Principle","Progress",
    "Prophecy","Prudence","Punishment","Quality","Quantity","Reasoning","Relation","Religion",
    "Revolution","Rhetoric","Same and Other","Science","Sense","Sign and Symbol","Sin","Slavery",
    "Soul","Space","State","Temperance","Theology","Time","Truth","Tyranny and Despotism",
    "Universal and Particular","Virtue and Vice","War and Peace","Wealth","Will","Wisdom","World"
  ];

  function escapeHtml(s){
    return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }
  function appState(){ return state; }

  function buildGetStartedView(){
    const tabRow = $(".navRow");
    if (tabRow && !$("#tabGetStarted")) {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.id = "tabGetStarted";
      btn.type = "button";
      btn.setAttribute("aria-label", "Get started with the Great Conversation");
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle><polyline points="12 8 16 12 12 16"></polyline><line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        Get Started
      `;
      tabRow.appendChild(btn);
      btn.addEventListener("click", () => setGetStartedView());
    }

    if (!$("#getStartedView")) {
      const section = document.createElement("section");
      section.id = "getStartedView";
      section.className = "view";
      section.setAttribute("aria-label", "Get started view");
      section.innerHTML = buildGetStartedHTML();
      const afterEl = $("#glossaryView") || $("#authorsView") || $("#planView") || $("#libraryView");
      if (afterEl) afterEl.insertAdjacentElement("afterend", section);
      else document.body.appendChild(section);

      wireGetStartedEvents(section);
    }
  }

  function buildGetStartedHTML(){
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }).toUpperCase();
    const ideaPills = GREAT_IDEAS_SAMPLE.map(idea =>
      `<button class="gsIdeaPill" type="button" data-gs-idea="${escapeHtml(idea)}">${escapeHtml(idea)}</button>`
    ).join("");

    return `
      <!-- ══ MASTHEAD ══════════════════════════════════════════ -->
      <div class="gsMasthead">
        <h1 class="gsFlag">The Great Conversation</h1>
        <hr class="gsFlagRule">
        <p class="gsEditionLine">Est. 450 B.C. &bull; Continued Daily &bull; ${escapeHtml(dateStr)} &bull; Great Books Edition</p>
        <p class="gsDeck">"The tradition of the West is embodied in the Great Conversation that began in the dawn of history and that continues to the present day." — Mortimer J. Adler</p>
      </div>

      <!-- ══ TOP STORY ═════════════════════════════════════════ -->
      <div class="gsTopStory">
        <div class="gsTopStoryMain">
          <div class="gsSectionLabel">Front Page</div>
          <h2 class="gsHeadline">A Twenty-Five-Century Dialogue You Are Invited to Join</h2>
          <div class="gsByline">By the Editors &bull; Classics.OurStuff.Space</div>
          <p class="gsBodyText gsDropCap">The Western intellectual tradition is not a museum. It is a living conversation — conducted across centuries, languages, and civilizations — about the questions that matter most: What is justice? What makes a good life? What do we owe one another? How should we be governed? What is the soul?</p>
          <p class="gsBodyText">From Plato's dialogues and Aristotle's treatises, through Dante, Shakespeare, Locke, Kant, and Darwin, to Tolstoy and Freud — each great mind enters the conversation already in progress, responds to predecessors, and sets the stage for successors. No single author holds all the answers. That is the point.</p>
          <p class="gsBodyText">Mortimer Adler and Robert Maynard Hutchins assembled the fifty-four-volume <em>Great Books of the Western World</em> (1952) to make this conversation accessible to any reader. They identified <strong>103 Great Ideas</strong> — the recurring themes that link every thinker to every other — and organized them in the Syntopicon, the first index of ideas in intellectual history.</p>
          <div class="gsPullQuote">
            "What is the purpose of education? To develop the intellect and free it for lifelong self-education."
            <div class="gsAttrib">— Mortimer J. Adler, The Paideia Proposal</div>
          </div>
          <p class="gsBodyText">This website is your reading companion for the Great Books Bookclub — a ten-year reading plan designed to take you through the essential works at a sustainable pace. You can track your progress, annotate your reactions, and follow the threads of any great idea across centuries of debate.</p>
        </div>
        <div class="gsTopStorySide">
          <div>
            <div class="gsSectionLabel">Inside This Edition</div>
            <ul style="list-style:none;padding:0;margin:0;font-size:0.88rem;line-height:1.6;">
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ What Is the Great Conversation? .............. p.1</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ The 10-Year Reading Plan ...................... p.2</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ Who Was Mortimer Adler? ....................... p.3</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ How to Use This Website ....................... p.4</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ The 103 Great Ideas .......................... p.5</li>
              <li style="padding:6px 0;border-bottom:1px solid var(--ink);">▶ Where Should I Begin? ........................ p.6</li>
              <li style="padding:6px 0;">▶ Frequently Asked Questions ................... p.7</li>
            </ul>
          </div>
          <div>
            <div class="gsSectionLabel">At a Glance</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px;">
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">10</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Years</div>
              </div>
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">103</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Great Ideas</div>
              </div>
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">~130</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Works</div>
              </div>
              <div style="border:2px solid var(--ink);padding:10px;text-align:center;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-family:'Newsreader',Georgia,serif;font-size:2.2rem;font-weight:900;line-height:1;">2500+</div>
                <div style="font-size:0.72rem;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;">Years of Ideas</div>
              </div>
            </div>
          </div>
          <div class="gsCtaBox">
            <div class="gsSectionLabel">Ready to Begin?</div>
            <p class="gsBodyText" style="font-size:0.84rem;">Jump into the 10-year reading plan or explore the library and glossary.</p>
            <button class="gsCtaBtn" type="button" data-gs-nav="plan">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              View Bookclub Plan
            </button>
            <button class="gsCtaBtn gsCtaBtnSecondary" type="button" data-gs-nav="library">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Browse Library
            </button>
          </div>
        </div>
      </div>

      <!-- ══ THE 10-YEAR PLAN ══════════════════════════════════ -->
      <div class="gsTwoCol">
        <div class="gsTwoColMain">
          <div class="gsSectionLabel">The Plan — Page 2</div>
          <h2 class="gsHeadline">A Decade to Stretch the Mind</h2>
          <p class="gsBodyText">The ten-year reading plan is not designed to be "got through" as quickly as possible. It is a guide for lifelong mental growth: a disciplined way of reading works that are often over most people's heads, and therefore worth growing into. The aim is not merely to finish the list, but to read well enough that the books change you.</p>
          <p class="gsBodyText">Each year gathers works around a governing idea, while the readings inside that year move broadly in chronological order so you can feel the historical development of the conversation. Across the full decade, the plan ranges through law, politics, theology, epic, tragedy, science, psychology, rhetoric, and poetry so that no one discipline becomes the whole of your education.</p>
          <div class="gsPullQuote">
            "Not to know the great works of the past is to be a cultural orphan, adrift in time."
            <div class="gsAttrib">— Clifton Fadiman</div>
          </div>
          <p class="gsBodyText">The bookclub tracker on this site lets you mark your progress through each stage: pre-reading research, first listening, first and second reads, analysis, discussion, reflection, and integration. Each card tracks one work's complete lifecycle in your reading life.</p>
        </div>
        <div class="gsTwoColSide">
          <div class="gsSectionLabel">Year by Year</div>
          <div style="display:flex;flex-direction:column;gap:0;">
            ${[
              ["Year 1","Foundations of Law &amp; Morality","Political and moral life begin with Plato, Aristotle, Augustine, Machiavelli, and modern founding texts on liberty, revolution, and democracy."],
              ["Year 2","Ancient Epics &amp; Modern Liberty","Epic, tragedy, history, atomism, stoicism, and Mill's defense of liberty place literature and ethics side by side."],
              ["Year 3","History, Theology &amp; the Human Condition","War, law, faith, and freedom meet in Thucydides, Aquinas, Milton, Kant, and Dostoevsky."],
              ["Year 4","Scientific Revolution &amp; Psychological Depth","Questions of knowledge and method lead into Galileo, Bacon, Descartes, Newton, Euripides, and Melville."],
              ["Year 5","Nature, Being &amp; Narrative Synthesis","Soul, species, substance, empire, and long-form narrative converge in Aristotle, Virgil, Spinoza, Darwin, and Tolstoy."],
              ["Year 6","Origins, Scriptural Roots &amp; Modernity","Biblical beginnings, Homeric wandering, Shakespearean comedy, Hegelian history, and Kierkegaardian inwardness reshape first principles."],
              ["Year 7","Wisdom, Mathematics &amp; Aesthetic Judgment","Job, Symposium, Archimedes, Epictetus, Dante, and Kant test how truth, beauty, and goodness are judged."],
              ["Year 8","Rhetoric, Psychology &amp; the Power of Habit","Persuasion, teaching, sovereignty, inner life, and spiritual struggle animate Aristotle, Augustine, Hobbes, James, and Goethe."],
              ["Year 9","Social Systems &amp; Modern Disillusionment","Law, electricity, civilization, manners, and artistic self-consciousness define the move into modern scientific and literary life."],
              ["Year 10","The Order of Nature &amp; the Modern Wasteland","Cosmos, corruption, pilgrimage, kingship, and cultural exhaustion bring the decade to its final reckoning."]
            ].map(([y,t,d]) => `
              <div style="padding:10px 0;border-bottom:1px solid var(--ink);">
                <div style="font-size:0.7rem;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);">${y}</div>
                <div style="font-weight:900;font-size:0.92rem;margin:2px 0;">${t}</div>
                <div style="font-size:0.82rem;line-height:1.45;color:var(--ink2);">${d}</div>
              </div>`).join("")}
          </div>
          <button class="gsCtaBtn" type="button" data-gs-nav="plan" style="margin-top:12px;width:100%;justify-content:center;">
            Open Bookclub Plan →
          </button>
        </div>
      </div>

      <!-- ══ THREE COLUMNS: ADLER / SYNTOPICON / HOW-TO ═══════ -->
      <div class="gsThreeCol">
        <div class="gsCol">
          <div class="gsSectionLabel">Biography — Page 3</div>
          <h2 class="gsSubhead">Who Was Mortimer Adler?</h2>
          <p class="gsBodyText">Mortimer Jerome Adler (1902–2001) was an American philosopher, educator, and popularizer of the Great Books. A self-described "public philosopher," he spent his career arguing that the Western tradition's greatest works belong to everyone — not just scholars.</p>
          <p class="gsBodyText">Together with Robert Maynard Hutchins, president of the University of Chicago, Adler developed the Great Books curriculum and co-edited the fifty-four-volume <em>Great Books of the Western World</em> (Encyclopædia Britannica, 1952). His most audacious project was the Syntopicon — an index of 3,000 topics organized under 102 chapters (103 ideas by modern count) — which took ten years to compile and required reading every page of every book.</p>
          <p class="gsBodyText">Adler also wrote <em>How to Read a Book</em> (1940, revised 1972), arguably the most important guide to serious reading ever published, and founded the Paideia Group, which advocated for a classical liberal arts education for all students regardless of background.</p>
          <div class="gsRule"></div>
          <div style="font-size:0.8rem;font-style:italic;color:var(--muted);">Key works: <em>How to Read a Book</em> (1940), <em>The Idea of Freedom</em> (1958), <em>The Paideia Proposal</em> (1982), <em>Adler's Philosophical Dictionary</em> (1995).</div>
        </div>
        <div class="gsCol">
          <div class="gsSectionLabel">Reference — Page 3</div>
          <h2 class="gsSubhead">What Is the Syntopicon?</h2>
          <p class="gsBodyText">The Syntopicon (from Greek: <em>syntopikos</em>, "of the same place") is the two-volume index at the heart of <em>Great Books of the Western World</em>. It organizes all the ideas in the entire set by 103 Great Ideas — from Angel to World — and for each idea lists the specific passages in the Great Books where that idea appears and is debated.</p>
          <p class="gsBodyText">Want to trace what Plato, Aristotle, Aquinas, Hobbes, Locke, and Kant each said about Justice? The Syntopicon shows you exactly where to look. It turns 32,000 pages of text into a navigable intellectual network.</p>
          <p class="gsBodyText">This website recreates the Syntopicon as a digital glossary. Click <strong>Glossary</strong> in the top navigation to explore the ~2,000 Syntopicon terms and the 103 Great Ideas, each linked to related books in the library.</p>
          <div class="gsPullQuote" style="font-size:0.95rem;">
            "The Syntopicon is the greatest index ever compiled."
            <div class="gsAttrib">— Encyclopedia Britannica</div>
          </div>
        </div>
        <div class="gsCol">
          <div class="gsSectionLabel">Tutorial — Page 4</div>
          <h2 class="gsSubhead">How to Use This Website</h2>
          <ol class="gsStepList">
            <li>
              <div>
                <strong>Library</strong> — Browse all ~130 Great Books works. Filter by Great Idea, search by author or title, and click any card to open its detail drawer with book info, reading tasks, and notes.
              </div>
            </li>
            <li>
              <div>
                <strong>Bookclub</strong> — Follow the 10-year reading plan. Each year's readings are organized by author and tier (Core, Extended, Optional). Use the task tracker on each card to move through the reading sequence.
              </div>
            </li>
            <li>
              <div>
                <strong>Great Authors</strong> — See all authors alphabetically with counts of their works in the plan.
              </div>
            </li>
            <li>
              <div>
                <strong>Glossary</strong> — Browse the Syntopicon index of ~2,000 terms plus the 103 Great Ideas. Each term links to its references, a dictionary definition, Wikipedia summary, and related library works.
              </div>
            </li>
            <li>
              <div>
                <strong>Notes</strong> — Open the Notes Drawer from the top nav to keep personal reading notes, quotes, and reflections linked to specific books. Sign in to sync across devices.
              </div>
            </li>
          </ol>
        </div>
      </div>

      <!-- ══ 103 GREAT IDEAS ═══════════════════════════════════ -->
      <div class="gsBanner">
        <div class="gsSectionLabel" style="color:var(--paper);border-color:var(--paper);">The Core Vocabulary — Page 5</div>
        <h2 class="gsHeadline" style="color:var(--paper);">The 103 Great Ideas: The Vocabulary of the Great Conversation</h2>
        <p class="gsBodyText" style="color:var(--paper);max-width:80ch;">Every great thinker from Plato to Freud was engaged with some subset of these ideas. Adler identified them as the permanent themes of the Western tradition. Click any idea below to find it in the Glossary.</p>
      </div>
      <div style="border:2px solid var(--ink);padding:16px;margin-bottom:20px;box-shadow:5px 5px 0 var(--ink);">
        <div class="gsIdeaGrid">${ideaPills}</div>
      </div>

      <!-- ══ WHERE TO BEGIN ════════════════════════════════════ -->
      <div>
        <div class="gsSectionLabel">Reading Paths — Page 6</div>
        <h2 class="gsHeadline" style="margin-bottom:14px;">Where Should I Begin? Four Paths Into the Conversation</h2>
      </div>
      <div class="gsPathRow">
        <div class="gsPathCard">
          <div class="gsPathNum">A</div>
          <div class="gsPathTitle">The First-Timer</div>
          <p class="gsPathText">Start with Plato's <em>Apology</em> and <em>Crito</em> — short, gripping, and immediately relevant. Then try Aristotle's <em>Nicomachean Ethics</em> Book I for a different temperament. You will have read two of the greatest minds in 60 pages.</p>
        </div>
        <div class="gsPathCard">
          <div class="gsPathNum">B</div>
          <div class="gsPathTitle">The Story Reader</div>
          <p class="gsPathText">Begin with Homer's <em>Iliad</em> — epic, emotional, and foundational. Follow it with Sophocles' <em>Oedipus Rex</em>. Great ideas arrive wrapped in great narrative. Tolstoy's <em>War and Peace</em> awaits you in Year 9.</p>
        </div>
        <div class="gsPathCard">
          <div class="gsPathNum">C</div>
          <div class="gsPathTitle">The Idea Hunter</div>
          <p class="gsPathText">Pick a Great Idea that matters to you — Justice, Freedom, God, Democracy — and use the Glossary to find all the books where it appears. Read those passages. This is the Syntopicon method at its purest.</p>
        </div>
        <div class="gsPathCard">
          <div class="gsPathNum">D</div>
          <div class="gsPathTitle">The Committed Beginner</div>
          <p class="gsPathText">Start at Year 1 of the Bookclub plan and follow it in order. The plan is designed to build: later works presuppose earlier ones. Adler's <em>How to Read a Book</em> is your first companion.</p>
        </div>
      </div>

      <!-- ══ HOW TO READ A GREAT BOOK ══════════════════════════ -->
      <div class="gsTwoCol">
        <div class="gsTwoColMain">
          <div class="gsSectionLabel">Technique — Page 6</div>
          <h2 class="gsHeadline">How to Read a Great Book: The Four Levels</h2>
          <p class="gsBodyText gsDropCap">Adler's <em>How to Read a Book</em> distinguishes four levels of reading that apply perfectly to the Great Books. You need not reach Level Four every time — but knowing the levels tells you how deep you are going and what the work demands.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;">
            ${[
              ["I. Elementary","You understand the words and can follow the sentences. The prerequisite for everything else."],
              ["II. Inspectional","You survey the whole book: title, preface, chapter headings, first and last paragraphs. You understand the structure before diving in."],
              ["III. Analytical","You read the whole work, identify the author's main arguments, formulate their questions, and assess their answers. This is the level of serious study."],
              ["IV. Syntopical","You read many books on the same theme, identify their shared questions, and construct a conversation between them. This is exactly what the Syntopicon enables."]
            ].map(([lev,desc]) => `
              <div style="border:2px solid var(--ink);padding:12px;box-shadow:3px 3px 0 var(--ink);">
                <div style="font-weight:900;font-size:0.88rem;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:6px;">${lev}</div>
                <div style="font-size:0.84rem;line-height:1.5;">${desc}</div>
              </div>`).join("")}
          </div>
          <p class="gsBodyText">For most books in the plan, aim for Level III on your first pass and Level IV — through the Glossary and the plan — over time. Do not worry about understanding everything at once. The tradition rewards re-reading above all else.</p>
        </div>
        <div class="gsTwoColSide">
          <div class="gsSectionLabel">Companion Tools</div>
          <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
            ${[
              ["📚","Reading Tasks","Each book card has a task tracker: Inspect → First Read → Annotate → Second Read → Reflect → Desk. Work through them at your own pace."],
              ["🗒️","Notes Drawer","Keep reading notes linked to specific books. Create quotes, reflections, great ideas, or essays. Sign in to sync across devices."],
              ["🔍","Glossary Lookup","Search any term or idea in the Glossary. Each entry links to dictionary definitions, Wikipedia, and related books."],
              ["👥","Great Authors","See all 60+ authors in the plan with their works. Click an author to filter the library to their contributions."],
              ["⏱️","Reading Timer","Use the built-in timer (clock icon in the header) to track sessions. Stay focused and log your reading time."]
            ].map(([icon,title,desc]) => `
              <div style="border:1px solid var(--ink);padding:10px;display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;">
                <div style="font-size:1.4rem;line-height:1;">${icon}</div>
                <div>
                  <div style="font-weight:900;font-size:0.85rem;margin-bottom:3px;">${title}</div>
                  <div style="font-size:0.8rem;line-height:1.45;color:var(--ink2);">${desc}</div>
                </div>
              </div>`).join("")}
          </div>
        </div>
      </div>

      <!-- ══ FAQ ════════════════════════════════════════════════ -->
      <div style="border:2px solid var(--ink);padding:20px;margin-bottom:20px;box-shadow:5px 5px 0 var(--ink);">
        <div class="gsSectionLabel">Frequently Asked Questions — Page 7</div>
        <h2 class="gsSubhead" style="margin-bottom:14px;">Readers Ask. We Answer.</h2>
        ${[
          ["Do I need to read every book?","No. The plan distinguishes Core (essential), Extended (highly recommended), and Optional works. If time is short, focus on Core. Even reading one book from each year gives you a foundation."],
          ["How long does each book take?","It varies enormously — from 30 minutes for a Platonic dialogue to several months for the complete works of Aristotle. The plan is designed for about 20–30 minutes of reading per day."],
          ["What if I don't understand something?","That is normal and expected. Adler advises reading all the way through on a first pass without stopping. Understanding comes in layers. Use the Glossary, Wikipedia, and your Conversation Desk to fill gaps."],
          ["Do I need to read in order?","The plan is designed to be followed in order because later books build on earlier ones. But the Syntopicon method lets you jump directly to a topic that interests you."],
          ["Which translation should I use?","This is a real and important question. The site links to standard editions. For Homer, the Fagles or Lattimore translations are widely loved. For Plato, Grube/Cooper or the Hackett editions. The specific translation matters less than reading seriously."],
          ["Can I use this site without an account?","Yes. All tracking is saved locally in your browser. Create an account only if you want to sync across devices using the cloud backup feature."],
          ["What are the 103 Great Ideas?","They are the permanent themes identified by Adler: concepts like Justice, Knowledge, God, Soul, and Truth that recur across all the Great Books. Browse them in the Glossary or click any idea pill above to explore."],
          ["Is this a course? Do I get a certificate?","No. This is self-directed education at its purest. The reward is the reading itself — and the transformation it produces in how you think."]
        ].map(([q,a]) => `
          <div class="gsFaqItem">
            <div class="gsFaqQ">Q: ${escapeHtml(q)}</div>
            <div class="gsFaqA">${escapeHtml(a)}</div>
          </div>`).join("")}
      </div>

      <!-- ══ FOOTER CTA ═════════════════════════════════════════ -->
      <div class="gsBanner" style="text-align:center;">
        <h2 class="gsHeadline" style="color:var(--paper);">The Conversation Has Been Going for 2,500 Years.<br>Your Chair Has Been Waiting.</h2>
        <p class="gsBodyText" style="color:var(--paper);max-width:60ch;margin:10px auto 0;">"To be a student of great books is to take your place in one of the longest and most important conversations in the history of the human race." — Mortimer Adler</p>
        <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="gsCtaBtn" type="button" data-gs-nav="plan">
            Start the Reading Plan →
          </button>
          <button class="gsCtaBtn gsCtaBtnSecondary" type="button" data-gs-nav="glossary">
            Explore the Glossary →
          </button>
          <button class="gsCtaBtn gsCtaBtnSecondary" type="button" data-gs-nav="library">
            Browse the Library →
          </button>
        </div>
      </div>
    `;
  }

  function wireGetStartedEvents(section){
    section.addEventListener("click", e => {
      const navBtn = e.target.closest("[data-gs-nav]");
      if (navBtn) {
        const target = navBtn.dataset.gsNav;
        if (target === "glossary") setView("glossary");
        else setView(target);
        return;
      }
      const ideaPill = e.target.closest("[data-gs-idea]");
      if (ideaPill) {
        const idea = ideaPill.dataset.gsIdea;
        setView("glossary");
        setTimeout(() => {
          const glossaryQ = document.getElementById("glossaryQ");
          if (glossaryQ) {
            glossaryQ.value = idea;
            glossaryQ.dispatchEvent(new Event("input", { bubbles:true }));
          }
        }, 150);
      }
    });
  }

  function setGetStartedView(){
    const currentState = appState();
    if (currentState) currentState.view = "get-started";
    ["#libraryView","#planView","#authorsView","#glossaryView","#getStartedView"].forEach(sel =>
      document.querySelector(sel)?.classList.toggle("on", sel === "#getStartedView")
    );
    ["#tabLibrary","#tabPlan","#tabAuthors","#tabGlossary","#tabGetStarted"].forEach(sel =>
      document.querySelector(sel)?.classList.remove("tabOn")
    );
    document.getElementById("tabGetStarted")?.classList.add("tabOn");
    const planName = document.getElementById("planName");
    if (planName) planName.textContent = "Get Started";
  }

  function installGetStartedPatch(){
    return;
  }

  function init(){
    buildGetStartedView();
    installGetStartedPatch();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

export {
  archiveEditorNote,
  archiveSelectedNotes,
  bindConversationDeskUI,
  createConversationDraft,
  deleteEditorNote,
  deleteSelectedNotes,
  exportNotes,
  filteredNotes,
  getCheckGroupValues,
  hideEditor,
  importNotesFile,
  openConversationDesk,
  renderConversationDesk,
  renderNotesList,
  saveConversationDeskState,
  saveEditorNote,
  setCheckGroupValues,
  startEditNote,
  startNewNote,
  toggleNoteSelectMode
};

