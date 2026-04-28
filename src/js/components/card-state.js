/* components/card-state.js — Card status/task/date rendering and mutation handlers */
function getCardStatusKey(author, title){
  const a = String(author || "").toLowerCase();
  const t = String(title || "").toLowerCase();
  return JSON.stringify([a, t]);
}
function getCardStatus(statusKey){
  const value = state.cardStatuses[statusKey] || DEFAULT_CARD_STATUS;
  return CARD_STATUS_OPTIONS.some(opt => opt.value === value) ? value : DEFAULT_CARD_STATUS;
}
function isValidCardTask(taskValue){
  return CARD_TASK_OPTIONS.some(opt => opt.value === taskValue);
}
function getCardTask(statusKey){
  const raw = state.cardTasks[statusKey] || {};
  const task = isValidCardTask(raw.task) ? raw.task : DEFAULT_CARD_TASK;
  return { task };
}
function getCardPillData(author, title){
  const key = getCardStatusKey(author, title);
  const statusVal = getCardStatus(key);
  const statusLabel = (CARD_STATUS_OPTIONS.find(o => o.value === statusVal) || {}).label || statusVal;
  const taskVal = getCardTask(key).task;
  const taskOpt = taskVal !== DEFAULT_CARD_TASK ? CARD_TASK_OPTIONS.find(o => o.value === taskVal) : null;
  return { statusLabel, taskOpt };
}
function renderStatusSelector(author, title){
  const statusKey = getCardStatusKey(author, title);
  const current = getCardStatus(statusKey);
  const options = CARD_STATUS_OPTIONS.map(opt => `<option value="${escapeHtml(opt.value)}"${opt.value === current ? " selected" : ""}>${escapeHtml(opt.label)}</option>`).join("");
  return `
    <select class="statusSelect" data-action="setCardStatus" data-statuskey="${escapeHtml(statusKey)}" aria-label="Reading status for ${escapeHtml(title)} by ${escapeHtml(author)}">
      ${options}
    </select>
  `;
}
function renderTaskTracker(author, title){
  const statusKey = getCardStatusKey(author, title);
  const current = getCardTask(statusKey);
  const currentOpt = CARD_TASK_OPTIONS.find(o => o.value === current.task);
  const triggerLabel = currentOpt ? currentOpt.label : "No Action";
  const allOpts = CARD_TASK_GROUPS.flatMap(g => g.options);
  const optButtons = [
    `<button class="taskDropOpt taskDropOptNone" role="option" type="button"
        data-action="selectTaskOption" data-task="${escapeHtml(DEFAULT_CARD_TASK)}"
        aria-selected="${current.task === DEFAULT_CARD_TASK ? "true" : "false"}">
      <span class="taskOptStep"></span>
      <div class="taskOptBody"><span class="taskOptLabel">No Action</span></div>
    </button>`,
    ...allOpts.map((opt, idx) => `
      <button class="taskDropOpt" role="option" type="button"
          data-action="selectTaskOption" data-task="${escapeHtml(opt.value)}"
          aria-selected="${opt.value === current.task ? "true" : "false"}"
          title="${escapeHtml(opt.description || "")}">
        <span class="taskOptStep">${idx + 1}</span>
        <div class="taskOptBody">
          <span class="taskOptLabel">${escapeHtml(opt.label)}</span>
          <span class="taskOptDesc">${escapeHtml(opt.description || "")}</span>
        </div>
      </button>`)
  ].join("");
  return `
    <div class="taskTracker">
      <div class="taskDrop" data-statuskey="${escapeHtml(statusKey)}">
        <button class="statusSelect taskDropTrigger" type="button"
            data-action="toggleTaskDropdown"
            aria-haspopup="listbox" aria-expanded="false"
            aria-label="Current reading action for ${escapeHtml(title)} by ${escapeHtml(author)}">
          <span class="taskDropLabel">${escapeHtml(triggerLabel)}</span>
          <svg class="taskDropArrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="taskDropPanel" role="listbox" aria-label="Reading action options" hidden>
          ${optButtons}
        </div>
      </div>
    </div>
  `;
}
function renderCardMetaControls(author, title){
  return `
    <div class="cardMetaControls">
      ${renderCardDateFields(author, title)}
      ${renderStatusSelector(author, title)}
      ${renderTaskTracker(author, title)}
    </div>
  `;
}


