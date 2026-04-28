/* storage.js — localStorage read/write for all persisted app data */
// Forward declaration for triggerAutoSync (actual implementation is after sync functions)
let triggerAutoSync = () => {};

function loadChecks(){
  return safeJsonParse(localStorage.getItem(LS_CHECKS) || "{}", {});
}
function saveChecks(obj){
  localStorage.setItem(LS_CHECKS, JSON.stringify(obj));
  triggerAutoSync();
}

function loadNotes(){
  return safeJsonParse(localStorage.getItem(LS_NOTES) || "[]", []);
}
function saveNotes(arr){
  localStorage.setItem(LS_NOTES, JSON.stringify(arr));
  triggerAutoSync();
}

function loadDeletedNoteIds(){
  return new Set(safeJsonParse(localStorage.getItem(LS_DELETED_NOTES) || "[]", []));
}
function saveDeletedNoteIds(idSet){
  localStorage.setItem(LS_DELETED_NOTES, JSON.stringify(Array.from(idSet)));
}
function loadCardStatuses(){
  return safeJsonParse(localStorage.getItem(LS_CARD_STATUS) || "{}", {});
}
function saveCardStatuses(obj){
  localStorage.setItem(LS_CARD_STATUS, JSON.stringify(obj));
  triggerAutoSync();
}
function loadCardTasks(){
  return safeJsonParse(localStorage.getItem(LS_CARD_TASKS) || "{}", {});
}
function saveCardTasks(obj){
  localStorage.setItem(LS_CARD_TASKS, JSON.stringify(obj));
  triggerAutoSync();
}
function loadCardDates(){
  return safeJsonParse(localStorage.getItem(LS_CARD_DATES) || "{}", {});
}
function saveCardDates(obj){
  localStorage.setItem(LS_CARD_DATES, JSON.stringify(obj));
  triggerAutoSync();
}

function loadTableHiddenCols(){
  try { return new Set(JSON.parse(localStorage.getItem(LS_TABLE_HIDDEN_COLS) || "[]")); } catch(e){ console.error("Failed to load table column preferences:", e); return new Set(); }
}
function saveTableHiddenCols(set){
  try { localStorage.setItem(LS_TABLE_HIDDEN_COLS, JSON.stringify(Array.from(set))); } catch(e){ console.error("Failed to save table column preferences:", e); }
}
