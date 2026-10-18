import {connectBrowseControls} from './browse-controls.js?v=5629049023c12db3';

/* Presentation for the original shell and lazily mounted Glossary controller. */
function initStudyShell(){
  const nav = document.querySelector('.subhead > .navRow');
  const help = document.createElement('details');
  help.className = 'studyDisclosure studyHelp';
  help.innerHTML = '<summary>Help</summary>';
  nav?.append(help);
  const phone = matchMedia('(max-width: 760px)');
  let view, index, modal, slot, back, geometry, frame = 0;
  const browseControls = new Map();
  let selectedTermId = '', wasOpen = false, overlayWasOpen = false, savedOverflow;
  const visible = node => !!node?.getClientRects().length;
  const otherOverlayOpen = () => [...document.querySelectorAll('.drawer.open, .modal.open, .modalBackdrop.show, .overlay.open')].some(visible);
  const focusNavigation = () => document.querySelector('.subhead .tabOn')?.focus({preventScroll:true});
  const focusTerm = () => {
    const term = [...(index?.querySelectorAll('[data-term-id]') || [])].find(node => node.dataset.termId === selectedTermId);
    if (visible(term)) term.focus({preventScroll:true}); else focusNavigation();
  };
  function lockScroll(lock){
    if (lock && savedOverflow === undefined) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else if (!lock && savedOverflow !== undefined) {
      document.body.style.overflow = savedOverflow;
      savedOverflow = undefined;
    }
  }
  function schedule(){
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; sync(); });
  }
  function mount(){
    const getStarted = document.getElementById('tabGetStarted');
    if (getStarted && !help.contains(getStarted)) help.append(getStarted);
    if (modal) return;
    view = document.getElementById('glossaryView');
    if (view) resizeObserver.observe(view);
    index = document.getElementById('glossaryIndex');
    modal = document.getElementById('glossaryModal');
    if (!view || !index || !modal) { modal = null; return; }
    const letters = view.querySelector('.glossaryLetters');
    const filters = document.createElement('details');
    filters.className = 'studyDisclosure studyGlossaryLetters';
    filters.innerHTML = '<summary>Letters</summary>';
    letters.before(filters);filters.append(letters);
    slot = document.createElement('aside');
    slot.className = 'studyGlossarySlot';
    slot.textContent = 'Select a term to explore its references and ideas.';
    index.after(slot);
    geometry = document.createElement('style');
    document.head.append(geometry);
    back = document.createElement('button');
    back.type = 'button';back.className = 'studyGlossaryBack';back.textContent = 'Back';
    back.addEventListener('click', () => document.getElementById('glossaryCloseBtn').click());
    modal.querySelector('.glossaryModalHeader').prepend(back);
    modal.classList.add('studyGlossaryModal');
    index.addEventListener('click', event => {
      const term = event.target.closest('[data-term-id]');
      if (term) selectedTermId = term.dataset.termId;
    }, true);
  }
  function sync(){
    for (const [page, mounted] of browseControls) {
      if (!page.isConnected || !page.contains(mounted.layout) || !mounted.layout.contains(mounted.controls)) {
        mounted.presentation.destroy(); browseControls.delete(page);
      }
    }
    // Keep original controls together so expanded tools consume a bounded part
    // of the work region; their IDs, handlers and view ancestry stay intact.
    for (const page of document.querySelectorAll('.view:not(#deskView)')) {
      const layout = page.querySelector(':scope > .studyDetailLayout, :scope > .glossaryLayout');
      // A relocated controls group still belongs to this view; never wrap it
      // again or consume the layout's geometry/index/root siblings.
      if (!layout || page.querySelector('.studyBrowseControls')) continue;
      const controls = document.createElement('div');
      controls.className = 'studyBrowseControls';
      while (page.firstElementChild !== layout) controls.append(page.firstElementChild);
      layout.before(controls);
    }
    for (const page of document.querySelectorAll('#planView, #libraryView, #authorsView')) {
      const layout = page.querySelector(':scope > .studyDetailLayout');
      const controls = page.querySelector('.studyBrowseControls');
      if (!layout || !controls) continue;
      if (!browseControls.has(page)) browseControls.set(page, {layout, controls, presentation:connectBrowseControls({page, layout, controls})});
      browseControls.get(page).presentation.sync();
    }
    mount();
    if (!modal) return;
    const shown = visible(view);
    if (!shown && modal.classList.contains('open')) document.getElementById('glossaryCloseBtn').click();
    const open = shown && modal.classList.contains('open');
    const overlay = otherOverlayOpen();
    const becamePhone = phone.matches && modal.getAttribute('role') !== 'dialog';
    const becameDesktop = !phone.matches && modal.getAttribute('role') === 'dialog';
    const overlayClosed = overlayWasOpen && !overlay;
    overlayWasOpen = overlay;
    modal.setAttribute('role', phone.matches ? 'dialog' : 'region');
    modal.setAttribute('aria-modal', String(open && phone.matches && !overlay));
    slot.setAttribute('aria-hidden', String(open));
    slot.classList.toggle('studyGlossarySlotSelected', open);
    if (shown) {
      const rect = slot.getBoundingClientRect(), listRect = index.getBoundingClientRect();
      const work = view.getBoundingClientRect();
      const layout = index.parentElement.getBoundingClientRect();
      const bottom = Math.min(work.bottom, layout.bottom, innerHeight);
      const top = Math.max(work.top, layout.top);
      const height = Math.max(0, bottom - top);
      const indexTop = Math.max(work.top, listRect.top);
      const rule = `#glossaryIndex{max-height:${Math.round(Math.max(0,bottom-indexTop))}px} .studyGlossaryModal{--glossary-left:${Math.round(rect.left)}px;--glossary-top:${Math.round(top)}px;--glossary-width:${Math.round(rect.width)}px;--glossary-height:${Math.round(height)}px}`;
      if (geometry.textContent !== rule) geometry.textContent = rule;
    }
    lockScroll(open && phone.matches);
    if (open && phone.matches && !overlay && (!wasOpen || becamePhone || overlayClosed)) back.focus({preventScroll:true});
    if (open && becameDesktop && !overlay) document.getElementById('glossaryCloseBtn').focus({preventScroll:true});
    if (!open && wasOpen && !overlay) {
      if (shown) focusTerm(); else focusNavigation();
    }
    wasOpen = open;
  }
  function shieldPanelKey(){
    // Let the original target and overlay handlers run unchanged while the
    // original document-level Glossary listener sees an inactive term. Restore
    // within the same dispatch; the timer covers handlers that stop bubbling.
    modal.classList.remove('open');
    let timer;
    const restore = () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', restore);
      if (visible(view)) modal.classList.add('open');
    };
    document.addEventListener('keydown', restore, {once:true});
    timer = setTimeout(restore, 0);
  }
  document.addEventListener('keydown', event => {
    if (!modal?.classList.contains('open')) return;
    const panelKey = ['Escape', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    // The original controller owns panel keys. Editable caret keys and higher
    // original overlays must never reach that document-level controller.
    if (panelKey && (otherOverlayOpen() || (event.key !== 'Escape' && event.target.closest('input, textarea, select, [contenteditable="true"]')))) {
      shieldPanelKey();return;
    }
    if (event.key !== 'Tab' || !phone.matches || otherOverlayOpen()) return;
    const controls = [...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(node => !node.disabled && node.tabIndex >= 0 && visible(node));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) { event.preventDefault();last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { event.preventDefault();first?.focus(); }
  }, true);
  document.addEventListener('focusin', event => {
    if (wasOpen && phone.matches && !otherOverlayOpen() && !modal.contains(event.target)) back.focus({preventScroll:true});
  });
  document.addEventListener('toggle', event => {
    // A disclosure can move a fixed reading pane without resizing its slot.
    if (event.target.matches('.studyDisclosure')) window.dispatchEvent(new Event('resize'));
    schedule();
  }, true);
  const resizeObserver = new ResizeObserver(schedule);
  document.querySelectorAll('.wrap, .view, .siteFooter').forEach(node => resizeObserver.observe(node));
  window.addEventListener('resize', schedule);
  window.addEventListener('scroll', schedule, true);
  phone.addEventListener('change', schedule);
  // Watch original late mounts, replacements, open/close, and view changes.
  // Ignore our own generated attributes and style text to avoid observer loops.
  new MutationObserver(records => {
    if (records.some(record => record.type === 'attributes'
      ? record.target.matches('.view, .glossaryModal, .drawer, .modal, .overlay, .modalBackdrop') && /(?:^|\s)(on|open|show)(?:\s|$)/.test(record.oldValue || '') !== /(?:^|\s)(on|open|show)(?:\s|$)/.test(record.target.className)
      : record.target !== geometry && !geometry?.contains(record.target) && (record.target === document.body || record.target.matches?.('.wrap') || record.target === nav || record.target.closest?.('#glossaryView, #glossaryModal, #planView, #libraryView, #authorsView')))) schedule();
  }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
  sync();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStudyShell, {once:true});
else initStudyShell();
