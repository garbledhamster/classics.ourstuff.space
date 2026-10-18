/* Inline presentation of the original browse controls. No application state lives here. */
export function connectBrowseControls({page, layout, controls}) {
  const doc = page.ownerDocument, win = doc.defaultView;
  const originalChildren = [...controls.children];
  const originalPosition = doc.createComment('Original browse controls position');
  controls.before(originalPosition);
  const toggle = doc.createElement('button');
  toggle.type = 'button'; toggle.className = 'studyBrowseToggle';
  toggle.innerHTML = '<span>Browse &amp; filters</span><span class="studyBrowseCaret" aria-hidden="true">›</span>';
  const panel = doc.createElement('section');
  panel.className = 'studyBrowsePanel'; panel.id = `${page.id}-browse-controls`;
  panel.setAttribute('aria-label', 'Browse filters and tools'); panel.hidden = true;
  toggle.setAttribute('aria-controls', panel.id); toggle.setAttribute('aria-expanded', 'false');
  panel.append(...originalChildren); controls.append(toggle, panel); layout.prepend(controls);
  const disclosures = [...panel.querySelectorAll('details')].map(node => [node, node.open]);
  // The original plan controls form one visible settings flow, with their
  // original disclosure/section and delegated handlers still in the same view.
  const filters = panel.querySelector('.planFilterControls');
  const tools = filters?.closest('details');
  const headings = [];
  if (filters) {
    tools.classList.add('studyBrowsePlanTools'); tools.open = true;
    const fields = [...filters.children];
    for (const [at, label] of [[0,'Reading plan'], [2,'Filters'], [fields.length - 1,'Tools']]) {
      const heading = doc.createElement('h3'); heading.className = 'studyBrowseHeading'; heading.textContent = label;
      fields[at].before(heading); headings.push(heading);
    }
    const about = panel.querySelector('details:has(.planRefRow)');
    if (about) panel.append(about);
  } else {
    for (const [disclosure] of disclosures) disclosure.open = true;
  }
  let letters;
  const alphabet = panel.querySelector('.abcBar');
  if (alphabet) {
    letters = doc.createElement('details'); letters.className = 'studyBrowseLetters';
    const summary = doc.createElement('summary'); summary.textContent = 'Letters';
    alphabet.before(letters); letters.append(summary, alphabet);
  }
  let frame = 0, destroyed = false;
  const visible = node => !!node?.getClientRects().length;
  function sync() {
    if (destroyed || !visible(layout)) return;
    // A tiny work region falls back to its existing bounded view scroller.
    // At normal heights retain 112px of list below the settings; at shorter
    // heights use a smaller split, while keeping every control scrollable.
    const height = layout.clientHeight;
    const reserve = height >= 240 ? 112 : 48;
    const available = Math.max(48, Math.min(height * .60, height - toggle.offsetHeight - reserve - 8));
    const value = `${Math.floor(available)}px`;
    if (controls.style.getPropertyValue('--browse-panel-height') !== value) controls.style.setProperty('--browse-panel-height', value);
  }
  function schedule() {
    if (!frame) frame = win.requestAnimationFrame(() => { frame = 0; sync(); });
  }
  function setOpen(open, restoreFocus = false) {
    // Restore focus before hiding the currently focused field.
    if (!open && (restoreFocus || panel.contains(doc.activeElement))) toggle.focus({preventScroll:true});
    panel.hidden = !open; panel.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    sync();
    // Existing presenters own reader geometry. The layout's right rectangle
    // never moves, so their original resize pass is sufficient here.
    win.dispatchEvent(new Event('resize'));
  }
  panel.inert = true;
  const click = () => setOpen(panel.hidden);
  const keydown = event => {
    if (event.defaultPrevented || event.key !== 'Escape' || panel.hidden || !visible(page)) return;
    if (!controls.contains(event.target)) return;
    if ([...doc.querySelectorAll('.drawer.open, .modal.open, .modalBackdrop.show, .overlay.open')].some(visible)) return;
    event.preventDefault(); setOpen(false, true);
  };
  toggle.addEventListener('click', click); doc.addEventListener('keydown', keydown, true);
  const resizeObserver = new ResizeObserver(schedule); resizeObserver.observe(layout);
  win.addEventListener('resize', schedule);
  sync();
  return {sync, destroy() {
    destroyed = true; win.cancelAnimationFrame(frame); resizeObserver.disconnect();
    win.removeEventListener('resize', schedule); toggle.removeEventListener('click', click); doc.removeEventListener('keydown', keydown, true);
    if (controls.contains(doc.activeElement)) doc.querySelector('.navRow .tabOn')?.focus({preventScroll:true});
    headings.forEach(heading => heading.remove()); tools?.classList.remove('studyBrowsePlanTools');
    for (const [disclosure, open] of disclosures) disclosure.open = open;
    if (letters) { letters.before(alphabet); letters.remove(); }
    controls.replaceChildren(...originalChildren); controls.style.removeProperty('--browse-panel-height');
    originalPosition.replaceWith(controls);
  }};
}
