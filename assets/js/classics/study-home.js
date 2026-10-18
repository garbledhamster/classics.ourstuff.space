import { getNoteTypes } from "./note-types.js";

// Text comes from saved records and the already-loaded plan, never prototype data.
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const pageButton = (label, page, primary = false) => `<button type="button" class="homeButton${primary ? " homePrimary" : " homeTextButton"}" data-home-page="${page}">${label}</button>`;
const startButton = kind => `<button type="button" class="homeButton homeTextButton" data-home-start="${kind}">Start now →</button>`;
const selection = reading => reading.work.selection || reading.work.selections?.join(" / ") || "";
function readingButton(reading){
  return `<button type="button" class="homeNext" data-home-reading="${esc(reading.key)}"><strong>${esc(reading.work.title)}</strong><small>${esc(reading.author)}${selection(reading) ? ` · ${esc(selection(reading))}` : ""}</small></button>`;
}
function renderStudyHome(root, summary){
  const reading = summary.continuation;
  const ideaNotes = summary.notes.filter(note => getNoteTypes(note).includes("great_idea"));
  const progress = summary.yearReadings ? Math.round(summary.yearCompleted / summary.yearReadings * 100) : 0;
  const guide = reading?.readingGuide;
  root.innerHTML = `
    <div class="homeHeading"><div><h1>Your study, at a glance.</h1><p>Return to your reading and the thoughts it opens up.</p></div>${pageButton("Explore the library →", "library")}</div>
    <section class="homeMetrics" aria-label="Your study progress">
      ${[
        [summary.completedReadings, "Readings finished", "plan", `${summary.planReadings} plan readings`],
        [summary.activeNotes, "Active notes", "notes", "Your saved observations"],
        [summary.greatIdeaNotes, "Great Idea notes", "great-idea-notes", "Active notes of this type"],
        [summary.writings, "Writings", "desk", "At the Conversation Desk"]
      ].map(([value, label, page, context]) => `<button type="button" class="homeMetric" data-home-page="${page}"><strong>${value}</strong><span>${label}<small>${context}</small></span></button>`).join("")}
    </section>
    <div class="homeMain">
      <section class="homeFocus" aria-labelledby="homeReadingTitle">
        <span class="homeEyebrow">${reading ? "Return to your reading" : "Your reading plan"}</span>
        <h2 id="homeReadingTitle">${reading ? esc(reading.work.title) : summary.planReadings ? "All plan readings finished." : "Your plan will appear here."}</h2>
        ${reading ? `<p class="homeAuthor">${esc(reading.author)} · Year ${esc(reading.year)}</p><p class="homeSelection">${esc(selection(reading))}</p>
          ${guide?.hook ? `<p class="homeHook">${esc(guide.hook)}</p>` : ""}
          ${guide?.beforeReading ? `<details class="homeGuidance"><summary>Before reading</summary><p>${esc(guide.beforeReading)}</p></details>` : ""}
          <div class="homeButtonRow"><button type="button" class="homeButton homePrimary" data-home-reading="${esc(reading.key)}">Continue studying →</button>${pageButton("View reading plan", "plan")}</div>` : pageButton("View reading plan", "plan", true)}
      </section>
      <aside class="homeProgress" aria-label="Reading plan progress">
        <div class="homeSectionLine"><h2>Your reading path</h2>${summary.yearReadings ? `<span>${summary.year === "all" ? "All years" : `Year ${esc(summary.year)}`}</span>` : ""}</div>
        <div class="homeProgressLabel"><span>${summary.yearCompleted} of ${summary.yearReadings} readings finished</span><span>${progress}%</span></div>
        <div class="homeProgressTrack" role="progressbar" aria-label="Current year readings finished" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div>
        <p class="homeMuted">${summary.completedReadings} of ${summary.planReadings} readings finished across the plan.</p>
        ${summary.nextReading ? `<p class="homeNextLabel">Next unread in your plan</p>${readingButton(summary.nextReading)}` : ""}
      </aside>
    </div>
    <div class="homeBottom">
      <section><div class="homeSectionLine"><h2>Great Idea notes</h2>${pageButton("View all", "great-idea-notes")}</div>
        ${ideaNotes.slice(0, 2).map(note => `<button type="button" class="homePreview" data-home-note="${esc(note.id)}"><strong>${esc(note.title || "Untitled note")}</strong><p>${esc(note.body || "")}</p><small>${esc(note.book_tag || "")}</small></button>`).join("") || `<p class="homeMuted">${summary.activeNotes ? "No active Great Idea notes." : "No active notes."}</p>${startButton("note")}`}
      </section>
      <section><div class="homeSectionLine"><h2>At the Conversation Desk</h2>${pageButton("Open desk", "desk")}</div>
        ${summary.drafts.slice(0, 2).map(draft => `<button type="button" class="homePreview" data-home-draft="${esc(draft.id)}"><strong>${esc(draft.title || "Untitled writing")}</strong><p>${esc(draft.centralQuestion || draft.body || "")}</p><small>${esc(draft.linkedBook || draft.linkedAuthor || "")}</small></button>`).join("") || `<p class="homeMuted">No saved writings.</p>${startButton("writing")}`}
      </section>
    </div>`;
}
function wireStudyHome(root, { openPage, openPlanReading, openNote, openDraft, startNote, startWriting }){
  const onClick = event => {
    const button = event.target.closest("[data-home-page], [data-home-reading], [data-home-note], [data-home-draft], [data-home-start]");
    if (!button || !root.contains(button)) return;
    if (button.dataset.homeStart === "note") startNote();
    else if (button.dataset.homeStart === "writing") startWriting();
    else if (button.dataset.homePage) openPage(button.dataset.homePage);
    else if (button.dataset.homeReading) openPlanReading(button.dataset.homeReading);
    else if (button.dataset.homeNote) openNote(button.dataset.homeNote);
    else if (button.dataset.homeDraft) openDraft(button.dataset.homeDraft);
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
export { renderStudyHome, wireStudyHome };
