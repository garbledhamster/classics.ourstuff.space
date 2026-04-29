/* data/book-details.js — On-demand book detail lookup (Open Library + Gutendex + Wikipedia in parallel), Black Box section render */
function renderLearningButtons() {
  const buildPlatformGoalButtons = (platform) => LEARNING_GOAL_OPTIONS.map(goal => `
    <button class="btn btnGhost" type="button" data-action="openLearningGoal" data-platform="${platform}" data-goal="${escapeHtml(goal.query)}">${escapeHtml(goal.label)}</button>
  `).join("");
  return `
    <div class="ytGoalWrap" data-btn-group="google">
      <button class="btn" type="button" data-action="toggleLearningGoals" data-platform="google" aria-expanded="false" aria-label="Open Search learning goals menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
        Search
      </button>
      <div class="ytGoalDrawer">
        <div class="ytGoalHint">Choose a Bloom-style learning goal</div>
        <div class="ytGoalRow">
          ${buildPlatformGoalButtons("google")}
        </div>
      </div>
    </div>
    <div class="ytGoalWrap" data-btn-group="youtube">
      <button class="btn" type="button" data-action="toggleLearningGoals" data-platform="youtube" aria-expanded="false" aria-label="Open Videos learning goals menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        Videos
      </button>
      <div class="ytGoalDrawer">
        <div class="ytGoalHint">Choose a Bloom-style learning goal</div>
        <div class="ytGoalRow">
          ${buildPlatformGoalButtons("youtube")}
        </div>
      </div>
    </div>
  `;
}

function renderBlackBoxSection(bb){
  if (!bb) return "";
  const boxTitle = escapeHtml(bb.box || "");
  const inputs = Array.isArray(bb.inputs) ? bb.inputs : [];
  const outputs = Array.isArray(bb.outputs) ? bb.outputs : [];
  const inputsHtml = inputs.map((inp,i) =>
    `<div class="bbItem bbInput" style="animation-delay:${0.9 + i * 0.08}s">${escapeHtml(inp)}</div>`
  ).join("");
  const outputsHtml = outputs.map((out,i) =>
    `<div class="bbItem bbOutput" style="animation-delay:${1.5 + i * 0.1}s">${escapeHtml(out)}</div>`
  ).join("");
  return `
    <div class="blackBoxSection">
      <div class="bookDetailsHeader">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
        Black Box Thinking
      </div>
      <div class="bbPanel">
        <div class="bbLayout">
          <div class="bbCol bbLeftCol">${inputsHtml}</div>
          <div class="bbCenter">
            <svg class="bbSvg" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect class="bbRect" x="5" y="5" width="110" height="70" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
            <div class="bbLabel">${boxTitle}</div>
          </div>
          <div class="bbCol bbRightCol">${outputsHtml}</div>
        </div>
      </div>
    </div>
  `;
}

/* ===== Book Details Section ===== */

function renderBookDetailsSection(author, title){
  return `
    <div class="bookDetailsSection open" data-author="${escapeHtml(author)}" data-title="${escapeHtml(title)}">
      <div class="bookDetailsHeader">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        Book Details
      </div>
      <div class="bookDetailsPanel"><div></div></div>
    </div>
  `;
}

async function loadBookDetails(section){
  const author = section.dataset.author || "";
  const title  = section.dataset.title  || "";
  const inner  = section.querySelector(".bookDetailsPanel > div");
  if (!inner) return;

  // Prevent duplicate in-flight fetches for the same section
  if (inner._loadingDetails) return;
  inner._loadingDetails = true;

  inner.innerHTML = `<div class="bookDetailsLoading">Loading…</div>`;

  try {
    // Fetch all three sources in parallel for faster load
    const [olResult, gutResult, wikiResult] = await Promise.allSettled([
      _fetchOpenLibrary(title, author),
      _fetchGutendexDetails(title, author),
      _fetchWikipediaDetails(title, author)
    ]);

    const sources = [];
    if (olResult.status === "fulfilled" && olResult.value){
      sources.push({ label: "Open Library", html: _renderBookDetailsResult(olResult.value) });
    }
    if (gutResult.status === "fulfilled" && gutResult.value){
      sources.push({ label: "Project Gutenberg", html: _renderGutendexResult(gutResult.value) });
    }
    if (wikiResult.status === "fulfilled" && wikiResult.value){
      sources.push({ label: "Wikipedia", html: _renderWikipediaResult(wikiResult.value) });
    }

    if (!sources.length){
      inner.innerHTML = `<div class="bookDetailsError">No details found for this title.</div>`;
      return;
    }

    // Store sources on the inner element (cleared when card is closed)
    inner._sources = sources;
    inner._sourceIdx = 0;
    _renderSourceView(inner);
  } catch(err){
    inner.innerHTML = `<div class="bookDetailsError">Could not load book details. Please try again later.</div>`;
  } finally {
    inner._loadingDetails = false;
  }
}

