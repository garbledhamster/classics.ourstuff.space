import test from 'node:test';
import assert from 'node:assert/strict';

const overview = new URL('../../assets/js/classics/study-overview.js', import.meta.url);
const noteTypes = new URL('../../assets/js/classics/note-types.js', import.meta.url);
const entry = (key, year = 1) => ({ key, year, author: 'Plato', work: { title: 'Republic', selection: 'Books I–II' }, greatIdeas: ['Justice'] });
function fixture() {
  return {
    flatWorks: [entry('1|1|core|Plato|Republic'), entry('2|1|core|Plato|Republic', 2)],
    checks: { '1|1|core|Plato|Republic': true, 'removed-reading': true },
    filters: { year: '2' },
    notes: [
      { id: 'n1', title: 'First', body: 'My first thought', note_type: 'great_idea' },
      { id: 'n2', title: 'Second', body: 'My second thought', note_type: ['note', 'great_idea'] },
      { id: 'n3', title: 'Archived', archived: true, note_type: ['great_idea'] }
    ],
    conversationDesk: { drafts: [{ id: 'd1', title: 'One', body: 'Original text' }, { id: 'd2', title: 'Two' }] }
  };
}

// Catches unique-title counting, stale completions, archived inclusion, and mutation.
test('Home counts current occurrences, active note types and existing writings without changing state', async () => {
  const { deriveHomeSummary } = await import(overview);
  const readerState = fixture(), originalState = structuredClone(readerState);
  const summary = deriveHomeSummary(readerState);
  assert.equal(summary.completedReadings, 1);
  assert.equal(summary.planReadings, 2);
  assert.equal(summary.activeNotes, 2);
  assert.equal(summary.greatIdeaNotes, 2);
  assert.equal(summary.writings, 2);
  assert.deepEqual(summary.notes.map(n => n.id), ['n1', 'n2']);
  assert.deepEqual(summary.drafts.map(d => d.id), ['d1', 'd2']);
  assert.equal(summary.continuationKey, '2|1|core|Plato|Republic');
  assert.ok(readerState.flatWorks.some(w => w.key === summary.continuationKey));
  assert.deepEqual(readerState, originalState);
});

// Catches missed priority, invalid/complete selected keys and all-complete fallback.
test('continuation honors current selection, then current year, then plan order', async () => {
  const { deriveHomeSummary } = await import(overview);
  const s = fixture();
  s.flatWorks.push(entry('3|1|core|Aristotle|Ethics', 3));
  s.selectedReadingKey = '3|1|core|Aristotle|Ethics';
  assert.equal(deriveHomeSummary(s).continuationKey, '3|1|core|Aristotle|Ethics');
  s.selectedReadingKey = '1|1|core|Plato|Republic';
  assert.equal(deriveHomeSummary(s).continuationKey, '1|1|core|Plato|Republic');
  s.selectedReadingKey = 'r-001';
  assert.equal(deriveHomeSummary(s).continuationKey, '2|1|core|Plato|Republic');
  s.filters.year = '9';
  assert.equal(deriveHomeSummary(s).continuationKey, '2|1|core|Plato|Republic');
  s.checks['2|1|core|Plato|Republic'] = true;
  s.checks['3|1|core|Aristotle|Ethics'] = true;
  s.selectedReadingKey = '1|1|core|Plato|Republic';
  assert.equal(deriveHomeSummary(s).continuationKey, null);
});

test('empty state produces zero metrics and no continuation', async () => {
  const { deriveHomeSummary } = await import(overview);
  const s = deriveHomeSummary({});
  assert.deepEqual([s.completedReadings, s.planReadings, s.activeNotes, s.greatIdeaNotes, s.writings], [0, 0, 0, 0, 0]);
  assert.equal(s.continuationKey, null);
  assert.deepEqual(s.notes, []);
  assert.deepEqual(s.drafts, []);
});

// Catches compatibility changes for old string and empty array note types.
test('note types retain the original array, string and empty/missing fallback behavior', async () => {
  const { getNoteTypes } = await import(noteTypes);
  for (const [note, want] of [[{}, ['note']], [{note_type: []}, ['note']], [{note_type: ''}, ['note']], [{note_type: 'great_idea'}, ['great_idea']], [{note_type: ['quote','great_idea']}, ['quote','great_idea']]]) {
    assert.deepEqual(getNoteTypes(note), want);
  }
  const note = { note_type: ['great_idea'] };
  assert.equal(getNoteTypes(note), note.note_type);
});

// Catches unsafe saved-text interpolation, prototype data and wrong record destinations.
test('Home renders original record text with escaped IDs, source guidance and empty states', async () => {
  const { renderStudyHome } = await import('../../assets/js/classics/study-home.js');
  const { deriveHomeSummary } = await import(overview);
  const s = fixture();
  s.notes[0].title = '<script>saved</script>';
  s.flatWorks[1].readingGuide = { hook: 'Exact source hook', beforeReading: 'Existing source guidance.' };
  const root = { innerHTML: '' };
  renderStudyHome(root, deriveHomeSummary(s));
  assert.ok(root.innerHTML.includes('Great Idea notes'));
  assert.ok(root.innerHTML.includes('&lt;script&gt;saved&lt;/script&gt;'));
  assert.ok(!root.innerHTML.includes('<script>saved</script>'));
  assert.ok(root.innerHTML.includes('Exact source hook'));
  assert.ok(root.innerHTML.includes('Existing source guidance.'));
  assert.ok(root.innerHTML.includes('data-home-note="n1"'));
  assert.ok(root.innerHTML.includes('data-home-draft="d1"'));
  assert.ok(root.innerHTML.includes('Original text'));
  renderStudyHome(root, deriveHomeSummary({}));
  assert.ok(root.innerHTML.includes('No active notes'));
  assert.ok(root.innerHTML.includes('No saved writings'));
  assert.ok(!root.innerHTML.includes('data-home-reading='));
});

// Catches a misleading 0/0 progress display after finishing an all-years view.
test('all-complete all-years overview retains the completed plan progress', async () => {
  const { deriveHomeSummary } = await import(overview);
  const s = fixture();
  s.checks['2|1|core|Plato|Republic'] = true;
  s.filters.year = 'all';
  const summary = deriveHomeSummary(s);
  assert.equal(summary.continuationKey, null);
  assert.equal(summary.yearReadings, 2);
  assert.equal(summary.yearCompleted, 2);
});
