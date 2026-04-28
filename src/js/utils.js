/* utils.js — Pure utility functions (no state/DOM dependency) */
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

// Show/hide action buttons in a .workActions or .libActions container based on the current task.
// Buttons with data-btn-group="always" are never hidden.
// When taskValue is DEFAULT_CARD_TASK (no action), all buttons are shown.
function applyTaskVisibility(actionsEl, taskValue) {
  if (!actionsEl) return;
  const visibleGroups = TASK_VISIBLE_GROUPS[taskValue]; // undefined = show all
  actionsEl.querySelectorAll("[data-btn-group]").forEach(el => {
    const group = el.dataset.btnGroup;
    const show = !visibleGroups || group === "always" || visibleGroups.includes(group);
    el.style.display = show ? "" : "none";
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