function normalizeCardDateValue(value){
  const v = String(value || "").trim();
  if (!v) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "";
  const [yyyyNum, monthNum, dayNum] = v.split("-").map(Number);
  const parsed = new Date(Date.UTC(yyyyNum, monthNum - 1, dayNum));
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = String(parsed.getUTCFullYear()).padStart(4, "0");
  const mm = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` === v ? v : "";
}
function getCardDates(dateKey){
  const entry = state.cardDates[dateKey];
  if (!entry || typeof entry !== "object") return { started: "", finished: "" };
  return {
    started: normalizeCardDateValue(entry.started),
    finished: normalizeCardDateValue(entry.finished)
  };
}
function renderCardDateFields(author, title){
  const dateKey = getCardStatusKey(author, title);
  const dates = getCardDates(dateKey);
  return `
    <div class="cardDateFields">
      <label class="cardDateField">
        <span class="cardDateLabel">Date Started</span>
        <input class="cardDateInput" type="date" data-action="setCardDate" data-datekey="${escapeHtml(dateKey)}" data-datefield="started" value="${escapeHtml(dates.started)}" aria-label="Date Started" >
      </label>
      <label class="cardDateField">
        <span class="cardDateLabel">Date Finished</span>
        <input class="cardDateInput" type="date" data-action="setCardDate" data-datekey="${escapeHtml(dateKey)}" data-datefield="finished" value="${escapeHtml(dates.finished)}" aria-label="Date Finished" >
      </label>
    </div>
  `;
}
let lastLearningGoalToggleBtn = null;

function applyCardStatusChange(statusKey, statusValue){
  if (!statusKey || !CARD_STATUS_OPTIONS.some(opt => opt.value === statusValue)) {
    console.warn("Invalid card status update ignored.", { statusKey, statusValue });
    return;
  }
  state.cardStatuses[statusKey] = statusValue;
  saveCardStatuses(state.cardStatuses);
}
function applyCardTaskChange(statusKey, updates){
  if (!statusKey) {
    console.warn("Invalid card task update ignored.", { statusKey, updates });
    return;
  }
  const current = getCardTask(statusKey);
  let nextTask = current.task;
  if (updates && "task" in updates && isValidCardTask(updates.task)) {
    nextTask = updates.task;
  }
  if (nextTask === DEFAULT_CARD_TASK) {
    delete state.cardTasks[statusKey];
  } else {
    state.cardTasks[statusKey] = {
      task: nextTask
    };
  }
  saveCardTasks(state.cardTasks);
}
function applyCardDateChange(dateKey, dateField, dateValue){
  if (!dateKey || !["started", "finished"].includes(dateField)) {
    console.warn("Invalid card date update ignored.", { dateKey, dateField, dateValue });
    return;
  }
  const normalized = normalizeCardDateValue(dateValue);
  if (dateValue && !normalized) {
    console.warn("Invalid card date value ignored.", { dateKey, dateField, dateValue });
    return;
  }
  const current = getCardDates(dateKey);
  const next = { ...current };
  if (!normalized) delete next[dateField];
  else next[dateField] = normalized;
  if (!next.started && !next.finished) delete state.cardDates[dateKey];
  else state.cardDates[dateKey] = next;
  saveCardDates(state.cardDates);
}
function handleCardStatusSelectChangeEvent(e){
  const statusSelect = e.target.closest('select[data-action="setCardStatus"]');
  if (!statusSelect) return false;
  const statusKey = statusSelect.dataset.statuskey || "";
  const statusValue = statusSelect.value || DEFAULT_CARD_STATUS;
  applyCardStatusChange(statusKey, statusValue);
  return true;
}
function handleCardTaskControlChangeEvent(e){
  const taskSelect = e.target.closest('select[data-action="setCardTask"]');
  if (taskSelect) {
    const statusKey = taskSelect.dataset.statuskey || "";
    const taskValue = taskSelect.value || DEFAULT_CARD_TASK;
    applyCardTaskChange(statusKey, { task: taskValue });
    return true;
  }
  return false;
}
function closeAllTaskDropdowns(){
  document.querySelectorAll('.taskDropPanel:not([hidden])').forEach(panel => {
    panel.hidden = true;
    panel.style.left = '';
    panel.style.right = '';
    panel.style.transform = '';
    const drop = panel.closest('.taskDrop');
    const trigger = drop?.querySelector('.taskDropTrigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    const host = drop && (drop.closest('.libCard') || drop.closest('.workRow'));
    if (host) host.classList.remove('taskDropOpen');
  });
}
function repositionTaskDropPanel(panel){
  // Reset to default left-aligned position
  panel.style.left = '0';
  panel.style.right = '';
  panel.style.transform = '';
  const rect = panel.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  if (rect.right > vw - 8) {
    // Flip to right-aligned
    panel.style.left = 'auto';
    panel.style.right = '0';
    const rect2 = panel.getBoundingClientRect();
    if (rect2.left < 8) {
      // Panel is wider than viewport — center it
      panel.style.left = '50%';
      panel.style.right = 'auto';
      panel.style.transform = 'translateX(-50%)';
    }
  }
}
function handleTaskDropdownClickEvent(e){
  const trigger = e.target.closest('[data-action="toggleTaskDropdown"]');
  if (trigger) {
    const drop = trigger.closest('.taskDrop');
    if (!drop) return false;
    const panel = drop.querySelector('.taskDropPanel');
    if (!panel) return false;
    const isOpen = !panel.hidden;
    closeAllTaskDropdowns();
    if (!isOpen) {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const host = drop.closest('.libCard') || drop.closest('.workRow');
      if (host) host.classList.add('taskDropOpen');
      repositionTaskDropPanel(panel);
      // Focus the selected option or first option for keyboard nav
      const selected = panel.querySelector('.taskDropOpt[aria-selected="true"]') || panel.querySelector('.taskDropOpt');
      if (selected) selected.focus();
    }
    return true;
  }
  const opt = e.target.closest('[data-action="selectTaskOption"]');
  if (opt) {
    const taskValue = opt.dataset.task || DEFAULT_CARD_TASK;
    const drop = opt.closest('.taskDrop');
    if (!drop) return false;
    const statusKey = drop.dataset.statuskey || "";
    applyCardTaskChange(statusKey, { task: taskValue });
    // Update trigger label
    const taskOpt = CARD_TASK_OPTIONS.find(o => o.value === taskValue);
    const labelText = taskOpt ? taskOpt.label : "No Action";
    const labelEl = drop.querySelector('.taskDropLabel');
    if (labelEl) labelEl.textContent = labelText;
    // Update aria-selected on all options in this drop
    drop.querySelectorAll('.taskDropOpt').forEach(o => {
      o.setAttribute('aria-selected', o.dataset.task === taskValue ? 'true' : 'false');
    });
    closeAllTaskDropdowns();
    // Return focus to trigger
    const triggerBtn = drop.querySelector('.taskDropTrigger');
    if (triggerBtn) triggerBtn.focus();
    // Update button visibility for the task that was just selected
    const hostEl = drop.closest('.workRow, .libCard');
    if (hostEl) {
      const actionsEl = hostEl.querySelector('.workActions, .libActions');
      applyTaskVisibility(actionsEl, taskValue);
    }
    return true;
  }
  return false;
}
function handleCardDateInputChangeEvent(e){
  const dateInput = e.target.closest('input[data-action="setCardDate"]');
  if (!dateInput) return false;
  const dateKey = dateInput.dataset.datekey || "";
  const dateField = dateInput.dataset.datefield || "";
  // User picked a real date — remove the prefill marker so blur won't clear it
  if (dateField === "finished") delete dateInput.dataset.prefilled;
  applyCardDateChange(dateKey, dateField, dateInput.value || "");
  return true;
}
function handleFinishedDateFocusEvent(e){
  const dateInput = e.target.closest('input[data-action="setCardDate"][data-datefield="finished"]');
  if (!dateInput || dateInput.value) return;
  const dateKey = dateInput.dataset.datekey || "";
  const dates = getCardDates(dateKey);
  if (!dates.started) return;
  dateInput.value = dates.started;
  dateInput.dataset.prefilled = "1";
}
function handleFinishedDateBlurEvent(e){
  const dateInput = e.target.closest('input[data-action="setCardDate"][data-datefield="finished"]');
  if (!dateInput || !dateInput.dataset.prefilled) return;
  delete dateInput.dataset.prefilled;
  dateInput.value = "";
}
