// Run identical original actions against the baseline and rebuilt app. Only localhost fixtures may write.
if (!['localhost','127.0.0.1'].includes(location.hostname)) throw Error('Local-only fixture');
const moduleAt=name=>import(new URL('./assets/js/classics/'+name+'.js',location.href));
const {state,LS_NOTES,LS_DELETED_NOTES,LS_TIMER_STATE,LS_TIMER_SETTINGS}=await moduleAt('foundation');
const {setView,closeDrawer}=await moduleAt('reader-routes');
const notes=await moduleAt('writing-desks');
const {showEulaModal,hideEulaModal}=await moduleAt('reader-account');
const out=parent.document.querySelector('#result'),lines=[],snapshots=[];
const assert=(ok,msg)=>{if(!ok)throw Error(msg);lines.push('PASS '+msg)};
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const change=(el,value,event='change')=>{el.value=value;el.dispatchEvent(new Event(event,{bubbles:true}))};
const visible=el=>!!el?.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
const capture=label=>snapshots.push({label,notes:localStorage.getItem(LS_NOTES),deleted:localStorage.getItem(LS_DELETED_NOTES)});
const storage=parent.fixtureStorage;
let saved,OriginalDate=window.Date,createURL=URL.createObjectURL,revokeURL=URL.revokeObjectURL,anchorClick=HTMLAnchorElement.prototype.click;
try{
 for(let n=0;!state.flatWorks.length&&n<100;n++)await wait(50);
 assert(state.flatWorks.length===287&&state.libraryWorks.length===243,'original plan and library populations loaded');
 saved={notes:state.notes,deletedNoteIds:state.deletedNoteIds,notesUI:{...state.notesUI},filters:{...state.filters},view:state.view,dark:document.documentElement.classList.contains('dark')};
 // Current presentation acceptance supplements the identical original-action digest below.
 if(location.pathname==='/'){
  const checks=[],check=(ok,label)=>checks.push([ok,label]);
  const rect=el=>el.getBoundingClientRect();
  const notesButton=$('#openNotesBtn');
  check(Math.abs(rect(notesButton).width-rect(notesButton).height)<=1&&notesButton.textContent.trim()==='Notes Drawer','A Notes control is square and retains original accessible text');
  for(const page of ['library','authors']){
   setView(page);await tick();
   const index=$('.view.on .detailIndex'),proxy=index.querySelector('.detailIndexItem'),title=proxy.querySelector('.detailIndexTitle');
   check(rect(index).width>=180&&rect(index).width<=260,'A '+page+' desktop index stays compact');
   check(parseFloat(getComputedStyle(title).fontSize)<=20&&Number(getComputedStyle(title).fontWeight)>=600,'A '+page+' proxy title uses compact bold type');
   const alphabet=$('.view.on .abcBar'),browse=$('.view.on .studyBrowseToggle'),panel=$('.view.on .studyBrowsePanel'),letters=alphabet.closest('details'),wasOpen=!panel.hidden,lettersOpen=letters.open;
   if(!wasOpen)browse.click();letters.open=true;await tick();await tick();
   const controlsReachable=()=>{
    const buttons=[...alphabet.querySelectorAll('button')];
    return buttons.length>=27&&buttons.every(button=>{button.scrollIntoView({block:'nearest',inline:'nearest'});const box=rect(button),bounds=rect(panel);return visible(button)&&box.top>=bounds.top-1&&box.bottom<=bounds.bottom+1&&box.left>=bounds.left-1&&box.right<=bounds.right+1});
   };
   check(controlsReachable(),'C '+page+' desktop alphabet retains all original buttons reachable in settings');
   parent.document.querySelector('iframe').style.width='390px';await tick();await tick();
   check(controlsReachable()&&alphabet.scrollWidth<=alphabet.clientWidth,'C '+page+' phone alphabet wraps with all original buttons reachable in settings');
   const filter=page==='library'?'libLetterFilter':'authorsLetterFilter',beforeLetter=state.filters[filter],button=[...alphabet.querySelectorAll('button')].find(node=>node.dataset.letter==='P'&&!node.disabled);
   button.click();await tick();check(state.filters[filter]==='P'&&index.querySelectorAll('.detailIndexItem').length>0,'C '+page+' original letter control still filters the original index');
   [...alphabet.querySelectorAll('button')].find(node=>node.dataset.letter===beforeLetter).click();await tick();
   parent.document.querySelector('iframe').style.width='1200px';await tick();await tick();letters.open=lettersOpen;if(!wasOpen)browse.click();await tick();
   if(page==='authors'){index.querySelector('.detailIndexItem').click();await tick();const owner=$('#authorsGrid .detailOwner');check(owner.querySelector('.detailToolbar > span').textContent.trim()===owner.dataset.author,'A author toolbar names selected author once');owner.querySelector('.detailClose').click();await tick()}
  }
  $('#tabGlossary').click();for(let n=0;!$('#glossaryIndex')&&n<100;n++)await wait(50);await tick();
  check(rect($('#glossaryIndex')).width>=180&&rect($('#glossaryIndex')).width<=260,'A Glossary desktop index stays compact');
  setView(saved.view);await tick();
  for(const [ok,label]of checks)lines.push((ok?'PASS ':'FAIL ')+label);
  if(checks.some(([ok])=>!ok))throw Error('Current presentation acceptance: '+checks.filter(([ok])=>!ok).map(([,label])=>label).join('; '));
 }
 assert($('#timerDisplay').textContent.trim()==='01:30'&&$('#timerStartBtn').textContent.trim()==='Resume','app load restores saved paused time and Resume control');
 assert($('#timerVolumeSlider').value==='25'&&$('#timerAlarmSelect').value==='bell','app load restores timer settings');
 $('#timerStartBtn').click();assert(JSON.parse(localStorage.getItem(LS_TIMER_STATE)).running,'restored Resume starts original timer');$('#timerStartBtn').click();
 window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-10-17T12:00:00.000Z']))}static now(){return 1792238400000}};
 const seed=(id)=>({id,title:'Fixture '+id,book_tag:'Apology',year:1,author:'Plato',selection:'Whole work',body:'A long fixture. '.repeat(30),note_type:['note','quote'],created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z'});
 state.notes=[seed('task5-a'),seed('task5-b')];state.deletedNoteIds=new Set();
 Object.assign(state.notesUI,{tag:'all',search:'',showArchived:false,noteTypeFilter:[],bookclubFilter:false,selectMode:false,selectedIds:new Set()});
 localStorage.setItem(LS_NOTES,JSON.stringify(state.notes));localStorage.setItem(LS_DELETED_NOTES,'[]');
 $('#openNotesBtn').click();await tick();notes.startEditNote('task5-a');
 $('#editTitle').value='Edited Apology';$('#editBody').value='Edited original body\nSecond line';$('#saveNoteBtn').click();await tick();
 assert(state.notes[0].id==='task5-a'&&state.notes[0].body==='Edited original body\nSecond line','existing note edit keeps id and exact body');capture('edit');
 notes.startEditNote('task5-a');$('#archiveNoteBtn').click();await tick();
 assert(state.notes.find(n=>n.id==='task5-a').archived&&!notes.filteredNotes().some(n=>n.id==='task5-a'),'archive hides note from active list');capture('archive');
 $('#toggleArchivedBtn').click();await tick();assert(notes.filteredNotes().length===1,'archived filter finds archived note');
 notes.startEditNote('task5-a');$('#archiveNoteBtn').click();await tick();$('#toggleArchivedBtn').click();
 assert(notes.filteredNotes().length===2,'unarchive restores original active records');capture('unarchive');
 $('#toggleNoteSelectBtn').click();$('#selectAllNotesBtn').click();$('#archiveSelectedNotesBtn').click();await tick();
 assert(state.notes.every(n=>n.archived)&&state.notesUI.selectedIds.size===0,'bulk archive clears selection and keeps both records');capture('bulk archive');
 $('#toggleArchivedBtn').click();$('#toggleNoteSelectBtn').click();$('#selectAllNotesBtn').click();$('#archiveSelectedNotesBtn').click();await tick();$('#toggleArchivedBtn').click();capture('bulk unarchive');
 notes.startEditNote('task5-a');$('#deleteNoteBtn').click();await tick();$('#confirmModalCancelBtn').click();await tick();
 assert(state.notes.length===2&&state.deletedNoteIds.size===0,'cancelled deletion changes no notes or tombstones');
 $('#deleteNoteBtn').click();await tick();$('#confirmModalOkBtn').click();await tick();
 assert(!state.notes.some(n=>n.id==='task5-a')&&state.deletedNoteIds.has('task5-a'),'confirmed single deletion stores original tombstone');capture('delete');
 $('#toggleNoteSelectBtn').click();$('#selectAllNotesBtn').click();$('#deleteSelectedNotesBtn').click();await tick();$('#confirmModalOkBtn').click();await tick();
 assert(state.notes.length===0&&state.deletedNoteIds.has('task5-b'),'bulk deletion stores all original tombstones');capture('bulk delete');
 const imported=[{...seed('task5-c'),note_type:'quote'},{...seed('task5-d'),note_type:['reflection','invalid']}];
 await notes.importNotesFile({target:{files:[new File([JSON.stringify({notes:imported})],'fixture.json',{type:'application/json'})]}});await tick();$('#alertModalOkBtn').click();await tick();
 assert(state.notes.length===2&&state.notes.find(n=>n.id==='task5-c').note_type[0]==='quote'&&state.notes.find(n=>n.id==='task5-d').note_type.join()==='reflection','JSON import preserves IDs and normalizes legacy and invalid types');capture('import object');
 await notes.importNotesFile({target:{files:[new File([JSON.stringify([{...seed('task5-c'),body:'Updated import'}])],'fixture.json')]}});await tick();$('#alertModalOkBtn').click();await tick();
 assert(state.notes.length===2&&state.notes.find(n=>n.id==='task5-c').body==='Updated import','array import merges existing ID without duplication');capture('import array');
 await notes.importNotesFile({target:{files:[new File(['{bad'],'bad.json')]}});await tick();
 assert($('#alertModal').textContent.includes('Import failed')&&state.notes.length===2,'malformed import reports error without replacing records');$('#alertModalOkBtn').click();await tick();
 const blobs=[];URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:fixture'};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=function(){if(!this.download)return anchorClick.call(this)};
 $('#exportNotesBtn').click();assert(blobs.length===1,'original export control creates JSON');
 const exported=JSON.parse(await blobs[0].text());assert(JSON.stringify(exported.notes)===JSON.stringify(state.notes),'note export retains complete original records');snapshots.push({label:'export',payload:exported});
 closeDrawer();
 $('#timerBtn').click();await tick();
 for(const preset of all('[data-timerpreset]')){preset.click();assert(JSON.parse(localStorage.getItem(LS_TIMER_STATE)).remaining===Number(preset.dataset.timerpreset),'timer preset '+preset.dataset.timerpreset+' saves original seconds')}
 change($('#timerCustomMins'),'2');change($('#timerCustomSecs'),'0');$('#timerSetCustomBtn').click();
 $('#timerStartBtn').click();assert(JSON.parse(localStorage.getItem(LS_TIMER_STATE)).running,'timer start persists running state');$('#timerStartBtn').click();
 assert(!JSON.parse(localStorage.getItem(LS_TIMER_STATE)).running,'timer pause persists stopped state');
 change($('#timerAlarmSelect'),'bell');change($('#timerVolumeSlider'),'25','input');change($('#timerVolumeSlider'),'25');
 const settings=JSON.parse(localStorage.getItem(LS_TIMER_SETTINGS));assert(settings.volume===25&&$('#timerVolumeLabel').textContent==='25%','timer settings save with visible volume');
 snapshots.push({label:'timer',state:JSON.parse(localStorage.getItem(LS_TIMER_STATE)),settings});
 $('#closeTimerModalBtn').click();
 // All original page routes, panels and entry controls at desktop and phone widths.
 for(const width of [1200,390]){
  parent.document.querySelector('iframe').style.width=width+'px';await tick();
  for(const [button,view]of [['tabLibrary','libraryView'],['tabPlan','planView'],['tabAuthors','authorsView'],['tabGlossary','glossaryView'],['tabGetStarted','getStartedView']]){
   $('#'+button).click();await tick();assert(visible($('#'+view))&&$('#'+view).classList.contains('on'),width+' route '+view+' opens original page');
  }
  $('#tabGlossary').click();
  for(let n=0;!$('.glossaryTermBtn')&&n<100;n++)await wait(50);
  change($('#glossaryQ'),'zzzz-no-term','input');await tick();assert($('#glossaryIndex').textContent.includes('No glossary terms match'),width+' glossary empty search');
  change($('#glossaryQ'),'Justice','input');await tick();
  const justice=all('.glossaryTermBtn').find(b=>b.textContent.trim()==='Justice');assert(!!justice,width+' glossary finds Justice');justice.click();await tick();
  const texts=[];
  for(const [i,label]of ['References','Idea Map','Dictionary','Wikipedia','Related Library'].entries()){
   const body=$('#glossaryModalBody').textContent;assert(visible($('#glossaryModalBody'))&&$('#glossaryModalSub').textContent.includes(label),width+' glossary panel '+label+' visible');texts.push(body.replace(/\s+/g,' ').trim());
   if(i<4){$('#glossaryNextBtn').click();await tick()}
  }
  assert(texts[2].includes('Local mode:')&&texts[3].includes('Local mode:'),width+' glossary retains remote-service fallbacks');
  assert(texts[4].includes('Republic')&&texts[4].includes('The Wealth of Nations'),width+' related library retains original matching works');
  if(width===1200)snapshots.push({label:'glossary',texts});
  $('#glossaryPrevBtn').click();await tick();assert($('#glossaryModalSub').textContent.includes('Wikipedia'),width+' glossary previous returns one panel');$('#glossaryCloseBtn').click();
  $('#tabGetStarted').click();await tick();assert($('#getStartedView').textContent.includes('Twenty-Five-Century'),width+' complete introduction remains reachable');
  if(width===1200){
   const introduction=$('#getStartedView'),edition=introduction.querySelector('.gsEditionLine');
   const actualDay=new OriginalDate().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).toUpperCase();
   assert(!!edition&&edition.textContent.split(actualDay).length===2,'original introduction boot date displays the actual current day');
   // The original SHA was captured on October 17. Normalize only that one
   // boot-rendered date in a detached capture; keep production DOM and all
   // other original text, links, records and the expected SHA unchanged.
   const captured=introduction.cloneNode(true),capturedEdition=captured.querySelector('.gsEditionLine');
   capturedEdition.textContent=capturedEdition.textContent.replace(actualDay,'SATURDAY, OCTOBER 17, 2026');
   snapshots.push({label:'introduction',text:captured.textContent.replace(/\s+/g,' ').trim(),links:[...introduction.querySelectorAll('a')].map(a=>a.getAttribute('href'))});
  }
  $('#authBtn').click();await tick();assert(visible($('#loginEmail'))&&visible($('#loginGoogleBtn'))&&visible($('#loginSubmitBtn')),width+' sign-in fields and providers reachable');
  $('#showSignupBtn').click();await tick();assert(visible($('#signupName'))&&visible($('#signupPasswordConfirm')),width+' signup fields reachable');$('#closeSignupModalBtn').click();
  showEulaModal();await tick();assert(visible($('#eulaText'))&&!$('#eulaAcceptCheck').checked&&$('#eulaAcceptBtn').disabled,width+' legal text and unaccepted agreement controls reachable');hideEulaModal();
  $('#donateBtn').click();await tick();assert(visible($('#donationCheckoutBtn'))&&all('[data-donation-amount]').map(b=>b.dataset.donationAmount).join(',')==='5,10,15,20,25,50,100'&&visible($('#donationCustomAmount')),width+' original donation amounts and checkout entry reachable');$('#donationCancelBtn').click();
  assert(visible($('#resetProfileBtn'))&&visible($('#syncStatus'))&&!!$('#manualSyncBtn')&&!!$('#profileSaveBtn'),width+' account reset and sync indicators retained');
  document.documentElement.classList.add('dark');await tick();assert(getComputedStyle(document.body).color!=='rgb(0, 0, 0)',width+' dark mode applies existing theme');document.documentElement.classList.remove('dark');
 }
 const newKeys=Object.keys(localStorage).filter(k=>!(k in storage));
 assert(newKeys.every(k=>[LS_NOTES,LS_DELETED_NOTES,LS_TIMER_SETTINGS,LS_TIMER_STATE].includes(k)),'only original notes tombstone and timer storage keys added');
 const text=JSON.stringify(snapshots),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');
 lines.push('BASELINE notes/timer/content SHA256 '+hash);
 if(parent.location.search.includes('diagnostic'))for(const snapshot of snapshots){const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(snapshot))))].map(b=>b.toString(16).padStart(2,'0')).join('');lines.push('SNAPSHOT '+snapshot.label+' SHA256 '+digest);lines.push('SNAPSHOT DATA '+snapshot.label+' '+JSON.stringify(snapshot));}
 assert(hash==='c4371c49d861d389b5c050f3fdff8e213376a22f09eb223f7ae281fff5cc28ed','notes archives imports exports tombstones timer and original page content match baseline exactly');
 out.dataset.result='pass';out.textContent=lines.join('\n')+'\nALL '+lines.filter(l=>l.startsWith('PASS')).length+' CHECKS PASSED';
}catch(e){out.dataset.result='fail';out.textContent=lines.join('\n')+'\nFAIL '+e.stack}
finally{
 try{
 window.Date=OriginalDate;URL.createObjectURL=createURL;URL.revokeObjectURL=revokeURL;HTMLAnchorElement.prototype.click=anchorClick;
 if(saved){closeDrawer();Object.assign(state,{notes:saved.notes,deletedNoteIds:saved.deletedNoteIds,notesUI:saved.notesUI,filters:saved.filters});document.documentElement.classList.toggle('dark',saved.dark);setView(saved.view)}
 }finally{parent.finishFixture();}
}
