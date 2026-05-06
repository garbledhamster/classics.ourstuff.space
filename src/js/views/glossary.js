/* glossary.js — Syntopicon glossary page, modal, idea map, dictionary lookup, Wikipedia summary, related book matching. */
(()=> {
  const TERMS_URL = "syntopicon_terms.json";
  const DICT_CACHE_KEY = "classicsDictionaryCacheV2";
  const WIKI_CACHE_KEY = "classicsWikipediaGlossaryCacheV1";
  const PAGES = ["syntopicon", "ideas", "dictionary", "wikipedia", "library"];
  const PAGE_LABELS = { syntopicon:"Syntopicon", ideas:"Idea Map", dictionary:"Dictionary", wikipedia:"Wikipedia", library:"Related Library" };
  const glossaryState = {
    initialized:false, loading:false, error:"", terms:[], filteredTerms:[], activeLetter:"", query:"",
    selectedTerm:null, pageIndex:0, dictionaryCache:loadCache(DICT_CACHE_KEY), wikipediaCache:loadCache(WIKI_CACHE_KEY)
  };

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
      const response = await fetch(TERMS_URL, { cache:"no-store" });
      if (!response.ok) throw new Error(`Could not load ${TERMS_URL} (${response.status}).`);
      const data = await response.json();
      glossaryState.terms = getRawTermsPayload(data).map(normalizeTerm).sort((a,b) =>
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
      btn.setAttribute("aria-label", "View Syntopicon glossary");
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
      section.setAttribute("aria-label", "Syntopicon glossary view");
      section.innerHTML = `
        <div class="glossaryMasthead">
          <h1 class="glossaryTitle">Syntopicon Glossary</h1>
          <div class="glossaryDesc">A recreated Syntopicon index. Click a term to move from term → Great Idea → books in the Great Conversation, with dictionary and Wikipedia support.</div>
        </div>
        <section class="glossaryControls" aria-label="glossary filters">
          <div class="control"><div class="label">Search terms, references, and ideas</div><input id="glossaryQ" class="input" type="search" placeholder="e.g., Justice, Soul, Matter…" autocomplete="search"></div>
          <div class="control"><div class="label">Letter</div><select id="glossaryLetterSel" class="select"><option value="">All Letters</option></select></div>
        </section>
        <div class="glossaryLayout">
          <aside class="glossaryLetters" aria-label="Syntopicon letters"><div class="glossaryLettersTitle">Letters</div><div id="glossaryLetterGrid" class="glossaryLetterGrid"></div></aside>
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
    if (window.state) window.state.view = "glossary";
    ["#libraryView", "#planView", "#authorsView", "#glossaryView"].forEach(sel => $(sel)?.classList.toggle("on", sel === "#glossaryView"));
    ["#tabLibrary", "#tabPlan", "#tabAuthors", "#tabGlossary"].forEach(sel => $(sel)?.classList.remove("tabOn"));
    $("#tabGlossary")?.classList.add("tabOn");
    const planName = $("#planName");
    if (planName) planName.textContent = "Syntopicon Glossary";
    loadGlossaryTerms();
  }

  function renderGlossary(){
    const index = $("#glossaryIndex"), letterGrid = $("#glossaryLetterGrid"), letterSel = $("#glossaryLetterSel");
    if (!index || !letterGrid || !letterSel) return;
    const letters = availableLetters();
    letterSel.innerHTML = `<option value="">All Letters</option>` + letters.map(letter => `<option value="${escapeHtml(letter)}"${letter === glossaryState.activeLetter ? " selected" : ""}>${escapeHtml(letter)}</option>`).join("");
    letterGrid.innerHTML = [`<button class="btn glossaryLetterBtn${!glossaryState.activeLetter ? " active" : ""}" data-letter="" type="button">All</button>`]
      .concat(letters.map(letter => `<button class="btn glossaryLetterBtn${letter === glossaryState.activeLetter ? " active" : ""}" data-letter="${escapeHtml(letter)}" type="button">${escapeHtml(letter)}</button>`)).join("");
    if (glossaryState.loading) { index.innerHTML = `<div class="glossaryEmpty">Loading Syntopicon terms…</div>`; return; }
    if (glossaryState.error) { index.innerHTML = `<div class="glossaryEmpty"><strong>Glossary data not loaded.</strong><br>Add <span class="mono">syntopicon_terms.json</span> to the site root. Error: ${escapeHtml(glossaryState.error)}</div>`; return; }
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
    for (const idea of (window.state?.greatIdeasUniverse || [])) ideas.set(normalizeText(idea), idea);
    for (const work of (window.state?.libraryWorks || [])) for (const idea of (work.greatIdeas || [])) ideas.set(normalizeText(idea), idea);
    return ideas;
  }

  function extractIdeaCandidates(text){
    return String(text || "")
      .replace(/\/\s*see also\s+/gi, "; ")
      .split(";")
      .map(part => part.trim())
      .map(part => part.replace(/^see\s+/i, "").replace(/^and\s+/i, "").trim())
      .filter(part => part && !/^CH\s+\d+/i.test(part))
      .map(part => {
        const match = part.match(/^(.+?)\s+\d/);
        return (match ? match[1] : part).replace(/[,/]+$/g, "").trim();
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
    const works = (window.state?.libraryWorks || []);
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
    if (page === "syntopicon") renderSyntopiconPage(term);
    if (page === "ideas") renderIdeaMapPage(term);
    if (page === "dictionary") renderDictionaryPage(term);
    if (page === "wikipedia") renderWikipediaPage(term);
    if (page === "library") renderRelatedLibraryPage(term);
  }
  function renderPageShell(term, label, contentHtml){
    $("#glossaryModalBody").innerHTML = `<div class="glossaryPagerLabel">${escapeHtml(label)}</div>${contentHtml}`;
  }

  function renderSyntopiconPage(term){
    renderPageShell(term, "Syntopicon References", `
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
        <div class="glossaryRefText">This page maps the glossary term through its Syntopicon references, then finds books whose Great Ideas tags match those references.</div>
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
    renderPageShell(term, "Related Library", related.length ? `<div class="glossaryRelatedList">${related.map(({ work, matchedIdeas }) => `<div class="glossaryRelatedItem"><div class="glossaryRelatedTitle">${escapeHtml(work.author ? `${work.author} — ${work.title}` : work.title)}${work.date ? ` (${escapeHtml(formatDate(work.date))})` : ""}</div><div class="glossaryRelatedMeta">Matched by: ${escapeHtml(matchedIdeas.length ? matchedIdeas.join(", ") : term.term)}</div></div>`).join("")}</div>` : `<div class="glossaryBlock"><div class="glossaryRefText">No related books found yet. Add matching Great Ideas tags to library data or normalize the Syntopicon references.</div></div>`);
  }

  function installSetViewPatch(){
    const originalSetView = window.setView;
    if (typeof originalSetView !== "function" || originalSetView._glossaryPatched) return false;
    function patchedSetView(view){
      if (view === "glossary") return setGlossaryView();
      $("#glossaryView")?.classList.remove("on");
      $("#tabGlossary")?.classList.remove("tabOn");
      return originalSetView(view);
    }
    patchedSetView._glossaryPatched = true;
    window.setView = patchedSetView;
    return true;
  }
  function initGlossary(){ buildGlossaryView(); installSetViewPatch(); renderGlossary(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGlossary);
  else initGlossary();
})();
