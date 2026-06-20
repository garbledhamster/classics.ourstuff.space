/* components/conversation-desk.js - Reader and Editor contribution workspace */

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
