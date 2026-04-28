/* data/loader.js — loadPlan(), flattenPlan(), buildLibraryWorks(), buildGreatIdeasUniverse(), year stepper */
/* =========================================================
   LOAD PLAN (used for BOTH views)
   ========================================================= */
async function loadPlan(){
  clearError();
  try{
    // Load project catalog for sourceUrls
    const projRes = await fetch("./library.json", { cache:"no-store" });
    if (!projRes.ok) throw new Error(`Could not load library.json (${projRes.status})`);
    const projectData = await projRes.json();
    if (!Array.isArray(projectData)) throw new Error("library.json must be an array");
    state.projectCatalog = projectData;

    // Load reading plan
    const res = await fetch("./bookclub.json", { cache:"no-store" });
    if (!res.ok) throw new Error(`Could not load bookclub.json (${res.status})`);
    const data = await res.json();
    if (!data || !Array.isArray(data.years)) throw new Error("bookclub.json must include { plan_name, years: [...] }");

    state.plan = data;

    const today = new Date().toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    $("#today").textContent = today;

    flattenPlan();
    buildLibraryWorks();
    buildGreatIdeasUniverse();
    fillYearOptions();
    buildTagsUniverse();
    wireUI();
    renderAll();
  } catch(err){
    setError(`LOAD ERROR: ${err.message}`);
  }
}

function normalizeForMatch(text){
  // Normalize text for matching between bookclub.json and library.json
  return String(text || "").toLowerCase().trim()
    .replace(/^the\s+/i, '')
    .replace(/^a\s+/i, '')
    .replace(/^an\s+/i, '');
}

function findCatalogMeta(author, title){
  // Look up sourceUrl and publication date from project catalog
  if (!state.projectCatalog?.length) return { sourceUrl: "", publishedYear: null };
  
  const normalizedTitle = normalizeForMatch(title);
  const normalizedAuthor = normalizeForMatch(author);
  
  // Try to find matching book in catalog
  for (const book of state.projectCatalog){
    const bookTitle = normalizeForMatch(book.title);
    const bookAuthor = normalizeForMatch(book.author);
    
    // Match by author and title
    if (normalizedAuthor && bookAuthor && 
        normalizedAuthor === bookAuthor && 
        normalizedTitle === bookTitle){
      return {
        sourceUrl: String(book.sourceUrl || ""),
        publishedYear: Number.isFinite(Number(book.date)) ? Number(book.date) : null
      };
    }
    
    // Match by title only if no author or author matches
    if (normalizedTitle === bookTitle){
      if (!normalizedAuthor || !bookAuthor || normalizedAuthor === bookAuthor){
        return {
          sourceUrl: String(book.sourceUrl || ""),
          publishedYear: Number.isFinite(Number(book.date)) ? Number(book.date) : null
        };
      }
    }
  }
  
  return { sourceUrl: "", publishedYear: null };
}

function flattenPlan(){
  const flat = [];
  const years = state.plan.years || [];
  for (const y of years){
    const yearNum = Number(y.year);
    const readings = y.readings || [];
    for (const r of readings){
      const order = Number(r.order);
      const tier = String(r.tier || "").toLowerCase();
      const marker = r.marker ?? "";
      const author = String(r.author || "").trim();

      const works = Array.isArray(r.works) ? r.works : [];
      for (const w of works){
        const title = String(w.title || "").trim();
        const selection = w.selection ? String(w.selection).trim() : "";
        const selections = Array.isArray(w.selections) ? w.selections.map(s=>String(s).trim()).filter(Boolean) : null;
        const greatIdeas = Array.isArray(w.great_ideas) ? w.great_ideas.map(s=>String(s).trim()).filter(Boolean) : [];
        const customTags = Array.isArray(w.custom_tags) ? w.custom_tags.map(s=>String(s).trim()).filter(Boolean) : [];
        const blackBox = w.black_box || null;
        // Look up sourceUrl and publication year from project catalog instead of bookclub.json
        const catalogMeta = findCatalogMeta(author, title);

        const key = workKey({year:yearNum, order, tier, author, title, selection, selections});
        const search = normalizeText(`${author} ${title} ${selection} ${(selections||[]).join(" ")} ${(greatIdeas||[]).join(" ")} ${(customTags||[]).join(" ")}`);

        flat.push({
          year: yearNum,
          order,
          flatIndex: flat.length,
          tier,
          marker,
          author,
          work: { title, selection, selections },
          key,
          search,
          sourceUrl: catalogMeta.sourceUrl,
          publishedYear: catalogMeta.publishedYear,
          greatIdeas,
          customTags,
          blackBox
        });
      }
    }
  }
  state.flatWorks = flat;
}

