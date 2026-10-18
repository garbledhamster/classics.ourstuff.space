import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The normal command always reads the real payload. The override is for
// disposable mutation fixtures; it never writes to the app or its storage.
const root = resolve(process.env.CLASSICS_PRESERVATION_ROOT ||
  resolve(dirname(fileURLToPath(import.meta.url)), '../..'));
const manifestPath = resolve(root, 'tests/interface/preservation-manifest.json');
const expectedPages = [
  ['Library', 'library', 'libraryView', 'tabLibrary'],
  ['Bookclub', 'plan', 'planView', 'tabPlan'],
  ['Great Authors', 'authors', 'authorsView', 'tabAuthors'],
  ['Conversation Desk', 'desk', 'deskView', 'tabDesk'],
  ['Glossary', 'glossary', 'glossaryView', 'tabGlossary'],
  ['Get Started', 'get-started', 'getStartedView', 'tabGetStarted'],
];
const expectedPanels = ['references', 'ideas', 'dictionary', 'wikipedia', 'library'];
const expectedData = ['bookclub.json', 'glossary_app.json', 'greatbooks.csv',
  'library.json', 'manifest.json', 'syntopicon_terms.json'].map(name => `data/${name}`);
const read = path => readFileSync(resolve(root, path), 'utf8');
const hash = path => createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex');
const normalize = text => text.replace(/\s+/g, ' ').trim();
function emittedIds(source) {
  return new Set([
    ...Array.from(source.matchAll(/\bid=["']([\w-]+)["']/g), match => match[1]),
    ...Array.from(source.matchAll(/\.id\s*=\s*["']([\w-]+)["']/g), match => match[1]),
  ]);
}
function emittedAttributes(source) {
  return new Set(Array.from(source.matchAll(/\b(data-[\w-]+)=["']([\w-]+)["']/g),
    match => `${match[1]}=${match[2]}`));
}

test('original Classics content, pages, panels, controls and requests are preserved', async t => {
  assert.ok(existsSync(manifestPath), 'Missing preservation manifest: capture the verified original source first');
  const manifest = JSON.parse(read('tests/interface/preservation-manifest.json'));
  const sources = ['index.html', 'assets/js/main.js',
    ...readdirSync(resolve(root, 'assets/js/classics')).filter(name => name.endsWith('.js'))
      .map(name => `assets/js/classics/${name}`)].map(path => ({ path, source: read(path) }));
  const allSource = sources.map(item => item.source).join('\n');
  const ids = emittedIds(allSource);
  const attributes = emittedAttributes(allSource);
  const normalizedSource = normalize(allSource);

  await t.test('baseline identifies the original public source and real payload root', () => {
    assert.equal(manifest.sourceCommit, '96892acf65e079a1efda1d35a6f8499bd59923e4');
    assert.equal(manifest.payloadRoot, '.');
    assert.equal(manifest.authoring.verified, false);
    assert.equal(manifest.authoring.packageScriptsPresent, false);
  });

  await t.test('every data file retains its original bytes, including BOMs', () => {
    assert.deepEqual(manifest.contentFiles.map(item => item.path).sort(), expectedData);
    assert.deepEqual(readdirSync(resolve(root, 'data')).map(name => `data/${name}`).sort(), expectedData);
    for (const item of manifest.contentFiles) assert.equal(hash(item.path), item.sha256, `Protected content changed: ${item.path}`);
  });

  await t.test('all six page mounts, entry controls and view routes still exist in the current app', () => {
    assert.deepEqual(manifest.pages.map(page => [page.name, page.view, page.viewId, page.entryId]), expectedPages);
    const routes = read('assets/js/classics/reader-routes.js');
    for (const page of manifest.pages) {
      assert.ok(ids.has(page.viewId), `Missing page mount: ${page.name} (${page.viewId})`);
      assert.ok(ids.has(page.entryId), `Missing page entry: ${page.name} (${page.entryId})`);
      assert.ok(routes.includes(`view === "${page.view}"`), `Missing route: ${page.view}`);
    }
    for (const item of manifest.routeGuards) assert.ok(read(item.module).includes(item.source), `Navigation wiring changed: ${item.label}`);
  });

  await t.test('Notes Drawer and all five dispatched Glossary panels remain available', () => {
    assert.equal(manifest.notesDrawer.viewId, 'notesDrawer');
    assert.equal(manifest.notesDrawer.entryId, 'openNotesBtn');
    assert.ok(ids.has('notesDrawer'), 'Missing Notes Drawer mount');
    assert.ok(ids.has('openNotesBtn'), 'Missing Notes Drawer entry');
    assert.deepEqual(manifest.glossaryPanels.map(panel => panel.view), expectedPanels);
    const glossary = read('assets/js/classics/writing-desks.js');
    const match = glossary.match(/const PAGES = (\[[^;]+\]);/);
    assert.ok(match, 'Missing Glossary panel registry');
    assert.deepEqual(JSON.parse(match[1]), expectedPanels);
    for (const panel of manifest.glossaryPanels) {
      assert.ok(glossary.includes(`if (page === "${panel.view}") ${panel.renderer}(term);`), `Missing Glossary panel dispatch: ${panel.name}`);
      assert.ok(glossary.includes(`function ${panel.renderer}(term)`), `Missing Glossary panel renderer: ${panel.name}`);
    }
  });

  await t.test('all original controls, action groups and select options still have emitted markup', () => {
    for (const group of ['library', 'bookclub', 'authors', 'notes', 'conversation', 'glossary', 'get-started', 'account', 'timer', 'export', 'donation', 'legal', 'shared']) {
      assert.ok(manifest.controlGroups.some(item => item.name === group), `Missing control group inventory: ${group}`);
    }
    for (const id of manifest.emittedIds) assert.ok(ids.has(id), `Missing emitted control/container ID: ${id}`);
    // Count emitted tags separately: a retained event-handler selector must not
    // hide deletion of the control it used to handle.
    for (const item of manifest.markupControlAttributes) {
      const tags = read(item.module).match(/<[a-zA-Z][^>]*>/g)?.join('\n') || '';
      const emitted = emittedAttributes(tags);
      for (const attr of item.attributes) assert.ok(emitted.has(attr), `Control markup missing from ${item.module}: ${attr}`);
    }
    for (const attr of manifest.controlAttributes) assert.ok(attributes.has(attr), `Missing emitted action/control: ${attr}`);
    for (const target of manifest.linkTargets) assert.ok(allSource.includes(target), `Original link target changed: ${target}`);
    for (const item of manifest.headRequests) assert.ok(read(item.module).includes(item.source), 'Head resource/reCAPTCHA request changed');
    for (const option of manifest.selectOptions) assert.ok(normalizedSource.includes(normalize(option)), `Missing original option: ${option}`);
    for (const group of manifest.controlGroups) {
      for (const id of group.ids || []) assert.ok(ids.has(id), `Missing ${group.name} control: ${id}`);
      for (const attr of group.attributes || []) assert.ok(attributes.has(attr), `Missing ${group.name} action: ${attr}`);
    }
  });

  await t.test('expanded detail sections, owner context and original public copy remain in source', () => {
    for (const label of ['Black Box Thinking', 'Linked Notes', 'Book Information', 'Reading guidance', 'Reading stages', 'Owner context']) {
      assert.ok(manifest.detailSections.some(item => item.name === label), `Missing detail inventory: ${label}`);
    }
    for (const section of manifest.detailSections) {
      for (const item of section.guards) assert.ok(read(item.module).includes(item.source), `Missing expanded detail/context: ${section.name} (${item.source})`);
    }
    assert.ok(manifest.publicCopy.length > 100, 'Incomplete public text inventory');
    for (const text of manifest.publicCopy) assert.ok(normalizedSource.includes(normalize(text)), `Original public copy missing: ${text}`);
  });

  await t.test('protected runtime, account, Firebase, storage and local-simulation modules are byte-identical', () => {
    const expected = ['data-paths.js', 'foundation.js', 'local-reader-simulation.js', 'reader-account.js', 'reading-cloud.js', 'runtime-environment.js'];
    assert.deepEqual(manifest.protectedModules.map(item => item.path.split('/').at(-1)).sort(), expected);
    for (const item of manifest.protectedModules) assert.equal(hash(item.path), item.sha256, `Protected runtime/storage changed: ${item.path}`);
    assert.equal(manifest.firebaseBridge.module, 'index.html');
    assert.ok(read('index.html').includes(manifest.firebaseBridge.source), 'Firebase inline bridge changed');
  });

  await t.test('every recorded loader retains exact request construction, defaults and fallbacks', () => {
    for (const required of ['loadPlan', 'loadReadingGuides', 'loadGlossaryTerms', '_fetchOpenLibrary', '_fetchGutendexDetails', '_fetchWikipediaDetails', 'loadDictionaryForSelectedTerm', 'loadWikipediaForSelectedTerm', 'startDonationCheckout', 'refreshPaymentSummaryFromWorker']) {
      assert.ok(manifest.loaders.some(loader => loader.functionName === required), `Missing loader inventory: ${required}`);
    }
    for (const loader of manifest.loaders) {
      assert.ok(loader.inputs && loader.endpoints.length, `Incomplete request metadata: ${loader.functionName}`);
      assert.ok(read(loader.module).includes(loader.source), `Loader construction/default/fallback changed: ${loader.functionName}`);
    }
    for (const item of manifest.savingGuards) assert.ok(read(item.module).includes(item.source), `Saving/export/timer behavior changed: ${item.label}`);
  });
});
