/* export.js — Export reading progress as CSV/JSON and notes as JSON */
/* =========================================================
   EXPORT PROGRESS & NOTES
   ========================================================= */
function buildExportRows(){
  // Build one row per unique book (author + title), deduped from flatWorks
  const seen = new Map();
  for (const fw of state.flatWorks){
    const author = fw.author || "";
    const title = fw.work.title || "";
    const key = getCardStatusKey(author, title);
    if (!seen.has(key)){
      const statusVal = getCardStatus(key);
      const statusLabel = (CARD_STATUS_OPTIONS.find(o => o.value === statusVal) || {}).label || statusVal;
      const taskVal = getCardTask(key).task;
      const taskOpt = CARD_TASK_OPTIONS.find(o => o.value === taskVal);
      const taskLabel = taskOpt ? taskOpt.label : "";
      const dates = getCardDates(key);
      const bookNotes = state.notes.filter(n => !n.archived && n.book_tag === title);
      const notesText = bookNotes.map(n => `[${n.title || ""}] ${n.body || ""}`.trim()).join("\n\n---\n\n");
      seen.set(key, {
        author,
        title,
        year: fw.year,
        tier: fw.tier,
        status: statusLabel,
        current_action: taskLabel,
        date_started: dates.started || "",
        date_finished: dates.finished || "",
        notes_count: bookNotes.length,
        notes: notesText
      });
    }
  }
  return Array.from(seen.values());
}

function downloadFile(filename, content, mimeType){
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportProgressCsv(){
  const rows = buildExportRows();
  const headers = ["Author", "Title", "Year", "Tier", "Status", "Current Action", "Date Started", "Date Finished", "Notes Count", "Notes"];
  function csvCell(v){
    const s = String(v == null ? "" : v);
    if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")){
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map(r => [r.author, r.title, r.year, r.tier, r.status, r.current_action, r.date_started, r.date_finished, r.notes_count, r.notes].map(csvCell).join(","))
  ];
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(`classics-progress-${dateStr}.csv`, lines.join("\r\n"), "text/csv;charset=utf-8;");
}

function exportProgressJson(){
  const rows = buildExportRows();
  const dateStr = new Date().toISOString().slice(0, 10);
  const payload = {
    exported_at: new Date().toISOString(),
    plan_name: state.plan?.plan_name || "Ten-Year Plan",
    entries: rows
  };
  downloadFile(`classics-progress-${dateStr}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function showExportModal(){
  const modal = $("#exportModal");
  const overlay = $("#overlay");
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  const cancelBtn = $("#exportModalCancelBtn");
  const csvBtn = $("#exportModalCsvBtn");
  const jsonBtn = $("#exportModalJsonBtn");

  function closeModal(){
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    cancelBtn.removeEventListener("click", handleCancel);
    csvBtn.removeEventListener("click", handleCsv);
    jsonBtn.removeEventListener("click", handleJson);
  }
  function handleCancel(){ closeModal(); }
  function handleCsv(){ closeModal(); exportProgressCsv(); }
  function handleJson(){ closeModal(); exportProgressJson(); }

  cancelBtn.addEventListener("click", handleCancel);
  csvBtn.addEventListener("click", handleCsv);
  jsonBtn.addEventListener("click", handleJson);
  setTimeout(() => csvBtn.focus(), 100);
}
