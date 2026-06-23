
import {
  $,
  CARD_STATUS_OPTIONS,
  CARD_TASK_GROUPS,
  CARD_TASK_OPTIONS,
  DEFAULT_CARD_STATUS,
  DEFAULT_CARD_TASK,
  LS_TIMER_SETTINGS,
  LS_TIMER_STATE,
  escapeHtml,
  notifyAfterSave,
  safeJsonParse,
  saveCardDates,
  saveCardStatuses,
  saveCardTasks,
  saveReadingStageChecks,
  state
} from "./foundation.js";
/* Card status, task, date, and reading-stage rendering and mutation handlers */
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

function applyTaskVisibility(actionsEl, taskValue) {
  if (!actionsEl) return;
  void taskValue;
  actionsEl.querySelectorAll("[data-btn-group]").forEach(el => {
    el.style.display = "";
  });
}

function applyAllTaskVisibilities(containerEl) {
  if (!containerEl) return;
  containerEl.querySelectorAll(".workActions, .libActions").forEach(actionsEl => {
    const row = actionsEl.closest(".workRow");
    const card = actionsEl.closest(".libCard");
    let taskValue = DEFAULT_CARD_TASK;
    if (row) {
      const author = row.dataset.author || "";
      const title = row.dataset.book || "";
      taskValue = getCardTask(getCardStatusKey(author, title)).task;
    } else if (card) {
      const author = card.dataset.author || "";
      const title = card.dataset.title || "";
      taskValue = getCardTask(getCardStatusKey(author, title)).task;
    }
    applyTaskVisibility(actionsEl, taskValue);
  });
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

const READING_STAGE_OPTIONS = [
  { key: "before", label: "Before reading", field: "beforeReading" },
  { key: "during", label: "During reading", field: "duringReading" },
  { key: "after", label: "After reading", field: "afterReading" }
];
const READING_STAGE_SEARCH_LABELS = {
  before: "Find context",
  during: "Find lecture",
  after: "Find follow-up"
};
const READING_STAGE_FALLBACK_RESOURCE_INDEX = {
  before: 0,
  during: 1,
  after: 2
};

function splitReadingResourceList(value){
  return String(value || "")
    .split(";")
    .map(part => part.trim())
    .filter(Boolean);
}

function compactReadingResourceLabel(title){
  const firstPart = String(title || "").split(/\s+[—–-]\s+/)[0].trim();
  const cleaned = firstPart
    .replace(/\s+/g, " ")
    .replace(/^The\s+/i, "")
    .trim();
  if (!cleaned) return "Resource";
  return cleaned.length > 34 ? `${cleaned.slice(0, 31).trim()}...` : cleaned;
}

function readingResourceSearchUrl(query, videoMode=false){
  const q = encodeURIComponent(String(query || "").replace(/\s+/g, " ").trim());
  return `https://duckduckgo.com/?q=${q}${videoMode ? "&iax=videos&ia=videos" : ""}`;
}

function getReadingGuideResources(guide){
  const titles = splitReadingResourceList(guide?.resourceTitles);
  return titles.map((title, index) => ({
    title,
    label: compactReadingResourceLabel(title)
  })).filter(resource => resource.title);
}

function normalizeReadingMatchText(value){
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readingStageMentionsResource(stageText, resourceTitle){
  const haystack = normalizeReadingMatchText(stageText);
  const label = normalizeReadingMatchText(compactReadingResourceLabel(resourceTitle));
  if (!haystack || !label) return false;
  const tokens = label.split(" ").filter(token => token.length > 3 || /\d/.test(token));
  return tokens.some(token => haystack.includes(token));
}

function extractReadingStageSearchText(stageText){
  const text = String(stageText || "").trim();
  const quoted = text.match(/[“"]([^”"]+)[”"]/);
  if (quoted && quoted[1]) return quoted[1].trim();
  return text
    .replace(/\buse\/search:\s*/i, "")
    .replace(/\bthen\s+.*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stageShouldUseVideoSearch(stageText){
  return /\b(video|videos|youtube|lecture|documentary|episode|theatre|theater|course|watch)\b/i.test(stageText);
}

function getReadingStageResourcePills(workItem, stage, stageText){
  const guide = workItem.readingGuide || {};
  const resources = getReadingGuideResources(guide);
  const matched = resources.filter(resource => readingStageMentionsResource(stageText, resource.title));
  if (!matched.length) {
    const fallback = resources[READING_STAGE_FALLBACK_RESOURCE_INDEX[stage.key]];
    if (fallback) matched.push(fallback);
  }

  const deduped = [];
  const seen = new Set();
  for (const resource of matched) {
    const key = normalizeReadingMatchText(resource.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(resource);
  }

  const resourcePills = deduped.slice(0, 3).map(resource => {
    const searchQuery = `${resource.title} ${workItem.author || ""} ${workItem.title || ""}`.trim();
    const href = readingResourceSearchUrl(searchQuery, stageShouldUseVideoSearch(stageText));
    return `<a class="readingResourcePill" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(resource.title)}">${escapeHtml(resource.label)}</a>`;
  });

  const searchText = extractReadingStageSearchText(stageText);
  if (searchText) {
    const searchQuery = `${workItem.title || ""} ${workItem.author || ""} ${searchText}`.trim();
    resourcePills.push(`<a class="readingResourcePill readingSearchPill" href="${escapeHtml(readingResourceSearchUrl(searchQuery, stageShouldUseVideoSearch(stageText)))}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(searchQuery)}">${escapeHtml(READING_STAGE_SEARCH_LABELS[stage.key] || "Find more")}</a>`);
  }

  if (!resourcePills.length) return "";
  return `<span class="readingResourcePills">${resourcePills.join("")}</span>`;
}

function getReadingStageState(workKeyValue){
  const raw = state.readingStageChecks[workKeyValue] || {};
  return {
    before: !!raw.before,
    during: !!raw.during,
    after: !!raw.after
  };
}

function renderReadingStageChecklist(workItem){
  const guide = workItem.readingGuide;
  if (!guide) return "";
  const checks = getReadingStageState(workItem.key);
  const rows = READING_STAGE_OPTIONS.map(stage => {
    const text = guide[stage.field] || "";
    if (!text) return "";
    return `
      <div class="readingStageItem">
        <span class="readingStageLabel">${escapeHtml(stage.label)}</span>
        <label class="readingStageCheck">
          <input type="checkbox"
            data-action="toggleReadingStage"
            data-workkey="${escapeHtml(workItem.key)}"
            data-stage="${escapeHtml(stage.key)}"
            ${checks[stage.key] ? "checked" : ""}>
          <span class="readingStageText">
            <span class="readingStagePrompt">${escapeHtml(text)}</span>
          </span>
        </label>
        ${getReadingStageResourcePills(workItem, stage, text)}
      </div>
    `;
  }).join("");
  if (!rows.trim()) return "";
  return `
    <section class="readingStageChecklist" aria-label="Reading checklist">
      ${guide.hook ? `<p class="readingStageHook">${escapeHtml(guide.hook)}</p>` : ""}
      <div class="readingStageGrid">${rows}</div>
    </section>
  `;
}

function applyReadingStageChange(workKeyValue, stageKey, checked){
  if (!workKeyValue || !READING_STAGE_OPTIONS.some(stage => stage.key === stageKey)) return;
  const current = getReadingStageState(workKeyValue);
  const next = { ...current, [stageKey]: !!checked };
  if (!next.before && !next.during && !next.after) delete state.readingStageChecks[workKeyValue];
  else state.readingStageChecks[workKeyValue] = next;
  saveReadingStageChecks(state.readingStageChecks);
}

function handleReadingStageCheckboxChangeEvent(e){
  const cb = e.target.closest('input[type="checkbox"][data-action="toggleReadingStage"]');
  if (!cb) return false;
  applyReadingStageChange(cb.dataset.workkey || "", cb.dataset.stage || "", cb.checked);
  return true;
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

/* Pomodoro study timer: presets, custom input, Web Audio alarms, and persistence */
/* =========================================================
   TIMER
   ========================================================= */
let applyTimerSettings = () => {};
let closeTimerModal = () => {};

(() => {
  let _timerInterval = null;
  let _timerRemaining = 25 * 60; // seconds
  let _timerRunning = false;
  let _timerOriginal = 25 * 60;

  const display = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("timerStartBtn");
  const resetBtn = document.getElementById("timerResetBtn");
  const setCustomBtn = document.getElementById("timerSetCustomBtn");
  const alarmSelect = document.getElementById("timerAlarmSelect");
  const testSoundBtn = document.getElementById("timerTestSoundBtn");
  const volumeSlider = document.getElementById("timerVolumeSlider");
  const volumeLabel = document.getElementById("timerVolumeLabel");
  const timerBtn = document.getElementById("timerBtn");

  // ── Persist alarm/volume settings ─────────────────────────────
  applyTimerSettings = function applyReaderTimerSettings(settings) {
    if (!settings) return;
    if (settings.alarm && alarmSelect) alarmSelect.value = settings.alarm;
    if (typeof settings.volume === "number" && volumeSlider) {
      volumeSlider.value = settings.volume;
      if (volumeLabel) volumeLabel.textContent = `${settings.volume}%`;
    }
  };

  function saveTimerSettings() {
    if (!alarmSelect || !volumeSlider) return;
    const settings = { alarm: alarmSelect.value, volume: parseInt(volumeSlider.value, 10) };
    localStorage.setItem(LS_TIMER_SETTINGS, JSON.stringify(settings));
    notifyAfterSave();
  }

  // Load saved settings on startup
  const _savedTimerSettings = safeJsonParse(localStorage.getItem(LS_TIMER_SETTINGS) || "null", null);
  applyTimerSettings(_savedTimerSettings);

  // ── Persist timer state across refreshes ──────────────────────
  function saveTimerState() {
    localStorage.setItem(LS_TIMER_STATE, JSON.stringify({
      remaining: _timerRemaining,
      original: _timerOriginal,
      running: _timerRunning,
      savedAt: _timerRunning ? Date.now() : null
    }));
  }

  // Restore timer state on load
  const _savedTimerState = safeJsonParse(localStorage.getItem(LS_TIMER_STATE) || "null", null);
  if (_savedTimerState && typeof _savedTimerState.remaining === "number" && _savedTimerState.remaining > 0) {
    let remaining = _savedTimerState.remaining;
    if (_savedTimerState.running && _savedTimerState.savedAt) {
      const elapsed = Math.floor((Date.now() - _savedTimerState.savedAt) / 1000);
      remaining = Math.max(0, remaining - elapsed);
    }
    _timerRemaining = remaining;
    _timerOriginal = typeof _savedTimerState.original === "number" ? _savedTimerState.original : remaining;
    if (_savedTimerState.running && remaining > 0) {
      _timerRunning = true;
      _timerInterval = setInterval(tick, 1000);
    }
    updateDisplay();
  }

  // ── Audio helpers ──────────────────────────────────────────────
  function getAudioCtx(){
    if (!window._timerAudioCtx){
      window._timerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (window._timerAudioCtx.state === "suspended") window._timerAudioCtx.resume();
    return window._timerAudioCtx;
  }

  function getVolume(){
    return Math.max(0, Math.min(1, (parseInt(volumeSlider.value, 10) || 0) / 100));
  }

  function playBell(ctx, vol, when){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, when);
    osc.frequency.exponentialRampToValueAtTime(440, when + 1.2);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 1.8);
    osc.start(when);
    osc.stop(when + 1.8);
  }

  function playChime(ctx, vol, when){
    [[523, 0], [659, 0.25], [784, 0.5], [1047, 0.75]].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = when + offset;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  function playBeep(ctx, vol, when){
    [0, 0.35, 0.7].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 1000;
      const t = when + offset;
      gain.gain.setValueAtTime(vol * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  function playDing(ctx, vol, when){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1318, when);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 1.4);
    osc.start(when);
    osc.stop(when + 1.4);
  }

  function playAlarm(){
    try {
      const ctx = getAudioCtx();
      const vol = getVolume();
      const when = ctx.currentTime + 0.05;
      const type = alarmSelect.value;
      if (type === "bell")  playBell(ctx, vol, when);
      else if (type === "chime") playChime(ctx, vol, when);
      else if (type === "beep")  playBeep(ctx, vol, when);
      else if (type === "ding")  playDing(ctx, vol, when);
    } catch(e) { /* audio not supported */ }
  }
  // ── End audio helpers ──────────────────────────────────────────

  function pad(n){ return String(n).padStart(2, "0"); }

  function updateDisplay(){
    const m = Math.floor(_timerRemaining / 60);
    const s = _timerRemaining % 60;
    display.textContent = `${pad(m)}:${pad(s)}`;
    if (_timerRunning){
      display.classList.add("running");
      startBtn.textContent = "Pause";
      timerBtn.classList.add("timerActive");
    } else {
      display.classList.remove("running");
      startBtn.textContent = _timerRemaining < _timerOriginal && _timerRemaining > 0 ? "Resume" : "Start";
      timerBtn.classList.remove("timerActive");
    }
  }

  function tick(){
    if (_timerRemaining <= 0){
      clearInterval(_timerInterval);
      _timerInterval = null;
      _timerRunning = false;
      _timerRemaining = 0;
      updateDisplay();
      saveTimerState();
      playAlarm();
      // Notify when done (request permission once on first tick-end if not granted)
      if (typeof Notification !== "undefined"){
        if (Notification.permission === "granted"){
          try { new Notification("Timer done! ⏰"); } catch(e){}
        } else if (Notification.permission !== "denied"){
          Notification.requestPermission().then(p => {
            if (p === "granted") try { new Notification("Timer done! ⏰"); } catch(e){}
          });
        }
      }
      startBtn.textContent = "Start";
      display.classList.remove("running");
      return;
    }
    _timerRemaining--;
    updateDisplay();
  }

  function setTimer(seconds){
    clearInterval(_timerInterval);
    _timerInterval = null;
    _timerRunning = false;
    _timerRemaining = seconds;
    _timerOriginal = seconds;
    updateDisplay();
    saveTimerState();
  }

  function openTimerModal(){
    const modal = $("#timerModal");
    const backdrop = $("#modalBackdrop");
    modal.classList.add("open");
    backdrop.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  closeTimerModal = function closeReaderTimerModal(){
    const modal = $("#timerModal");
    const backdrop = $("#modalBackdrop");
    modal.classList.remove("open");
    backdrop.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  };

  document.getElementById("timerBtn").addEventListener("click", openTimerModal);
  document.getElementById("closeTimerModalBtn").addEventListener("click", closeTimerModal);

  startBtn.addEventListener("click", ()=> {
    if (_timerRemaining <= 0) return;
    if (_timerRunning){
      clearInterval(_timerInterval);
      _timerInterval = null;
      _timerRunning = false;
    } else {
      _timerRunning = true;
      _timerInterval = setInterval(tick, 1000);
    }
    updateDisplay();
    saveTimerState();
  });

  resetBtn.addEventListener("click", ()=> {
    setTimer(_timerOriginal);
  });

  testSoundBtn.addEventListener("click", ()=> {
    playAlarm();
  });

  volumeSlider.addEventListener("input", ()=> {
    volumeLabel.textContent = `${volumeSlider.value}%`;
  });

  if (volumeSlider) volumeSlider.addEventListener("change", saveTimerSettings);
  if (alarmSelect) alarmSelect.addEventListener("change", saveTimerSettings);

  // Preset buttons
  document.getElementById("timerModal").addEventListener("click", (e)=> {
    const btn = e.target.closest("[data-timerpreset]");
    if (!btn) return;
    setTimer(Number(btn.dataset.timerpreset));
  });

  // Custom set
  setCustomBtn.addEventListener("click", ()=> {
    const mins = Math.max(0, Math.min(99, parseInt(document.getElementById("timerCustomMins").value, 10) || 0));
    const secs = Math.max(0, Math.min(59, parseInt(document.getElementById("timerCustomSecs").value, 10) || 0));
    const total = mins * 60 + secs;
    if (total <= 0) return;
    setTimer(total);
  });

  updateDisplay();
})();


/* Export reading progress as CSV/JSON and notes as JSON */
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
      const stageChecks = getReadingStageState(fw.key);
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
        before_reading_done: stageChecks.before,
        during_reading_done: stageChecks.during,
        after_reading_done: stageChecks.after,
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
  const headers = ["Author", "Title", "Year", "Tier", "Status", "Current Action", "Date Started", "Date Finished", "Before Reading Done", "During Reading Done", "After Reading Done", "Notes Count", "Notes"];
  function csvCell(v){
    const s = String(v == null ? "" : v);
    if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")){
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map(r => [r.author, r.title, r.year, r.tier, r.status, r.current_action, r.date_started, r.date_finished, r.before_reading_done, r.during_reading_done, r.after_reading_done, r.notes_count, r.notes].map(csvCell).join(","))
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

export {
  applyAllTaskVisibilities,
  applyCardDateChange,
  applyCardStatusChange,
  applyCardTaskChange,
  applyReadingStageChange,
  applyTaskVisibility,
  applyTimerSettings,
  closeAllTaskDropdowns,
  closeTimerModal,
  exportProgressCsv,
  exportProgressJson,
  getCardDates,
  getCardPillData,
  getCardStatus,
  getCardStatusKey,
  getCardTask,
  getReadingStageState,
  handleCardDateInputChangeEvent,
  handleCardStatusSelectChangeEvent,
  handleCardTaskControlChangeEvent,
  handleFinishedDateBlurEvent,
  handleFinishedDateFocusEvent,
  handleReadingStageCheckboxChangeEvent,
  renderCardDateFields,
  renderCardMetaControls,
  renderReadingStageChecklist,
  renderStatusSelector,
  renderTaskTracker,
  showExportModal
};

