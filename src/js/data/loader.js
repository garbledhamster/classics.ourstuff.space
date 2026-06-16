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

    state.readingGuideRows = await loadReadingGuides();
    state.readingGuideLookup = buildReadingGuideLookup(state.readingGuideRows);

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

async function loadReadingGuides(){
  try{
    const res = await fetch("./greatbooks.csv", { cache:"no-store" });
    if (!res.ok) throw new Error(`Could not load greatbooks.csv (${res.status})`);
    const text = await res.text();
    return parseCsvRecords(text);
  } catch(err){
    console.warn("Reading guidance CSV unavailable:", err);
    return [];
  }
}

function parseCsvRecords(text){
  const rows = parseCsvRows(text);
  if (!rows.length) return [];
  const headers = rows[0].map(h => String(h || "").trim());
  return rows.slice(1)
    .filter(row => row.some(cell => String(cell || "").trim()))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function parseCsvRows(text){
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++){
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes){
      if (ch === '"' && next === '"'){
        cell += '"';
        i++;
      } else if (ch === '"'){
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"'){
      inQuotes = true;
    } else if (ch === ","){
      row.push(cell);
      cell = "";
    } else if (ch === "\n"){
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r"){
      cell += ch;
    }
  }
  if (cell || row.length){
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function normalizeGuideKeyPart(value){
  return normalizeText(value)
    .replaceAll("&", " and ")
    .replace(/\bst\.?\s+/g, "saint ")
    .replace(/gospel according to saint\s+/g, "gospel of ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|of|and|in)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGuideAuthor(value){
  return normalizeGuideKeyPart(value).replace(/\bsaint\b/g, "").trim();
}

function readingGuideKey({ year, order, author, title, selection }){
  return [
    Number(year) || "",
    Number(order) || "",
    normalizeGuideAuthor(author),
    normalizeGuideKeyPart(title),
    normalizeGuideKeyPart(selection)
  ].join("|");
}

function readingGuideIdentityKey({ year, author, title }){
  return [
    Number(year) || "",
    normalizeGuideAuthor(author),
    normalizeGuideKeyPart(title)
  ].join("|");
}

function readingGuideAuthorTitleKey({ author, title }){
  return [
    normalizeGuideAuthor(author),
    normalizeGuideKeyPart(title)
  ].join("|");
}

function buildReadingGuideLookup(rows){
  const exact = new Map();
  const loose = new Map();
  const byYearAuthorTitle = new Map();
  const byAuthorTitle = new Map();
  const byYearTitle = new Map();
  const byTitle = new Map();
  for (const row of rows){
    const entry = normalizeReadingGuideRow(row);
    const exactKey = readingGuideKey({
      year: entry.year,
      order: entry.order,
      author: entry.author,
      title: entry.title,
      selection: entry.selection
    });
    const looseKey = readingGuideKey({
      year: entry.year,
      order: entry.order,
      author: entry.author,
      title: entry.title,
      selection: ""
    });
    exact.set(exactKey, entry);
    if (!loose.has(looseKey)) loose.set(looseKey, entry);
    byYearAuthorTitle.set(readingGuideIdentityKey(entry), entry);
    byAuthorTitle.set(readingGuideAuthorTitleKey(entry), entry);
    byYearTitle.set(`${entry.year}|${normalizeGuideKeyPart(entry.title)}`, entry);

    const titleKey = normalizeGuideKeyPart(entry.title);
    if (byTitle.has(titleKey)) byTitle.set(titleKey, null);
    else byTitle.set(titleKey, entry);
  }
  return { exact, loose, byYearAuthorTitle, byAuthorTitle, byYearTitle, byTitle, rows: Array.from(exact.values()) };
}

function normalizeReadingGuideRow(row){
  return {
    status: String(row.Status || "").trim(),
    globalSeq: Number(row.GlobalSeq),
    year: Number(row.Year),
    order: Number(row.SeqInYear),
    author: String(row.Author || "").trim(),
    title: String(row.Work || "").trim(),
    selection: String(row.PlanSelection || "").trim(),
    beforeReading: String(row.BeforeReading || "").trim(),
    duringReading: String(row.DuringReading || "").trim(),
    afterReading: String(row.AfterReading || "").trim(),
    hook: String(row.Hook || "").trim(),
    resourceTitles: String(row.ResourceTitles || "").trim(),
    resourceUrls: String(row.ResourceURLs || "").trim(),
    themes: String(row.Themes || "").trim()
  };
}

function findReadingGuide(year, order, author, title, selection){
  const lookup = state.readingGuideLookup;
  if (!lookup) return null;
  const exactKey = readingGuideKey({ year, order, author, title, selection });
  const looseKey = readingGuideKey({ year, order, author, title, selection: "" });
  const yearAuthorTitleKey = readingGuideIdentityKey({ year, author, title });
  const authorTitleKey = readingGuideAuthorTitleKey({ author, title });
  const yearTitleKey = `${Number(year) || ""}|${normalizeGuideKeyPart(title)}`;
  const titleOnlyKey = normalizeGuideKeyPart(title);
  return lookup.exact.get(exactKey)
    || lookup.loose.get(looseKey)
    || lookup.byYearAuthorTitle.get(yearAuthorTitleKey)
    || lookup.byAuthorTitle.get(authorTitleKey)
    || lookup.byYearTitle.get(yearTitleKey)
    || lookup.byTitle.get(titleOnlyKey)
    || findBestReadingGuide(lookup.rows || [], year, author, title);
}

function readingGuideTokenScore(a, b){
  const aTokens = new Set(normalizeGuideKeyPart(a).split(" ").filter(Boolean));
  const bTokens = new Set(normalizeGuideKeyPart(b).split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const token of aTokens){
    if (bTokens.has(token)) overlap++;
  }
  return Math.max(
    overlap / Math.max(aTokens.size, bTokens.size),
    overlap / Math.min(aTokens.size, bTokens.size)
  );
}

function findBestReadingGuide(rows, year, author, title){
  let best = null;
  for (const row of rows){
    const sameYear = Number(row.year) === Number(year);
    const sameAuthor = normalizeGuideAuthor(row.author) === normalizeGuideAuthor(author)
      || normalizeGuideAuthor(author).endsWith(` ${normalizeGuideAuthor(row.author)}`)
      || normalizeGuideAuthor(row.author).endsWith(` ${normalizeGuideAuthor(author)}`);
    const titleScore = readingGuideTokenScore(row.title, title);
    if (titleScore < 0.72) continue;
    const score = titleScore + (sameAuthor ? 0.35 : 0) + (sameYear ? 0.15 : 0);
    if (!best || score > best.score) best = { row, score };
  }
  return best ? best.row : null;
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
        const readingGuide = findReadingGuide(yearNum, order, author, title, selection);

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
          blackBox,
          readingGuide
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
        publishedYear: null,
        greatIdeas: [],
        customTags: [],
        blackBox: null
      });
    }
    const item = map.get(libKey);
    if (fw.tier === "core") item.hasCore = true;
    if (fw.tier === "supplemental") item.hasSupplemental = true;
    // Pick up sourceUrl and publishedYear from any occurrence (prefer first non-empty)
    if (!item.sourceUrl && fw.sourceUrl) item.sourceUrl = fw.sourceUrl;
    if (item.publishedYear === null && Number.isFinite(fw.publishedYear)) item.publishedYear = fw.publishedYear;
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

