// Actual app modules: catches moved reading panes, clipped settings, duplicate mounts,
// lost original handlers/owners, hidden focus and table/phone presentation regressions.
import {state} from '/assets/js/classics/foundation.js';
import {setView,closeDrawer} from '/assets/js/classics/reader-routes.js';
const out=parent.document.querySelector('#result'),frame=parent.document.querySelector('iframe'),lines=[];
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const rect=n=>n.getBoundingClientRect(),visible=n=>!!n?.getClientRects().length;
const targeted=parent.location.search.includes('targeted');
let failures=0;
const assert=(ok,msg)=>{lines.push((ok?'PASS ':'FAIL ')+msg);if(!ok)failures++};
const sameRect=(a,b)=>['left','top','width','height'].every(key=>Math.abs(a[key]-b[key])<=1);
async function settle(){await tick();await tick()}
function reach(node,region,label){node.focus();node.scrollIntoView({block:'nearest',inline:'nearest'});const a=rect(node),b=rect(region);assert(a.top>=b.top-1&&a.bottom<=b.bottom+1,label+' control can be reached inside settings')}
try{
 for(let n=0;!state.flatWorks.length&&n<100;n++)await wait(50);
 assert(state.flatWorks.length===287&&state.libraryWorks.length===243,'original populations loaded');
 const originals=new Map(['q','yearPrev','yearNext','showAllYears','greatIdeaSel','sortSel','planViewModeBtn','resetChecksBtn','exportProgressBtn','planColPickerBtn','libQ','libGreatIdeaSel','libAbcBar','authorsQ','authorsResetBtn','authorsAbcBar'].map(id=>[id,$('#'+id)]));
 const options=new Map(['greatIdeaSel','sortSel','libGreatIdeaSel'].map(id=>[id,$('#'+id).innerHTML]));
 for(const[page,gridId]of[['plan','planGrid'],['library','libraryGrid'],['authors','authorsGrid']]){
  setView(page);await settle();const view=$('.view.on'),layout=$('#'+gridId).parentElement,index=layout.querySelector('.detailIndex'),controls=view.querySelector('.studyBrowseControls'),toggle=view.querySelector('.studyBrowseToggle');
  // Also demonstrate the pre-C geometry bug without depending on a new selector.
  if(!toggle)controls.querySelectorAll('details').forEach(n=>n.open=false);await settle();index.querySelector('.detailIndexItem').click();await settle();
  const owner=$('#'+gridId+' .detailOwner'),before=rect(owner),slotBefore=rect(layout.querySelector('.detailSlot'));
  if(toggle)toggle.click();else controls.querySelector('details').open=true;await settle();
  assert(sameRect(before,rect(owner))&&sameRect(slotBefore,rect(layout.querySelector('.detailSlot'))),page+' opening settings preserves exact reading rectangle');
  assert(!!toggle,page+' has Browse & filters toggle');
  if(!toggle)throw Error(page+' missing C settings toggle');
  const panel=view.querySelector('.studyBrowsePanel');
  assert(controls.parentElement===layout&&rect(controls).right<=rect(index).right+1&&rect(controls).left>=rect(index).left-1,page+' settings stay entirely in left list column');
  assert(toggle.getAttribute('aria-expanded')==='true'&&!panel.hidden&&getComputedStyle(panel).overflowY==='auto'&&getComputedStyle(index).overflowY==='auto',page+' settings and list scroll separately');
  assert(rect(index).height>=112,page+' settings retain at least 112px of list');
  owner.scrollTop=80;await settle();assert(toggle.getAttribute('aria-expanded')==='true',page+' reader scrolling leaves settings open');
  index.querySelectorAll('.detailIndexItem')[1].click();await settle();assert(toggle.getAttribute('aria-expanded')==='true',page+' selecting another original owner leaves settings open');
  const input=panel.querySelector('input[type=search]');reach(input,panel,page+' search');input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));await settle();assert(document.activeElement===input&&toggle.getAttribute('aria-expanded')==='true',page+' editable caret arrows keep focus and settings');
  $('#openNotesBtn').click();await settle();const notes=$('#notesDrawer');$('#closeNotesBtn').focus();$('#closeNotesBtn').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await settle();assert(toggle.getAttribute('aria-expanded')==='true',page+' higher priority overlay Escape leaves settings open');closeDrawer();await settle();
  $('#openNotesBtn').click();await settle();input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await settle();assert(!notes.classList.contains('open')&&toggle.getAttribute('aria-expanded')==='true',page+' overlay Escape has priority when focus remains in settings');closeDrawer();await settle();
  input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await settle();assert(panel.hidden&&document.activeElement===toggle,page+' Escape hides settings and restores toggle focus');
  assert(sameRect(before,rect($('#'+gridId+' .detailOwner'))),page+' closing settings preserves reading rectangle');
  $('#'+gridId+' .detailClose').click();await settle();
  toggle.click();await settle();input.value='zzzz-no-fixture-match';input.dispatchEvent(new Event('input',{bubbles:true}));await settle();assert($('#'+gridId).textContent.includes('No matches')&&!visible(index),page+' original empty result remains available');
  input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));await settle();assert(index.querySelectorAll('.detailIndexItem').length>0&&toggle.getAttribute('aria-expanded')==='true',page+' original empty recovery retains open settings');
  if(page==='authors'){input.value='Plato';input.dispatchEvent(new Event('input',{bubbles:true}));$('#authorsResetBtn').click();await settle();assert(input.value===''&&state.filters.authorsQ==='','original authors Reset filters handler works')}
  for(let n=0;n<(targeted?0:3);n++){setView('home');await settle();setView(page);input.dispatchEvent(new Event('input',{bubbles:true}));await settle()}
  assert(view.querySelectorAll('.studyBrowseControls').length===1&&view.querySelectorAll('.studyBrowseToggle').length===1&&index.nextElementSibling===$('#'+gridId),page+' route and rerender keep one mount and index/root adjacency');
  toggle.click();await settle();
 }
 assert(all('.studyBrowseToggle').length===3,'all three inline mounts exist before behavior checks');
 if(all('.studyBrowseToggle').length!==3)throw Error('C inline control mounts missing');
 {
  setView('plan');await settle();let toggle=$('#planView .studyBrowseToggle');toggle.click();await settle();
  const year=state.filters.year;$('#yearNext').click();await settle();assert(state.filters.year!==year,'original next year handler works once');$('#yearPrev').click();await settle();assert(state.filters.year===year,'original previous year handler works once');
  $('#sortSel').value='tracker_complete';$('#sortSel').dispatchEvent(new Event('change',{bubbles:true}));await settle();assert(state.filters.sort==='tracker_complete','original status filter updates original state');$('#resetChecksBtn').click();await settle();assert(state.filters.sort==='sort_check','original Reset Filter & Sorter restores state');
  $('#planViewModeBtn').click();await settle();const table=$('#planGrid table'),layout=$('#planGrid').parentElement;assert(!!table&&layout.classList.contains('studyDetailLayoutInactive')&&rect($('#planGrid')).width>=rect(layout).width-2,'original table mode uses full work width');lines.push('TABLE WIDTH '+JSON.stringify({view:rect($('#planView')).toJSON(),layout:rect(layout).toJSON(),grid:rect($('#planGrid')).toJSON(),tableWrap:rect($('#planGrid .planTableWrap')).toJSON(),display:getComputedStyle(layout).display}));
  reach($('#planColPickerBtn'),$('#planView .studyBrowsePanel'),'table Columns');assert(visible($('#planColPickerBtn')),'original standalone Columns is visibly available in table settings');
  $('#planColPickerBtn').click();await settle();const columns=$('#planColPickerPanel');assert(!columns.hidden&&columns.querySelectorAll('input[type=checkbox]').length>0,'original Columns options are reachable');reach(columns.querySelector('label:last-child'),$('#planView .studyBrowsePanel'),'final Columns option');const box=columns.querySelector('input[type=checkbox]'),checked=box.checked;box.click();await settle();assert(box.checked!==checked,'original column checkbox changes');box.click();$('#planColPickerBtn').click();$('#planViewModeBtn').click();await settle();assert(!$('#planGrid table')&&visible($('#planView .detailIndex')),'original table returns to reading index');
  for(const[page,barId]of[['library','libAbcBar'],['authors','authorsAbcBar']]){setView(page);await settle();const button=$('#'+barId+' .abcBtn[data-letter="P"]');button.click();await settle();assert(button.classList.contains('active')||$('#'+barId+' .abcBtn[data-letter="P"]').classList.contains('active'),page+' original alphabet handler works');$('#'+barId+' .abcBtn[data-letter=""]').click();await settle()}
  for(const[width,height]of(targeted?[]:[[984,779],[390,844],[390,500],[780,500]])){
   frame.style.width=width+'px';frame.style.height=height+'px';setView('plan');await settle();toggle=$('#planView .studyBrowseToggle');if(toggle.getAttribute('aria-expanded')!=='true')toggle.click();await settle();const panel=$('#planView .studyBrowsePanel'),index=$('#planView .detailIndex');
   reach($('#exportProgressBtn'),panel,width+'x'+height+' final tool');await settle();assert(rect(index).height>=48&&rect(panel).height>0,width+'x'+height+' constrained height retains reachable tools and nonzero list');assert(document.documentElement.scrollWidth<=innerWidth&&scrollY===0,width+'x'+height+' no page or horizontal overflow');
   if(width<=760){assert(getComputedStyle($('#q')).fontSize==='16px'&&rect(toggle).height>=44,width+' phone input and touch sizing');const first=index.querySelector('.detailIndexItem');first.click();await settle();const owner=$('#planGrid .detailOwner');assert(owner.classList.contains('detailPhone')&&owner.contains(document.activeElement),width+' phone full body owns focus');owner.querySelector('.detailClose').click();await settle();assert(document.activeElement===first&&toggle.getAttribute('aria-expanded')==='true',width+' phone Back restores index focus and open settings')}
  }
  // Real presentation lifecycle: detaching a layout must release its controls
  // and listeners, then remount the same original nodes exactly once.
  setView('library');await settle();const page=$('#libraryView'),detached=$('#libraryGrid').parentElement,group=page.querySelector('.studyBrowseControls'),placeholder=document.createComment('fixture layout position');
  detached.replaceWith(placeholder);await settle();assert(group.parentElement===page&&!group.querySelector('.studyBrowseToggle'),'detached layout releases inline mount and restores original controls');
  placeholder.replaceWith(detached);await settle();assert(group.parentElement===detached&&page.querySelectorAll('.studyBrowseToggle').length===1&&detached.querySelector('.detailIndex').nextElementSibling===$('#libraryGrid'),'reattached layout mounts original controls exactly once');
  for(const[id,node]of originals)assert($('#'+id)===node,'original interactive '+id+' node retained');
  for(const[id,html]of options)assert($('#'+id).innerHTML===html,'original '+id+' option labels and values retained');
 }
}catch(e){lines.push('ERROR '+e.stack);failures++}
finally{out.dataset.result=failures?'fail':'pass';out.textContent=lines.join('\n')+'\n'+(failures?'FAILED '+failures+' CHECKS':'ALL '+lines.filter(l=>l.startsWith('PASS')).length+' CHECKS PASSED');parent.finishFixture()}