function buildLibraryWorks(){
  // Aggregate by Author + Title (unique library cards)
  const map = new Map();

  for (const fw of state.flatWorks){
    const author = fw.author || "Unknown";
    const title = fw.work.title || "Untitled";
    const libKey = `${author}||${title}`.toLowerCase();
    if (!map.has(libKey)){
      map.set(libKey, {
        libKey,
        id: `lib_${hash32(libKey)}`,
        author,
        title,
        hasCore:false,
        hasSupplemental:false,
        occurrences: [], // { year, order, tier, marker, key, selection, selections }
        search: normalizeText(`${author} ${title}`),
        sourceUrl: "",
        greatIdeas: [],
        customTags: [],
        blackBox: null
      });
    }
    const item = map.get(libKey);
    if (fw.tier === "core") item.hasCore = true;
    if (fw.tier === "supplemental") item.hasSupplemental = true;
    // Pick up sourceUrl from any occurrence (prefer first non-empty)
    if (!item.sourceUrl && fw.sourceUrl) item.sourceUrl = fw.sourceUrl;
    // Merge greatIdeas, customTags, blackBox
    for (const idea of (fw.greatIdeas || [])) {
      if (!item.greatIdeas.includes(idea)) item.greatIdeas.push(idea);
    }
    for (const tag of (fw.customTags || [])) {
      if (!item.customTags.includes(tag)) item.customTags.push(tag);
    }
    if (!item.blackBox && fw.blackBox) item.blackBox = fw.blackBox;
    // Update search to include ideas and tags
    item.search = normalizeText(`${author} ${title} ${(item.greatIdeas||[]).join(" ")} ${(item.customTags||[]).join(" ")}`);

    item.occurrences.push({
      year: fw.year,
      order: fw.order,
      tier: fw.tier,
      marker: fw.marker,
      key: fw.key,
      selection: fw.work.selection || "",
      selections: fw.work.selections || null
    });
  }

  const arr = Array.from(map.values());
  for (const it of arr){
    it.occurrences.sort((a,b)=> a.year-b.year || a.order-b.order);
  }
  state.libraryWorks = arr;
}

function buildGreatIdeasUniverse(){
  const set = new Set();
  for (const fw of state.flatWorks){
    for (const idea of (fw.greatIdeas || [])) set.add(idea);
  }
  state.greatIdeasUniverse = Array.from(set).sort((a,b) => a.localeCompare(b, undefined, { sensitivity:"base" }));
  const opts = state.greatIdeasUniverse.map(idea => `<option value="${escapeHtml(idea)}">${escapeHtml(idea)}</option>`).join("");
  const greatIdeaSelEl = $("#greatIdeaSel");
  if (greatIdeaSelEl){
    greatIdeaSelEl.innerHTML = `<option value="all">All Ideas</option>${opts}`;
    greatIdeaSelEl.value = state.filters.greatIdea;
  }
  const libGreatIdeaSelEl = $("#libGreatIdeaSel");
  if (libGreatIdeaSelEl){
    libGreatIdeaSelEl.innerHTML = `<option value="all">All Ideas</option>${opts}`;
    libGreatIdeaSelEl.value = state.filters.libGreatIdea;
  }
}

function fillYearOptions(){
  state.availableYears = (state.plan.years || []).map(y=>Number(y.year)).filter(n=>Number.isFinite(n)).sort((a,b)=>a-b);
  if (state.availableYears.length){
    state.filters.year = String(state.availableYears[0]);
  }
  updateYearStepper();
}

function updateYearStepper(){
  const isAllYears = state.filters.year === "all";
  $("#yearDisplay").textContent = isAllYears ? "ALL" : `Year ${state.filters.year}`;
  $("#yearPrev").disabled = isAllYears;
  $("#yearNext").disabled = isAllYears;
  $("#yearPrev").setAttribute("aria-disabled", String(isAllYears));
  $("#yearNext").setAttribute("aria-disabled", String(isAllYears));
  const allYearsCheckbox = $("#showAllYears");
  if (allYearsCheckbox) allYearsCheckbox.checked = isAllYears;
}

function buildTagsUniverse(){
  // Keep notes "as they are": book_tag = title
  const set = new Set();
  for (const fw of state.flatWorks){
    if (fw.work.title) set.add(fw.work.title);
  }
  state.tagsUniverse = Array.from(set).sort((a,b)=>a.localeCompare(b, undefined, { sensitivity:"base" }));

  $("#noteTagFilter").innerHTML =
    `<option value="all">All</option>` +
    state.tagsUniverse.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");

  $("#editBookTag").innerHTML =
    state.tagsUniverse.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
}