function _renderSourceView(inner){
  const sources = inner._sources || [];
  const idx = inner._sourceIdx || 0;
  if (!sources.length) return;
  const source = sources[idx];
  const hasMultiple = sources.length > 1;
  const nextLabel = hasMultiple ? sources[(idx + 1) % sources.length].label : "";
  const cycleBtn = hasMultiple
    ? `<button class="btn btnGhost bookDetailsCycleBtn" type="button" data-action="cycleBookDetails" aria-label="Next source: ${escapeHtml(nextLabel)} (${idx + 2 > sources.length ? 1 : idx + 2} of ${sources.length})">›</button>`
    : "";
  const counter = hasMultiple
    ? `<span class="bookDetailsSourceCounter">${idx + 1}/${sources.length}</span>`
    : "";
  inner.innerHTML = `
    <div class="bookDetailsCycleBar"><span class="bookDetailsSourceLabel">${escapeHtml(source.label)}</span>${counter}${cycleBtn}</div>
    ${source.html}
  `;
}

function handleCycleBookDetails(btn){
  const inner = btn.closest(".bookDetailsPanel > div");
  if (inner && inner._sources && inner._sources.length > 1){
    inner._sourceIdx = ((inner._sourceIdx || 0) + 1) % inner._sources.length;
    _renderSourceView(inner);
  }
}

async function _fetchOpenLibrary(title, author){
  const fields = "key,title,author_name,first_publish_year,subject,subject_time_period,cover_i,number_of_pages_median,edition_count";
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=3&fields=${fields}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const docs = data.docs || [];
  if (!docs.length) return null;
  const normTitle = normalizeText(title);
  return docs.find(d => normalizeText(d.title || "") === normTitle) || docs[0] || null;
}

function _renderBookDetailsResult(doc){
  const coverId = typeof doc.cover_i === "number" ? doc.cover_i : null;
  const coverHtml = coverId
    ? `<div class="bookDetailsCover"><img src="https://covers.openlibrary.org/b/id/${coverId}-M.jpg" alt="Book cover" loading="lazy"></div>`
    : "";

  const rows = [];
  if (doc.author_name?.length){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Author: </span>${escapeHtml(doc.author_name.join(", "))}</div>`);
  }
  if (doc.first_publish_year){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">First published: </span>${escapeHtml(String(doc.first_publish_year))}</div>`);
  }
  const timePeriods = (doc.subject_time_period || []).slice(0, 4);
  if (timePeriods.length){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Time period: </span>${escapeHtml(timePeriods.join(", "))}</div>`);
  }
  if (doc.number_of_pages_median){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Pages (median): </span>${escapeHtml(String(doc.number_of_pages_median))}</div>`);
  }
  if (doc.edition_count){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Editions: </span>${escapeHtml(String(doc.edition_count))}</div>`);
  }
  const subjects = (doc.subject || []).slice(0, 6);
  if (subjects.length){
    const items = subjects.map(s => `<li>${escapeHtml(s)}</li>`).join("");
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Subjects:</span><ul class="bookDetailsSubjectList">${items}</ul></div>`);
  }
  // Only build an OL link when the key looks like a valid works path
  if (doc.key && /^\/works\/OL\w+W$/.test(doc.key)){
    rows.push(`<div class="bookDetailsRow"><a class="bookDetailsLink" href="${escapeHtml(`https://openlibrary.org${doc.key}`)}" target="_blank" rel="noopener noreferrer">View on Open Library →</a></div>`);
  }

  return `<div class="bookDetailsContent">${coverHtml}<div class="bookDetailsInfo">${rows.join("")}</div></div>`;
}

async function _fetchGutendexDetails(title, author){
  const q = [title, author].filter(Boolean).join(" ");
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const results = data.results || [];
  if (!results.length) return null;
  const normTitle = normalizeText(title);
  return results.find(b => normalizeText(b.title || "") === normTitle) || results[0];
}

