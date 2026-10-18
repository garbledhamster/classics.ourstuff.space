import { getNoteTypes } from "./note-types.js";

// A projection of existing state. selectedReadingKey is supplied from the current
// open Bookclub row; it is never stored as a new reader field.
function deriveHomeSummary(readerState){
  const plan = readerState.flatWorks || [];
  const checks = readerState.checks || {};
  const notes = (readerState.notes || []).filter(note => !note.archived)
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  const drafts = (readerState.conversationDesk?.drafts || []).slice();
  const unchecked = plan.filter(reading => !checks[reading.key]);
  const continuation = unchecked.length ? (plan.find(reading => reading.key === readerState.selectedReadingKey)
    || unchecked.find(reading => String(reading.year) === String(readerState.filters?.year))
    || unchecked[0]) : null;
  const year = continuation?.year ?? readerState.filters?.year;
  const yearReadings = year === "all" || year == null ? plan
    : plan.filter(reading => String(reading.year) === String(year));
  return {
    completedReadings: plan.filter(reading => checks[reading.key]).length,
    planReadings: plan.length,
    activeNotes: notes.length,
    greatIdeaNotes: notes.filter(note => getNoteTypes(note).includes("great_idea")).length,
    writings: drafts.length,
    continuationKey: continuation?.key ?? null,
    notes,
    drafts,
    continuation,
    nextReading: unchecked.find(reading => reading !== continuation) || null,
    year,
    yearReadings: yearReadings.length,
    yearCompleted: yearReadings.filter(reading => checks[reading.key]).length
  };
}
export { deriveHomeSummary };
