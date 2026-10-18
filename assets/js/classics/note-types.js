// Keep this pure helper independent of foundation's eager storage initialization.
// The fallback matches foundation.DEFAULT_NOTE_TYPE; its existing value is protected.
const DEFAULT_NOTE_TYPE = "note";
function getNoteTypes(n){
  if (Array.isArray(n.note_type)) return n.note_type.length ? n.note_type : [DEFAULT_NOTE_TYPE];
  if (n.note_type && typeof n.note_type === "string") return [n.note_type];
  return [DEFAULT_NOTE_TYPE];
}
export { getNoteTypes };
