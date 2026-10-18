// Actual-module geometry and reachability checks; host owns exact storage restoration.
import {state} from '/assets/js/classics/foundation.js';
import {setView,closeDrawer} from '/assets/js/classics/reader-routes.js';
const out=parent.document.querySelector('#result'),lines=[],frame=parent.document.querySelector('iframe');
let failures=0;
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,msg)=>{lines.push((ok?'PASS ':'FAIL ')+msg);if(!ok)failures++};
const rect=n=>n.getBoundingClientRect();
const visible=n=>!!n?.getClientRects().length;
async function bounds(label){
 const mast=$('.masthead'),top=rect(mast).top,wrap=$('.wrap');
 window.scrollTo(10000,10000);document.body.scrollTop=10000;wrap.scrollTop=10000;wrap.scrollLeft=10000;await tick();
 assert(scrollY===0&&scrollX===0&&document.body.scrollTop===0&&wrap.scrollTop===0&&wrap.scrollLeft===0,label+' outer scroll attempts stay at zero');
 assert(Math.abs(rect(mast).top-top)<1,label+' masthead stays stationary');
 assert(document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=innerWidth,label+' document has no horizontal overflow');
 assert(rect($('.view.on')).bottom<=rect($('.siteFooter')).top+1&&rect($('.siteFooter')).bottom<=innerHeight+1,label+' work region and footer fit viewport');
}
function reachable(node,region,label){
 region.scrollTop=region.scrollHeight;
 const a=rect(node),b=rect(region);
 assert(a.bottom<=b.bottom+2&&a.bottom>=b.top,label+' last content reachable in designated scroller '+JSON.stringify({item:a.toJSON(),region:b.toJSON(),scrollTop:region.scrollTop,scrollHeight:region.scrollHeight}));
}
try{
 for(let n=0;!state.flatWorks.length&&n<100;n++)await wait(50);
 assert(state.flatWorks.length===287&&state.libraryWorks.length===243,'original populations loaded');
 // C intentionally scrolls settings inside the list column. At constrained
 // heights the original view remains the bounded fallback work scroller.
 for(const[width,height]of[[390,500],[984,779],[390,844]]){
 frame.style.width=width+'px';frame.style.height=height+'px';await tick();await tick();setView('plan');await tick();await tick();
 const view=$('#planView'),group=view.querySelector('.studyBrowseControls'),layout=view.querySelector('.studyDetailLayout'),index=layout.querySelector('.detailIndex'),toggle=group.querySelector('.studyBrowseToggle'),panel=group.querySelector('.studyBrowsePanel');
 if(panel.hidden)toggle.click();await tick();await tick();
 const about=panel.querySelector('details:has(.planRefRow)');about.open=true;await tick();await tick();
 view.scrollTop=view.scrollHeight;await tick();await tick();index.scrollTop=index.scrollHeight;await tick();
 const last=index.querySelector('.detailIndexGroup:last-child .detailIndexItem:last-child');
 assert(rect(index).height>=48&&rect(panel).height>0,width+'x'+height+' expanded settings retain independent usable list and settings areas');
 reachable(last,index,width+'x'+height+' expanded settings');
 assert(document.elementFromPoint(rect(last).left+20,Math.min(rect(last).bottom,rect(index).bottom)-8)?.closest('.detailIndexItem')===last,width+'x'+height+' expanded last reading receives pointer hits');
 last.click();await tick();const owner=$('#planGrid .detailOwner'),before=rect(owner).toJSON();
 assert(!!owner&&rect(owner).height>=100&&rect(owner).top>=0&&rect(owner).bottom<=innerHeight+1,width+'x'+height+' selected complete body remains bounded and usable');
 owner.scrollTop=owner.scrollHeight;await tick();assert(owner.scrollHeight<=owner.clientHeight||owner.scrollTop>0,width+'x'+height+' selected body long content scrolls internally');
 owner.querySelector('.detailClose').click();await tick();assert(document.activeElement===last&&!$('#planGrid .detailOwner'),width+'x'+height+' Back restores original list proxy');
 const final=panel.querySelector('.planRefRow a:last-child');final.focus();final.scrollIntoView({block:'nearest'});await tick();
 assert(rect(final).top>=rect(panel).top-1&&rect(final).bottom<=rect(panel).bottom+1,width+'x'+height+' last original reference reachable inside settings scrollbar');
 toggle.click();await tick();await tick();assert(panel.hidden&&rect(index).height>=112,width+'x'+height+' closing settings restores full list area');
 about.open=false;view.scrollTop=0;
 assert(document.scrollingElement.scrollTop===0&&document.body.scrollTop===0&&rect($('.masthead')).top===0,width+'x'+height+' outer document and masthead stay fixed');
 }
 for(const [width,height]of [[1440,900],[390,844],[900,650],[780,500]].filter(size=>!parent.location.search.includes('short')||size[0]===780)){
 frame.style.width=width+'px';frame.style.height=height+'px';await tick();await tick();
 const size=width+'x'+height;
 setView('home');await tick();await bounds(size+' Home');
 const home=$('#homeView');home.scrollTop=100000;assert(home.scrollTop>0,size+' Home long content scrolls internally');reachable(home.lastElementChild,home,size+' Home');home.scrollTop=0;
 for(const [page,gridId,q]of [['library','libraryGrid','libQ'],['authors','authorsGrid','authorsQ']]){
 setView(page);await tick();await tick();await bounds(size+' '+page);
 const view=$('.view.on'),layout=$('#'+gridId).parentElement,index=layout.querySelector('.detailIndex');
 assert(rect(index).height>=(height<=500?64:width<=760?160:120)&&rect(index).bottom<=rect(view).bottom+1,size+' '+page+' index uses visible work bounds '+JSON.stringify({index:rect(index).toJSON(),layout:rect(layout).toJSON(),view:rect(view).toJSON(),controls:rect(view.querySelector('.studyBrowseControls')).toJSON(),pagination:rect(view.querySelector('.paginationBar')).toJSON()}));
 index.scrollTop=0;
 const first=index.querySelector('.detailIndexItem'),hit=rect(first),clip=rect(index);
 assert(document.elementFromPoint(hit.left+20,Math.min(hit.bottom,clip.bottom)-8)?.closest('.detailIndexItem')===first,size+' '+page+' visible proxy receives actual pointer hits');
 const last=index.querySelector('.detailIndexGroup:last-child .detailIndexItem:last-child');last.focus();reachable(last,index,size+' '+page);await tick();await bounds(size+' '+page+' focus');
 last.click();await tick();const owner=$('#'+gridId+' .detailOwner');
 assert(!!owner&&owner.parentElement===$('#'+gridId),size+' '+page+' selected original owner retained');
 assert(rect(owner).bottom<= (width<=760?innerHeight:rect(view).bottom)+1,size+' '+page+' selected body bounded');
 owner.scrollTop=100000;assert(owner.scrollHeight<=owner.clientHeight||owner.scrollTop>0,size+' '+page+' complete body scroll reachable');
 $('#openNotesBtn').click();await tick();const notes=$('#notesDrawer');assert(notes.classList.contains('open')&&Number(getComputedStyle(notes).zIndex)>Number(getComputedStyle(owner).zIndex),size+' '+page+' Notes keeps priority');closeDrawer();await tick();owner.querySelector('.detailClose').click();await tick();assert(document.activeElement===last,size+' '+page+' Back focus retained');
 const input=$('#'+q);input.value='zzzz-no-fixture-match';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(300);await tick();assert($('#'+gridId).textContent.includes('No matches')&&!visible(layout.querySelector('.detailIndex')),size+' '+page+' empty state accessible');
 input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(300);await tick();assert(layout.querySelectorAll('.detailIndexItem').length>0,size+' '+page+' ordered index recovers');
 const toggle=view.querySelector('.studyBrowseToggle');if(toggle.getAttribute('aria-expanded')!=='true')toggle.click();
 const disclosure=view.querySelector('details');disclosure.open=true;await tick();await tick();
 const expandedControl=[...disclosure.querySelectorAll('button,input,select,a[href]')].filter(node=>!node.disabled&&visible(node)).at(-1);expandedControl.focus();expandedControl.scrollIntoView({block:'nearest',inline:'nearest'});await tick();
 const controlBounds=rect(expandedControl),groupBounds=rect(disclosure.closest('.studyBrowsePanel'));
 assert(document.activeElement===expandedControl&&controlBounds.top>=groupBounds.top-1&&controlBounds.bottom<=groupBounds.bottom+1,size+' '+page+' expanded final control focus reachable');await bounds(size+' '+page+' expanded');disclosure.open=false;toggle.click();
 }
 setView('plan');await tick();await tick();await bounds(size+' Bookclub');
 const planIndex=$('#planView .detailIndex');assert(rect(planIndex).height>20&&rect(planIndex).bottom<=rect($('#planView')).bottom+1,size+' Bookclub index bounded');
 planIndex.scrollTop=0;
 const firstPlan=planIndex.querySelector('.detailIndexItem'),planHit=rect(firstPlan);assert(document.elementFromPoint(planHit.left+20,Math.min(planHit.bottom,rect(planIndex).bottom)-8)?.closest('.detailIndexItem')===firstPlan,size+' Bookclub visible proxy receives actual pointer hits');
 const planLast=planIndex.querySelector('.detailIndexGroup:last-child .detailIndexItem:last-child');planLast.focus();reachable(planLast,planIndex,size+' Bookclub');planLast.click();await tick();assert(!!$('#planGrid .detailOwner')?.closest('.readingBlock'),size+' Bookclub readingBlock ancestry retained');$('#planGrid .detailClose').click();await tick();
 $('#planViewModeBtn').click();await tick();await bounds(size+' Bookclub table');assert(!!$('#planGrid table'),size+' original table retained');$('#planViewModeBtn').click();await tick();
 $('#tabGlossary').click();for(let n=0;!$('#glossaryIndex [data-term-id]')&&n<100;n++)await wait(50);await tick();await tick();await bounds(size+' Glossary');
 const gi=$('#glossaryIndex');assert(rect(gi).height>20&&rect(gi).bottom<=rect($('#glossaryView')).bottom+1,size+' Glossary index bounded');gi.scrollTop=0;const term=gi.querySelector('[data-term-id]'),termHit=rect(term);assert(document.elementFromPoint(termHit.left+20,Math.min(termHit.bottom,rect(gi).bottom)-8)?.closest('[data-term-id]')===term,size+' Glossary visible term receives actual pointer hits');term.click();await tick();
 for(const label of ['References','Idea Map','Dictionary','Wikipedia Summary','Related Library']){assert($('#glossaryModalBody .glossaryPagerLabel')?.textContent===label,size+' original Glossary '+label+' reachable');$('#glossaryNextBtn').click();await tick()}
 assert(rect($('#glossaryModal')).bottom<=(width<=760?innerHeight:rect($('#glossaryView')).bottom)+1,size+' Glossary body bounded');$('#glossaryCloseBtn').click();await tick();
 const help=$('.studyHelp');help.open=true;await tick();$('#tabGetStarted').click();await tick();await bounds(size+' GetStarted');const started=$('.view.on');started.scrollTop=100000;assert(started.scrollTop>0,size+' GetStarted internally scrolls');
 for(const disclosure of all('.studyHelp,.studyAccount,.siteFooter details'))disclosure.open=true;await tick();await bounds(size+' help account footer');
 for(const selector of ['.studyHelp','.studyAccount']){const menu=$(selector),last=menu.querySelector('button:last-child');last.focus();last.scrollIntoView({block:'nearest'});await tick();assert(rect(last).top>=0&&rect(last).bottom<=innerHeight,size+' '+selector+' final control focus reachable');}
 const footer=$('.siteFooter');footer.scrollTop=footer.scrollHeight;assert(rect(footer.lastElementChild).bottom<=rect(footer).bottom+1,size+' expanded footer final content reachable');
 for(const disclosure of all('.studyHelp,.studyAccount,.siteFooter details'))disclosure.open=false;
 // Remove only the appended workspace block while retaining incumbent A styles.
 setView('desk');await tick();await tick();const sheet=[...document.styleSheets].find(s=>s.href&&new URL(s.href).pathname.endsWith('/study-workspace.css'));
 const geometry=()=>JSON.stringify([document.body.scrollHeight,document.body.scrollWidth,getComputedStyle(document.body).overflow,$('.wrap').getBoundingClientRect().toJSON(),getComputedStyle($('.wrap')).display,getComputedStyle($('.wrap')).padding]);
 const before=geometry();const incumbent=document.createElement('style');incumbent.textContent=(await (await fetch(sheet.href)).text()).split('/* Contained workspace.')[0];document.head.append(incumbent);sheet.disabled=true;await tick();const base=geometry();sheet.disabled=false;incumbent.remove();await tick();assert(before===base&&before===geometry(),size+' Desk wrapper/body equal original enhancement-disabled state '+before);
 setView('home');await tick();await bounds(size+' return from Desk');
 }
 out.dataset.result=failures?'fail':'pass';out.textContent=lines.join('\n')+'\n'+(failures?'FAIL '+failures:'ALL '+lines.filter(line=>line.startsWith('PASS ')).length+' CHECKS PASSED');
}catch(e){out.dataset.result='fail';out.textContent=lines.join('\n')+'\nFAIL '+e.stack}
finally{parent.finishFixture()}
