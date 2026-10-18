/* Presentation only: original owners, delegation, loaders and saved state stay in place. */
let nextDetailId = 0;
const shelves = new WeakMap();
const phonePresenters = new Set();
let previousBodyOverflow;

export function connectDetailPresentation({ root, slot, ownerSelector, detailSelector, headerSelector, ancestorSelector, contextSelector }) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const phone = win.matchMedia('(max-width: 760px)');
  const headers = new Map();
  let indexedOwners = [], indexedGroups = [];
  // Proxies contain plain text only. Interactive content stays in its original tree.
  const index = doc.createElement('nav');
  index.className = 'detailIndex';
  index.id = `study-index-${++nextDetailId}`;
  const geometry = doc.createElement('style');
  index.setAttribute('aria-label', 'Reading index');
  root.before(geometry, index);
  let active = null, drawer = null, frame = 0, destroyed = false, modal = false, lastFocused = null, overlayWasOpen = false;
  const toolbar = doc.createElement('div');
  toolbar.className = 'detailToolbar';
  const title = doc.createElement('span');
  const context = doc.createElement('small');
  context.className = 'detailContext';
  const closeButton = doc.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'detailClose';
  closeButton.textContent = 'Back';
  closeButton.setAttribute('aria-label', 'Close details');
  toolbar.append(title, closeButton);
  const savedAttributes = new Map();
  const remember = (node, names) => {
    if (!savedAttributes.has(node)) savedAttributes.set(node, new Map(names.map(name => [name, node.getAttribute(name)])));
  };
  const restore = node => {
    for (const [name, value] of savedAttributes.get(node) || []) {
      if (value === null) {
        if (name === 'style') node.style.cssText = '';
        node.removeAttribute(name);
      } else node.setAttribute(name, value);
    }
    savedAttributes.delete(node);
  };
  remember(slot, ['aria-hidden']);
  function lockPhone(lock) {
    if (lock && !phonePresenters.has(root)) {
      if (!phonePresenters.size) previousBodyOverflow = doc.body.style.overflow;
      phonePresenters.add(root);
      doc.body.style.overflow = 'hidden';
    } else if (!lock && phonePresenters.delete(root) && !phonePresenters.size) {
      doc.body.style.overflow = previousBodyOverflow;
    }
  }
  function release() {
    toolbar.remove();
    if (active) { active.classList.remove('detailOwner', 'detailPhone', 'detailPane'); restore(active); }
    geometry.textContent = '';
    if (drawer) {
      drawer.classList.remove('detailPane');
      // Keep the generated control relationship and managed inert state until destroy.
      for (const name of savedAttributes.has(drawer) ? ['role', 'aria-label', 'style'] : []) {
        const value = savedAttributes.get(drawer).get(name);
        if (value == null) drawer.removeAttribute(name); else drawer.setAttribute(name, value);
      }
    }
    active = drawer = null;
    modal = false;
    overlayWasOpen = false;
    lockPhone(false);
  }
  function schedule() {
    if (!frame && !destroyed) frame = win.requestAnimationFrame(() => { frame = 0; sync(); });
  }
  function sync() {
    if (destroyed) return;
    const visible = root.getClientRects().length > 0;
    const owners = [...root.querySelectorAll(ownerSelector)].filter(owner => owner.querySelector(detailSelector) && owner.querySelector(headerSelector));
    // Release before restoring detached headers/details, so no later cleanup can
    // overwrite their original attributes. Identity, not dataset text, owns a proxy.
    if (active && !owners.includes(active)) release();
    for (const [head, info] of headers) {
      if (!owners.includes(info.owner)) {
        restore(head); restore(info.detail); info.proxy.remove(); headers.delete(head);
      }
    }
    let revealProxy = null;
    for (const owner of owners) {
      const head = owner.querySelector(headerSelector), detail = owner.querySelector(detailSelector);
      if (!headers.has(head)) {
        remember(head, ['tabindex', 'role', 'aria-expanded', 'aria-controls']);
        remember(detail, ['id', 'inert', 'role', 'aria-label', 'style']);
        if (!detail.id) detail.id = `study-detail-${++nextDetailId}`;
        head.tabIndex = 0;
        head.setAttribute('role', 'button');
        head.setAttribute('aria-controls', detail.id);
        const proxy = doc.createElement('button');
        proxy.type = 'button';
        proxy.className = 'detailIndexItem';
        const label = doc.createElement('span');
        label.className = 'detailIndexTitle';
        label.textContent = owner.dataset.title || owner.dataset.book || owner.querySelector('.libTitle, .workTitle')?.textContent || head.textContent;
        const author = doc.createElement('small');
        author.textContent = owner.dataset.author || '';
        proxy.append(label);
        if (author.textContent && author.textContent !== label.textContent) proxy.append(author);
        if (owner.dataset.workkey) proxy.dataset.workkey = owner.dataset.workkey;
        proxy.setAttribute('aria-controls', detail.id);
        proxy.addEventListener('click', () => {
          if (!root.contains(owner)) return;
          head.click(); // Original selection, loaders and cleanup remain authoritative.
          sync();
        });
        index.append(proxy);
        headers.set(head, { owner, detail, proxy });
      }
      head.setAttribute('aria-expanded', String(owner.classList.contains('active')));
      detail.inert = !owner.classList.contains('active');
      const proxy = headers.get(head).proxy;
      proxy.setAttribute('aria-expanded', String(owner.classList.contains('active')));
      const reveal = visible && owner.classList.contains('flash') && !proxy.classList.contains('flash');
      proxy.classList.toggle('flash', owner.classList.contains('flash'));
      if (reveal) revealProxy = proxy;
    }
    const groupLabels = owners.map(owner => {
      if (ancestorSelector) return owner.dataset.year ? `Year ${owner.dataset.year}` : '';
      if (owner.dataset.title !== undefined) return owner.dataset.author || '';
      return owner.dataset.author?.charAt(0).toUpperCase() || '';
    });
    if (owners.length !== indexedOwners.length || owners.some((owner, n) => owner !== indexedOwners[n] || groupLabels[n] !== indexedGroups[n])) {
      const fragment = doc.createDocumentFragment();
      const focusedProxy = index.contains(doc.activeElement) ? doc.activeElement : null;
      let group = fragment, previousLabel = null, groupNumber = 0;
      owners.forEach((owner, n) => {
        const label = groupLabels[n];
        if (label !== previousLabel) {
          group = fragment;
          if (label) {
            group = doc.createElement('section');
            group.className = 'detailIndexGroup';
            const heading = doc.createElement('h2');
            heading.className = 'detailIndexHeading';
            heading.id = `${index.id}-group-${++groupNumber}`;
            heading.textContent = label;
            group.setAttribute('aria-labelledby', heading.id);
            group.append(heading);
            fragment.append(group);
          }
          previousLabel = label;
        }
        group.append(headers.get(owner.querySelector(headerSelector)).proxy);
      });
      index.replaceChildren(fragment);
      indexedOwners = owners;
      indexedGroups = groupLabels;
      if (focusedProxy?.isConnected) focusedProxy.focus({preventScroll:true});
    }
    if (revealProxy) revealProxy.scrollIntoView({block:'nearest'});
    const selected = visible ? owners.find(owner => owner.classList.contains('active')) : null;
    const changed = selected !== active;
    const hiddenFocus = !visible && (active?.contains(doc.activeElement) || (doc.activeElement === doc.body && active?.contains(lastFocused)));
    if (changed) {
      release();
      active = selected;
      drawer = active?.querySelector(detailSelector) || null;
      if (active) {
        remember(active, ['role', 'aria-modal', 'aria-label', 'tabindex']);
        // A previous selection's attributes may have been restored on release.
        remember(drawer, ['id', 'inert', 'role', 'aria-label', 'style']);
        active.classList.add('detailOwner');
        drawer.inert = false;
        title.textContent = [...new Set([active.dataset.title || active.querySelector('.libTitle, .workTitle')?.textContent, active.dataset.author].filter(Boolean))].join(' · ');
        if (ancestorSelector && contextSelector) {
          context.textContent = active.closest(ancestorSelector)?.querySelector(contextSelector)?.textContent.replace(/\s+/g, ' ').trim() || '';
          const yearHead = active.closest('.yearCard')?.querySelector('.yearHeader');
          if (yearHead) {
            context.textContent += ' · ' + yearHead.textContent.replace(/\s+/g, ' ').trim();
            const progress = doc.createElement('progress');
            progress.max = 100;
            progress.value = parseFloat(yearHead.querySelector('.bar > span')?.style.width) || 0;
            progress.setAttribute('aria-label', 'Year reading progress');
            context.append(progress);
          }
          if (context.textContent) title.append(context);
        }
      }
    }
    slot.classList.toggle('detailSlotSelected', !!active);
    slot.setAttribute('aria-hidden', String(!!active));
    index.hidden = !visible || !owners.length || root.parentElement.classList.contains('studyDetailLayoutInactive');
    const rect = slot.getBoundingClientRect();
    // The phone slot is hidden. Measure the visible layout, inside its work region.
    const layoutRect = root.parentElement.getBoundingClientRect();
    const viewRect = root.closest('.view')?.getBoundingClientRect();
    const bottom = Math.min(win.innerHeight, viewRect?.bottom ?? win.innerHeight, layoutRect.bottom);
    const top = Math.max(viewRect?.top ?? 0, layoutRect.top);
    const height = Math.max(0, bottom - top);
    const indexHeight = `${Math.round(height)}px`;
    if (index.style.getPropertyValue('--detail-index-height') !== indexHeight) index.style.setProperty('--detail-index-height', indexHeight);
    index.classList.toggle('detailIndexSelected', !!active && !phone.matches);
    if (active && !phone.matches) {
      const listRect = index.getBoundingClientRect();
      for (const [name, value] of Object.entries({left:listRect.left, top, width:listRect.width})) index.style.setProperty(`--detail-index-${name}`, `${Math.round(value)}px`);
    }
    if (!active) {
      if (hiddenFocus && !otherOverlayOpen()) doc.querySelector('.navRow .tabOn')?.focus({preventScroll:true});
      return;
    }
    const overlayOpen = otherOverlayOpen();
    const overlayClosed = overlayWasOpen && !overlayOpen;
    overlayWasOpen = overlayOpen;
    const becamePhone = phone.matches && !modal;
    modal = phone.matches;
    active.classList.toggle('detailPhone', modal);
    active.classList.toggle('detailPane', !modal);
    if (toolbar.parentElement !== active) active.prepend(toolbar);
    if (modal) {
      active.setAttribute('role', 'dialog');
      active.setAttribute('aria-modal', String(!overlayOpen));
      active.setAttribute('aria-label', title.textContent || 'Selected item');
      active.tabIndex = -1;
      geometry.textContent = '';
    } else {
      for (const name of ['aria-modal', 'tabindex']) {
        const value = savedAttributes.get(active).get(name);
        if (value === null) active.removeAttribute(name); else active.setAttribute(name, value);
      }
      active.setAttribute('role', 'region');
      active.setAttribute('aria-label', title.textContent || 'Selected item details');
      // A generated rule supplies geometry without touching original inline styles.
      const declarations = Object.entries({left:rect.left, top, width:rect.width, height}).map(([name, value]) => `--detail-${name}:${Math.round(value)}px`).join(';');
      const rule = `#${index.id} + * {${declarations}}`;
      if (geometry.textContent !== rule) geometry.textContent = rule;
    }
    lockPhone(modal);
    // Original overlays keep focus while open; return it after their controls hide.
    if (modal && !overlayOpen && (becamePhone || changed || (overlayClosed && !active.contains(doc.activeElement)))) closeButton.focus({preventScroll:true});
  }
  function close() {
    const head = active?.querySelector(headerSelector);
    if (!head) return;
    const proxy = headers.get(head)?.proxy;
    head.click(); // Runs the original toggle and book-detail cleanup.
    sync();
    if (proxy?.isConnected && proxy.getClientRects().length) proxy.focus({preventScroll:true});
  }
  function otherOverlayOpen() {
    return [...doc.querySelectorAll('.drawer.open, .modal.open, .modalBackdrop.show, .overlay.open')].some(el => el.getClientRects().length);
  }
  function keydown(event) {
    if (event.defaultPrevented || otherOverlayOpen()) return;
    if (event.key === 'Escape' && active && (root.contains(event.target) || index.contains(event.target))) { event.preventDefault(); close(); return; }
    const head = event.target.closest(headerSelector);
    if (head === event.target && headers.has(head) && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); head.click(); sync(); return;
    }
    if (event.key !== 'Tab' || !modal || !active) return;
    const focusable = [...active.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    const first = focusable[0], last = focusable.at(-1);
    if (!first) { event.preventDefault(); active.focus(); }
    else if (event.shiftKey && (doc.activeElement === first || !active.contains(doc.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (doc.activeElement === last || !active.contains(doc.activeElement))) { event.preventDefault(); first.focus(); }
  }
  function focusin(event) {
    if (event.target !== doc.body) lastFocused = event.target;
    if (modal && active && root.getClientRects().length && !active.contains(event.target) && !otherOverlayOpen()) closeButton.focus({preventScroll:true});
  }
  closeButton.addEventListener('click', close);
  root.addEventListener('click', schedule);
  doc.addEventListener('keydown', keydown);
  doc.addEventListener('focusin', focusin);
  win.addEventListener('resize', schedule);
  win.addEventListener('scroll', schedule, true);
  phone.addEventListener('change', schedule);
  // Observe original selection changes and replacements, not our own classes/styles.
  const observer = new MutationObserver(records => {
    const changed = records.some(record => {
      if (record.type === 'childList') return record.target !== toolbar && !toolbar.contains(record.target);
      if (!record.target.matches(ownerSelector)) return false;
      const wasActive = /(?:^|\s)active(?:\s|$)/.test(record.oldValue || '');
      const wasFlashed = /(?:^|\s)flash(?:\s|$)/.test(record.oldValue || '');
      return wasActive !== record.target.classList.contains('active') || wasFlashed !== record.target.classList.contains('flash');
    });
    if (changed) schedule();
  });
  observer.observe(root, {subtree:true, childList:true, attributes:true, attributeFilter:['class'], attributeOldValue:true});
  const visibilityObserver = new MutationObserver(schedule);
  for (let ancestor = root.parentElement; ancestor && ancestor !== doc.body; ancestor = ancestor.parentElement) visibilityObserver.observe(ancestor, {attributes:true, attributeFilter:['class','style','hidden']});
  // Existing application dialogs outrank the phone presentation, including late mounts.
  const overlayObserver = new MutationObserver(records => {
    const selector = '.drawer, .modal, .modalBackdrop, .overlay';
    const changed = records.some(record => record.type === 'attributes'
      ? record.target.matches(selector)
      : [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 && (node.matches(selector) || node.querySelector(selector))));
    if (changed) schedule();
  });
  overlayObserver.observe(doc.body, {subtree:true, childList:true, attributes:true, attributeFilter:['class','hidden']});
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(slot);
  resizeObserver.observe(root.parentElement);
  if (root.closest('.view')) resizeObserver.observe(root.closest('.view'));
  sync();
  return { sync, close, destroy() {
    destroyed = true;
    win.cancelAnimationFrame(frame);
    observer.disconnect(); visibilityObserver.disconnect(); overlayObserver.disconnect(); resizeObserver.disconnect();
    root.removeEventListener('click', schedule); doc.removeEventListener('keydown', keydown); doc.removeEventListener('focusin', focusin);
    win.removeEventListener('resize', schedule); win.removeEventListener('scroll', schedule, true);
    phone.removeEventListener('change', schedule); closeButton.removeEventListener('click', close);
    release();
    index.remove(); geometry.remove();
    for (const node of [...savedAttributes.keys()]) restore(node);
    slot.classList.remove('detailSlotSelected');
  }};
}

function mountDetailPresentation(root, { enabled = true, emptyLabel, ...selectors }) {
  if (!shelves.has(root)) {
    const layout = root.ownerDocument.createElement('div');
    layout.className = 'studyDetailLayout';
    root.before(layout);
    layout.append(root);
    const slot = root.ownerDocument.createElement('aside');
    slot.className = 'detailSlot';
    slot.textContent = emptyLabel;
    layout.append(slot);
    shelves.set(root, connectDetailPresentation({root,slot,...selectors}));
  }
  root.classList.toggle('studyDetailList', enabled);
  root.parentElement.classList.toggle('studyDetailLayoutInactive', !enabled);
  root.nextElementSibling.hidden = !enabled;
  shelves.get(root).sync();
}

export function presentShelfDetails(root) {
  mountDetailPresentation(root, {enabled:!!root.querySelector('.libDrawer'), emptyLabel:'Choose a book or author to explore its details.', ownerSelector:'.libCard', detailSelector:'.libDrawer', headerSelector:'.libHead'});
}

export function presentPlanDetails(root, enabled) {
  mountDetailPresentation(root, {enabled, emptyLabel:'Choose a reading to explore its details.', ownerSelector:'div.workRow', detailSelector:'.workDrawer', headerSelector:'.workMain', ancestorSelector:'.readingBlock', contextSelector:'.readingHead'});
}
