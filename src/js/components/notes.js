/* components/notes.js — Personal notes: filter, render, CRUD, import/export, multi-select */
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
  const showArchived = state.notesUI.showArchived;

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
  if (q){
    notes = notes.filter(n => {
      const hay = normalizeText(`${n.title} ${n.body} ${n.book_tag} ${n.author} ${n.selection}`);
      return hay.includes(q);
    });
  }
  notes.sort((a,b)=> (b.updated_at || "").localeCompare(a.updated_at || ""));
  return notes;
}

function renderNotesList(){
  const tagSel = $("#noteTagFilter");
  if (tagSel && tagSel.value !== state.notesUI.tag) tagSel.value = state.notesUI.tag;

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

  const pills = [
    `<span class="pill">${book}</span>`,
    `<span class="pill">${year}</span>`,
    n.author ? `<span class="pill">${escapeHtml(n.author)}</span>` : ""
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