function _renderGutendexResult(book){
  const rows = [];
  const authors = (book.authors || []).map(a => a.name).filter(Boolean);
  if (authors.length){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Author: </span>${escapeHtml(authors.join(", "))}</div>`);
  }
  const firstAuthor = book.authors?.[0];
  if (firstAuthor?.birth_year || firstAuthor?.death_year){
    const lifespan = [firstAuthor.birth_year, firstAuthor.death_year].filter(Boolean).join("\u2013");
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Author lifespan: </span>${escapeHtml(lifespan)}</div>`);
  }
  const subjects = (book.subjects || []).slice(0, 6);
  if (subjects.length){
    const items = subjects.map(s => `<li>${escapeHtml(s)}</li>`).join("");
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Subjects:</span><ul class="bookDetailsSubjectList">${items}</ul></div>`);
  }
  if (typeof book.download_count === "number"){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Downloads: </span>${escapeHtml(String(book.download_count))}</div>`);
  }
  if (book.id){
    rows.push(`<div class="bookDetailsRow"><a class="bookDetailsLink" href="https://www.gutenberg.org/ebooks/${book.id}" target="_blank" rel="noopener noreferrer">Read on Project Gutenberg →</a></div>`);
  }
  rows.push(`<div class="bookDetailsRow bookDetailsSource">Source: Project Gutenberg</div>`);
  return `<div class="bookDetailsContent"><div class="bookDetailsInfo">${rows.join("")}</div></div>`;
}

async function _fetchWikipediaDetails(title, author){
  const q = [title, author].filter(Boolean).join(" ");
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=3&format=json&origin=*`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const hits = searchData.query?.search || [];
  if (!hits.length) return null;
  const pageTitle = hits[0].title;
  const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`);
  if (!summaryRes.ok) return null;
  return summaryRes.json();
}

function _renderWikipediaResult(page){
  const rows = [];
  if (page.description){
    rows.push(`<div class="bookDetailsRow"><span class="bookDetailsLabel">Description: </span>${escapeHtml(page.description)}</div>`);
  }
  if (page.extract){
    const excerpt = page.extract.length > 300 ? page.extract.slice(0, 300) + "…" : page.extract;
    rows.push(`<div class="bookDetailsRow bookDetailsExcerpt">${escapeHtml(excerpt)}</div>`);
  }
  if (page.content_urls?.desktop?.page){
    rows.push(`<div class="bookDetailsRow"><a class="bookDetailsLink" href="${escapeHtml(page.content_urls.desktop.page)}" target="_blank" rel="noopener noreferrer">View on Wikipedia →</a></div>`);
  }
  rows.push(`<div class="bookDetailsRow bookDetailsSource">Source: Wikipedia</div>`);
  const thumbHtml = page.thumbnail?.source
    ? `<div class="bookDetailsCover"><img src="${escapeHtml(page.thumbnail.source)}" alt="Illustration" loading="lazy"></div>`
    : "";
  return `<div class="bookDetailsContent">${thumbHtml}<div class="bookDetailsInfo">${rows.join("")}</div></div>`;
}

function handleBookDetailsToggle(btn){
  const section = btn.closest(".bookDetailsSection");
  if (!section) return;
  const isOpen = section.classList.contains("open");
  if (isOpen){
    section.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  } else {
    section.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    loadBookDetails(section);
  }
}

function closeLearningGoalDrawers(root = document, options = {}) {
  const restoreFocus = options.restoreFocus;
  root.querySelectorAll(".ytGoalWrap.open").forEach(wrap => {
    wrap.classList.remove("open");
    const btn = $("[data-action='toggleLearningGoals'], [data-action='toggleYouTubeGoals']", wrap);
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
  root.querySelectorAll(".learningGoalsHostOpen").forEach(host => { host.classList.remove("learningGoalsHostOpen"); });
  if (restoreFocus && lastLearningGoalToggleBtn && document.contains(lastLearningGoalToggleBtn)) {
    lastLearningGoalToggleBtn.focus();
  }
}
function _toggleLearningGoalDrawer(btn) {
  const wrap = btn.closest(".ytGoalWrap");
  if (!wrap) return;
  const host = btn.closest(".workRow, .libCard");
  const willOpen = !wrap.classList.contains("open");
  closeLearningGoalDrawers();
  if (willOpen) {
    wrap.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    if (host) host.classList.add("learningGoalsHostOpen");
    lastLearningGoalToggleBtn = btn;
  } else {
    lastLearningGoalToggleBtn = null;
  }
}

