/* components/conversation-desk.js - private Conversation Desk workspace */

const DESK_LOADER_LINES = [
  "Preparing the Desk",
  "Gathering your notes",
  "Consulting your library",
  "Finding related authors",
  "Reviewing previous contributions"
];

let deskLoaderTimer = null;

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
  else updateDeskMemoryPreview();
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
    draftStatus: "note",
    linkedBook: context.linkedBook || "",
    linkedAuthor: context.linkedAuthor || "",
    linkedThemes: context.linkedThemes || [],
    visibility: "private"
  });
  draft.aiBrainMemoryObject = buildConversationMemoryObject(draft);
  state.conversationDesk.drafts.unshift(draft);
  state.conversationDesk.selectedId = draft.id;
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
  }, 220);
}

function buildConversationMemoryObject(draft){
  const userPosition = String(draft.body || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
  const relatedWorks = draft.linkedBook ? [draft.linkedBook] : [];
  const relatedAuthors = draft.linkedAuthor ? [draft.linkedAuthor] : [];
  return {
    sourceApp: "mort",
    memoryType: draft.draftStatus === "contribution"
      ? "great_conversation_contribution"
      : "conversation_desk_working_draft",
    title: draft.title || "",
    centralQuestion: draft.centralQuestion || "",
    relatedAuthors,
    relatedWorks,
    relatedThemes: draft.linkedThemes || [],
    userPosition,
    sourceNotes: (draft.linkedNotes || []).map(noteId => {
      const note = state.notes.find(item => item.id === noteId);
      return note ? {
        id: note.id,
        title: note.title || "Untitled note",
        book: note.book_tag || "",
        author: note.author || "",
        noteType: note.type || DEFAULT_NOTE_TYPE
      } : { id: noteId };
    }),
    draftStatus: draft.draftStatus || "note",
    visibility: draft.visibility || "private",
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

  root.innerHTML = `
    <section class="conversationDesk">
      ${deskDraftListHtml(desk, draft)}
      <section class="deskEditorPanel">
        ${draft ? deskEditorHtml(draft) : deskEmptyHtml()}
      </section>
      ${draft ? deskResearchRailHtml(draft) : ""}
    </section>
  `;
}

function deskDraftListHtml(desk, activeDraft){
  const visibleDrafts = desk.ui.draftFilter === "canon"
    ? desk.drafts.filter(draft => draft.draftStatus === "contribution")
    : desk.ui.draftFilter === "archived"
      ? desk.drafts.filter(draft => draft.draftStatus === "archived")
      : desk.drafts.filter(draft => draft.draftStatus !== "archived");
  return `
    <aside class="deskDraftRail" aria-label="Conversation Desk drafts">
      <div class="deskRailHeader">
        <div>
          <p class="deskEyebrow">Private workspace</p>
          <h2>Conversation Desk</h2>
        </div>
        <button class="btn btnIconOnly" type="button" data-desk-action="newDraft" aria-label="New draft" title="New draft">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      <div class="deskSegmented" role="group" aria-label="Draft filter">
        ${["active", "canon", "archived"].map(filter => `
          <button class="deskSegment ${desk.ui.draftFilter === filter ? "on" : ""}" type="button" data-desk-action="draftFilter" data-filter="${escapeHtml(filter)}">${escapeHtml(filter)}</button>
        `).join("")}
      </div>
      <div class="deskDraftList">
        ${visibleDrafts.length ? visibleDrafts.map(draft => `
          <button class="deskDraftItem ${activeDraft?.id === draft.id ? "on" : ""}" type="button" data-desk-action="selectDraft" data-id="${escapeHtml(draft.id)}">
            <span class="deskDraftTitle">${escapeHtml(draft.title || "Untitled contribution")}</span>
            <span class="deskDraftMeta">${escapeHtml(statusLabel(draft.draftStatus))}${draft.linkedBook ? ` / ${escapeHtml(draft.linkedBook)}` : ""}</span>
          </button>
        `).join("") : `<div class="deskEmptySmall">No ${escapeHtml(desk.ui.draftFilter)} drafts.</div>`}
      </div>
      <section class="personalCanon">
        <h3>Personal Canon</h3>
        ${personalCanonHtml(desk.drafts)}
      </section>
    </aside>
  `;
}

function personalCanonHtml(drafts){
  const canon = drafts.filter(draft => draft.draftStatus === "contribution");
  if (!canon.length) return `<div class="deskEmptySmall">Saved contributions appear here.</div>`;
  return canon.map(draft => `
    <button class="canonItem" type="button" data-desk-action="selectDraft" data-id="${escapeHtml(draft.id)}">
      <span>${escapeHtml(draft.title || "Contribution")}</span>
      <small>${escapeHtml([draft.linkedAuthor, draft.linkedBook].filter(Boolean).join(" / ") || "Unlinked")}</small>
    </button>
  `).join("");
}

function deskEditorHtml(draft){
  return `
    <div class="deskTopbar">
      <div>
        <p class="deskEyebrow">MortAI's Mandate lives in House Style</p>
        <h1>${escapeHtml(draft.title || "Untitled contribution")}</h1>
      </div>
      <div class="deskTopActions">
        <button class="btn" type="button" data-desk-action="saveDraft">Save</button>
        <button class="btn" type="button" data-desk-action="archiveDraft">Archive</button>
        <button class="btn btnGhost" type="button" data-desk-action="deleteDraft">Delete</button>
      </div>
    </div>

    <div class="deskMetaGrid">
      <label class="control">
        <span class="label">Title</span>
        <input class="input" type="text" data-desk-field="title" value="${escapeHtml(draft.title)}" autocomplete="off">
      </label>
      <label class="control">
        <span class="label">Status</span>
        <select class="select" data-desk-field="draftStatus">
          ${CONVERSATION_DRAFT_STATUS_OPTIONS.map(opt => `<option value="${escapeHtml(opt.value)}"${draft.draftStatus === opt.value ? " selected" : ""}>${escapeHtml(opt.label)}</option>`).join("")}
        </select>
      </label>
      <label class="control">
        <span class="label">Visibility</span>
        <select class="select" data-desk-field="visibility">
          <option value="private"${draft.visibility !== "shared" ? " selected" : ""}>Private</option>
          <option value="shared"${draft.visibility === "shared" ? " selected" : ""}>Shared later</option>
        </select>
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

    <label class="deskWritingSurface">
      <span class="label">Draft body</span>
      <textarea id="deskBody" class="textarea" data-desk-field="body" placeholder="State the question, test the claim, answer the strongest objection.">${escapeHtml(draft.body)}</textarea>
    </label>

    <div class="deskLowerGrid">
      ${mortaiPanelHtml()}
      ${houseStyleHtml(state.conversationDesk.houseStyle)}
      ${memoryObjectHtml(draft)}
    </div>
  `;
}

function deskEmptyHtml(){
  return `
    <div class="deskEmpty">
      <h1>Conversation Desk</h1>
      <button class="btn" type="button" data-desk-action="newDraft">New draft</button>
    </div>
  `;
}

function mortaiPanelHtml(){
  const ui = state.conversationDesk.ui;
  return `
    <section class="deskToolPanel mortaiPanel">
      <div class="deskPanelHeader">
        <h3>MortAI</h3>
        <select class="select" id="mortaiAction">
          ${MORTAI_ACTIONS.map(action => `<option value="${escapeHtml(action)}"${ui.mortaiAction === action ? " selected" : ""}>${escapeHtml(action)}</option>`).join("")}
        </select>
      </div>
      <button class="btn" type="button" data-desk-action="runMortai"${ui.mortaiBusy ? " disabled" : ""}>${ui.mortaiBusy ? "Consulting..." : "Consult MortAI"}</button>
      ${!state.currentUser ? `<div class="deskNotice">Sign in with Cloud to use live MortAI.</div>` : ""}
      ${ui.mortaiError ? `<div class="deskError">${escapeHtml(ui.mortaiError)}</div>` : ""}
      ${ui.mortaiResult ? mortaiResultHtml(ui.mortaiResult) : `<div class="deskEmptySmall">Editorial help will appear here.</div>`}
    </section>
  `;
}

function mortaiResultHtml(result){
  const sections = Array.isArray(result.sections) ? result.sections : [];
  return `
    <div class="mortaiResult">
      ${result.summary ? `<p>${escapeHtml(result.summary)}</p>` : ""}
      ${sections.map(section => `
        <div class="mortaiSection">
          <strong>${escapeHtml(section.title || "Editorial note")}</strong>
          <ul>${(section.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      `).join("")}
      ${Array.isArray(result.nextQuestions) && result.nextQuestions.length ? `
        <div class="mortaiSection">
          <strong>Next questions</strong>
          <ul>${result.nextQuestions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      ` : ""}
    </div>
  `;
}

function houseStyleHtml(style){
  return `
    <section class="deskToolPanel houseStylePanel">
      <div class="deskPanelHeader"><h3>House Style</h3></div>
      <label class="control"><span class="label">Voice preferences</span><textarea class="textarea smallTextarea" data-house-field="voicePreferences">${escapeHtml(style.voicePreferences)}</textarea></label>
      <label class="control"><span class="label">Editorial posture</span><select class="select" data-house-field="editorialPosture">
        ${houseOption("socratic_editor", "Socratic editor", style.editorialPosture)}
        ${houseOption("line_editor", "Line editor", style.editorialPosture)}
        ${houseOption("adversarial_reader", "Adversarial reader", style.editorialPosture)}
      </select></label>
      <label class="control"><span class="label">Source priority</span><select class="select" data-house-field="sourcePriority">
        ${houseOption("my_notes_first", "My notes first", style.sourcePriority)}
        ${houseOption("canon_first", "Canon first", style.sourcePriority)}
        ${houseOption("balanced", "Balanced", style.sourcePriority)}
      </select></label>
      <label class="control"><span class="label">Rewrite permissions</span><select class="select" data-house-field="rewritePermissions">
        ${houseOption("none", "No rewrites", style.rewritePermissions)}
        ${houseOption("preserve_voice_only", "Preserve voice only", style.rewritePermissions)}
        ${houseOption("final_polish", "Final polish", style.rewritePermissions)}
      </select></label>
      <label class="control"><span class="label">Challenge level</span><select class="select" data-house-field="challengeLevel">
        ${houseOption("gentle", "Gentle", style.challengeLevel)}
        ${houseOption("moderate", "Moderate", style.challengeLevel)}
        ${houseOption("severe", "Severe", style.challengeLevel)}
      </select></label>
      <label class="control"><span class="label">Preferred traditions/authors</span><textarea class="textarea smallTextarea" data-house-field="preferredTraditions">${escapeHtml(style.preferredTraditions)}</textarea></label>
      <label class="control"><span class="label">Forbidden behaviors</span><textarea class="textarea smallTextarea" data-house-field="forbiddenBehaviors">${escapeHtml(style.forbiddenBehaviors)}</textarea></label>
      <label class="control"><span class="label">Default structure</span><textarea class="textarea smallTextarea" data-house-field="defaultStructure">${escapeHtml(style.defaultStructure)}</textarea></label>
    </section>
  `;
}

function houseOption(value, label, selected){
  return `<option value="${escapeHtml(value)}"${selected === value ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function memoryObjectHtml(draft){
  return `
    <section class="deskToolPanel memoryPanel">
      <div class="deskPanelHeader">
        <h3>Ready for AI Brain</h3>
        <button class="btn btnGhost" type="button" data-desk-action="copyMemory">Copy</button>
      </div>
      <textarea id="deskMemoryObject" class="textarea memoryTextarea" readonly>${escapeHtml(JSON.stringify(draft.aiBrainMemoryObject || buildConversationMemoryObject(draft), null, 2))}</textarea>
    </section>
  `;
}

function deskResearchRailHtml(draft){
  const rail = buildResearchRailContext(draft);
  return `
    <aside class="deskResearchRail" aria-label="Research rail">
      <h2>Research Rail</h2>
      ${railSectionHtml("Related user notes", rail.relatedNotes, "note")}
      ${railSectionHtml("Active My Library books", rail.activeLibraryBooks, "book")}
      ${railSectionHtml("Canonical works", rail.canonicalWorks, "book")}
      ${railSectionHtml("Authors", rail.authors, "author")}
      ${railListHtml("Suggested questions", rail.suggestedQuestions)}
      ${railListHtml("Counterarguments", rail.counterarguments)}
      ${sourceCardsHtml(draft)}
      ${themeEditorHtml(draft)}
    </aside>
  `;
}

function railSectionHtml(title, items, type){
  return `
    <section class="railSection">
      <h3>${escapeHtml(title)}</h3>
      ${items.length ? items.map(item => {
        const action = type === "note" ? "toggleNoteLink" : type === "author" ? "applyAuthor" : "applyBook";
        const id = item.id || item.title || item.author || "";
        return `<button class="railItem" type="button" data-desk-action="${action}" data-id="${escapeHtml(id)}" data-title="${escapeHtml(item.title || "")}" data-author="${escapeHtml(item.author || "")}">
          <span>${escapeHtml(item.title || item.author || "Untitled")}</span>
          <small>${escapeHtml(item.meta || item.author || item.book || "")}</small>
        </button>`;
      }).join("") : `<div class="deskEmptySmall">No matches yet.</div>`}
    </section>
  `;
}

function railListHtml(title, items){
  return `
    <section class="railSection">
      <h3>${escapeHtml(title)}</h3>
      ${items.length ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<div class="deskEmptySmall">Add a question or draft body.</div>`}
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

function buildResearchRailContext(draft){
  const keywords = keywordSet([draft.title, draft.centralQuestion, draft.body, draft.linkedBook, draft.linkedAuthor, ...(draft.linkedThemes || [])].join(" "));
  const relatedNotes = state.notes
    .filter(note => noteMatchesDraft(note, draft, keywords))
    .slice(0, 8)
    .map(note => ({
      id: note.id,
      title: note.title || note.book_tag || "Untitled note",
      book: note.book_tag || "",
      meta: [note.book_tag, note.author, note.type].filter(Boolean).join(" / ")
    }));
  const activeLibraryBooks = state.libraryWorks
    .filter(work => {
      const key = getCardStatusKey(work.author, work.title);
      return getCardStatus(key) !== DEFAULT_CARD_STATUS || getCardTask(key).task !== DEFAULT_CARD_TASK || work.occurrences.some(occ => state.checks[occ.key]);
    })
    .slice(0, 8)
    .map(work => ({ title: work.title, author: work.author, meta: getCardStatus(getCardStatusKey(work.author, work.title)) }));
  const canonicalWorks = state.libraryWorks
    .filter(work => workMatchesDraft(work, draft, keywords))
    .slice(0, 8)
    .map(work => ({ title: work.title, author: work.author, meta: (work.greatIdeas || []).slice(0, 2).join(" / ") }));
  const authorNames = new Set();
  if (draft.linkedAuthor) authorNames.add(draft.linkedAuthor);
  canonicalWorks.forEach(work => { if (work.author) authorNames.add(work.author); });
  relatedNotes.forEach(note => { if (note.author) authorNames.add(note.author); });
  const authors = Array.from(authorNames).slice(0, 8).map(author => ({ author, meta: "linked context" }));
  return {
    relatedNotes,
    activeLibraryBooks,
    canonicalWorks,
    authors,
    suggestedQuestions: suggestedQuestionsFor(draft),
    counterarguments: counterargumentsFor(draft)
  };
}

function keywordSet(text){
  const stop = new Set(["the", "and", "that", "with", "from", "this", "what", "when", "where", "which", "into", "about", "should", "would", "could"]);
  return new Set(normalizeText(text).split(/\W+/).filter(word => word.length > 3 && !stop.has(word)).slice(0, 30));
}

function noteMatchesDraft(note, draft, keywords){
  if (draft.linkedBook && note.book_tag === draft.linkedBook) return true;
  if (draft.linkedAuthor && normalizeText(note.author).includes(normalizeText(draft.linkedAuthor))) return true;
  const text = normalizeText([note.title, note.body, note.book_tag, note.author, note.type].join(" "));
  return Array.from(keywords).some(word => text.includes(word));
}

function workMatchesDraft(work, draft, keywords){
  if (draft.linkedBook && work.title === draft.linkedBook) return true;
  if (draft.linkedAuthor && work.author === draft.linkedAuthor) return true;
  const ideas = work.greatIdeas || [];
  if ((draft.linkedThemes || []).some(theme => ideas.some(idea => normalizeText(idea).includes(normalizeText(theme))))) return true;
  const text = normalizeText([work.title, work.author, ...ideas].join(" "));
  return Array.from(keywords).some(word => text.includes(word));
}

function suggestedQuestionsFor(draft){
  const base = draft.centralQuestion || draft.linkedBook || draft.linkedAuthor || "this claim";
  return [
    `What would have to be true for ${base} to hold?`,
    "Where does the strongest objection come from?",
    "Which source note actually supports the central claim?"
  ];
}

function counterargumentsFor(draft){
  return [
    "The argument may rely on a modern concern the author did not share.",
    "The linked source may show tension rather than support.",
    "A rival tradition might define the central term differently."
  ];
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
  const houseField = event.target.closest("[data-house-field]");
  if (field) {
    const draft = selectedConversationDraft();
    if (!draft) return;
    draft[field.dataset.deskField] = field.value;
    saveConversationDeskState();
  } else if (houseField) {
    state.conversationDesk.houseStyle[houseField.dataset.houseField] = houseField.value;
    saveConversationDeskState();
  }
}

function handleDeskChange(event){
  if (event.target.id === "mortaiAction") {
    state.conversationDesk.ui.mortaiAction = event.target.value;
    saveConversationDeskState();
    return;
  }
  if (event.target.closest("[data-desk-field], [data-house-field]")) {
    handleDeskInput(event);
    if (event.target.tagName === "SELECT") {
      renderConversationDesk();
    }
  }
}

async function handleDeskClick(event){
  const btn = event.target.closest("[data-desk-action]");
  if (!btn) return;
  const action = btn.dataset.deskAction;
  const draft = selectedConversationDraft();
  if (action === "newDraft") {
    createConversationDraft();
    renderConversationDesk();
  } else if (action === "selectDraft") {
    state.conversationDesk.selectedId = btn.dataset.id;
    saveConversationDeskState({ render: true });
  } else if (action === "draftFilter") {
    state.conversationDesk.ui.draftFilter = btn.dataset.filter || "active";
    saveConversationDeskState({ render: true });
  } else if (action === "saveDraft") {
    saveConversationDeskState({ render: true });
  } else if (action === "archiveDraft" && draft) {
    draft.draftStatus = "archived";
    saveConversationDeskState({ render: true });
  } else if (action === "deleteDraft" && draft) {
    const confirmed = await showConfirm("Delete this draft? This cannot be undone.", "Delete Draft");
    if (!confirmed) return;
    state.conversationDesk.drafts = state.conversationDesk.drafts.filter(item => item.id !== draft.id);
    state.conversationDesk.selectedId = state.conversationDesk.drafts[0]?.id || null;
    saveConversationDeskState({ render: true });
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
  } else if (action === "toggleNoteLink" && draft) {
    const noteId = btn.dataset.id;
    const current = new Set(draft.linkedNotes || []);
    if (current.has(noteId)) current.delete(noteId);
    else current.add(noteId);
    draft.linkedNotes = Array.from(current);
    saveConversationDeskState({ render: true });
  } else if (action === "applyBook" && draft) {
    draft.linkedBook = btn.dataset.title || draft.linkedBook;
    draft.linkedAuthor = btn.dataset.author || draft.linkedAuthor;
    saveConversationDeskState({ render: true });
  } else if (action === "applyAuthor" && draft) {
    draft.linkedAuthor = btn.dataset.author || btn.dataset.title || draft.linkedAuthor;
    saveConversationDeskState({ render: true });
  } else if (action === "copyMemory") {
    await copyDeskMemory();
  } else if (action === "runMortai") {
    await runMortaiAction();
  }
}

function updateDeskMemoryPreview(){
  const draft = selectedConversationDraft();
  const textarea = $("#deskMemoryObject");
  if (draft && textarea) textarea.value = JSON.stringify(draft.aiBrainMemoryObject || buildConversationMemoryObject(draft), null, 2);
}

async function copyDeskMemory(){
  const value = $("#deskMemoryObject")?.value || "";
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    await showAlert("AI Brain object copied.");
  } catch {
    await showAlert("Copy failed. Select the JSON and copy it manually.");
  }
}

async function runMortaiAction(){
  const draft = selectedConversationDraft();
  if (!draft) return;
  const ui = state.conversationDesk.ui;
  if (!state.currentUser || typeof state.currentUser.getIdToken !== "function") {
    ui.mortaiError = "Sign in with Cloud to use live MortAI.";
    saveConversationDeskState({ render: true });
    return;
  }
  ui.mortaiBusy = true;
  ui.mortaiError = "";
  ui.mortaiResult = null;
  saveConversationDeskState({ render: true });
  try {
    const token = await state.currentUser.getIdToken();
    const bodyText = $("#deskBody") || {};
    const selectedText = bodyText.value && bodyText.selectionStart !== bodyText.selectionEnd
      ? bodyText.value.slice(bodyText.selectionStart, bodyText.selectionEnd)
      : "";
    const response = await fetch(MORTAI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action: ui.mortaiAction,
        contribution: draft,
        houseStyle: state.conversationDesk.houseStyle,
        linkedContext: buildDeskLinkedContext(draft),
        selectedText,
        researchRailContext: buildResearchRailContext(draft)
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error?.message || "MortAI could not respond.");
    }
    ui.mortaiResult = payload.result || payload;
  } catch (error) {
    ui.mortaiError = error.message || "MortAI could not respond.";
  } finally {
    ui.mortaiBusy = false;
    saveConversationDeskState({ render: true });
  }
}

function buildDeskLinkedContext(draft){
  const linkedNotes = (draft.linkedNotes || []).map(noteId => state.notes.find(note => note.id === noteId)).filter(Boolean);
  return {
    linkedBook: draft.linkedBook,
    linkedAuthor: draft.linkedAuthor,
    linkedThemes: draft.linkedThemes,
    linkedSourceCards: draft.linkedSourceCards,
    linkedNotes: linkedNotes.map(note => ({
      title: note.title || "",
      book: note.book_tag || "",
      author: note.author || "",
      type: note.type || DEFAULT_NOTE_TYPE,
      bodyPreview: String(note.body || "").slice(0, 500)
    }))
  };
}

function statusLabel(status){
  return CONVERSATION_DRAFT_STATUS_OPTIONS.find(opt => opt.value === status)?.label || "Note";
}
