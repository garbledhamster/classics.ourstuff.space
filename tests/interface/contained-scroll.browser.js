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
 // A short work region must retain a real list below naturally sized controls.
 for(const [width,height,aboutOpen]of [[390,500,false],[984,779,true]]){
 frame.style.width=width+'px';frame.style.height=height+'px';await tick();await tick();setView('plan');await tick();await tick();
 const view=$('#planView'),group=view.querySelector('.studyBrowseControls'),layout=view.querySelector('.studyDetailLayout'),index=layout.querySelector('.detailIndex'),about=group.querySelector('details'),tools=view.querySelector('.planFilterControls').closest('details');
 about.open=aboutOpen;tools.open=true;await tick();await tick();const expandedHeight=group.scrollHeight;
 view.scrollTop=view.scrollHeight;await tick();await tick();index.scrollTop=index.scrollHeight;await tick();
 const last=index.querySelector('.detailIndexGroup:last-child .detailIndexItem:last-child'),indexBox=rect(index),viewBox=rect(view);
 const expanded={layout:rect(layout).height,index:indexBox.height,visibleIndex:Math.min(indexBox.bottom,viewBox.bottom)-Math.max(indexBox.top,viewBox.top),workScrollTop:view.scrollTop,workScrollHeight:view.scrollHeight};
 assert(rect(layout).height>=100&&Math.min(indexBox.bottom,viewBox.bottom)-Math.max(indexBox.top,viewBox.top)>=100,width+'x'+height+' expanded disclosures retain a usable reachable reading region');
 reachable(last,index,width+'x'+height+' expanded disclosures');
 assert(document.elementFromPoint(rect(last).left+20,Math.min(rect(last).bottom,rect(index).bottom)-8)?.closest('.detailIndexItem')===last,width+'x'+height+' last reading receives pointer hits after work-region scrolling');
 last.click();await tick();const owner=$('#planGrid .detailOwner');
 assert(!!owner&&rect(owner).height>=100&&rect(owner).top>=0&&rect(owner).bottom<=innerHeight+1,width+'x'+height+' selected complete body remains bounded and usable');
 owner.scrollTop=owner.scrollHeight;await tick();assert(owner.scrollHeight<=owner.clientHeight||owner.scrollTop>0,width+'x'+height+' selected body long content scrolls internally');
 owner.querySelector('.detailClose').click();await tick();assert(document.activeElement===last&&!$('#planGrid .detailOwner'),width+'x'+height+' Back restores the original list proxy');
 view.scrollTop=0;await tick();assert(rect($('#q')).top>=rect(view).top&&rect($('#q')).bottom<=rect(view).bottom&&group.scrollHeight<=group.clientHeight+1,width+'x'+height+' original controls remain reachable without a toolbar scrollbar');
 assert(document.scrollingElement.scrollTop===0&&document.body.scrollTop===0&&rect($('.masthead')).top===0,width+'x'+height+' outer document and masthead stay fixed');
 about.open=false;tools.open=false;view.scrollTop=0;await tick();await tick();
 assert(group.scrollHeight<expandedHeight&&index.querySelectorAll('.detailIndexItem').length>0&&!$('#planGrid .detailOwner')&&rect($('#q')).top>=rect(view).top,width+'x'+height+' closing disclosures recovers the browse view and controls');
 lines.push('STRESS '+JSON.stringify({width,height,aboutOpen,expandedControls:expandedHeight,expanded,layout:rect(layout).height,work:rect(view).height,index:rect(index).height,workScrollHeight:view.scrollHeight,controls:group.scrollHeight,documentTop:document.scrollingElement.scrollTop}));
 }
 // Reproduce the reported toolbar overflow at the live viewport and phone width.
 for(const [width,height]of [[984,779],[390,844]]){
 frame.style.width=width+'px';frame.style.height=height+'px';await tick();await tick();setView('plan');await tick();await tick();
 const group=$('#planView .studyBrowseControls'),panel=$('#planView .planFilterControls'),tools=panel.closest('details');
 group.querySelectorAll('details').forEach(node=>node.open=node===tools);group.scrollTop=0;await tick();await tick();
 const ids=['q','yearPrev','yearDisplay','yearNext','showAllYears','greatIdeaSel','sortSel','planViewModeBtn','resetChecksBtn','exportProgressBtn'];
 const nodes=ids.map(id=>$('#'+id)),groupBox=rect(group),viewBox=rect($('#planView'));
 assert(group.scrollHeight<=group.clientHeight+1&&panel.scrollHeight<=panel.clientHeight+1,width+' expanded toolbar has no vertical scrolling');
 assert(nodes.every(node=>{const box=rect(node);return visible(node)&&box.top>=Math.max(groupBox.top,viewBox.top)-1&&box.bottom<=Math.min(groupBox.bottom,viewBox.bottom)+1&&box.left>=groupBox.left-1&&box.right<=groupBox.right+1}),width+' all original year/filter/action controls visible together');
 assert(rect($('#q')).top>=groupBox.top&&group.scrollTop===0,width+' search stays visible above expanded tools');
 const actionRows=new Set(['planViewModeBtn','resetChecksBtn','exportProgressBtn'].map(id=>Math.round(rect($('#'+id)).top)));
 assert(actionRows.size<=(width>760?1:2),width+' actions use compact full-width rows');
 assert(rect($('#planView .detailIndex')).height>=(width>760?180:100),width+' expanded tools retain useful reading-list space');
 lines.push('METRICS '+JSON.stringify({width,height,brand:getComputedStyle($('.brand')).fontSize,list:getComputedStyle($('#planView .detailIndexTitle')).fontSize,guide:getComputedStyle($('#planView .detailSlot')).fontSize,group:{height:group.clientHeight,scrollHeight:group.scrollHeight},panel:rect(panel).height,index:rect($('#planView .detailIndex')).height,layout:rect($('#planView .studyDetailLayout')).height,work:{width:rect($('#planView')).width,clientHeight:$('#planView').clientHeight,scrollHeight:$('#planView').scrollHeight,scrollTop:$('#planView').scrollTop},controls:nodes.map(node=>({id:node.id,rect:rect(node).toJSON()}))}));
 tools.open=false;await tick();await tick();
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
 const disclosure=view.querySelector('details');disclosure.open=true;await tick();await tick();
 const expandedControl=[...disclosure.querySelectorAll('button,input,select,a[href]')].filter(node=>!node.disabled&&visible(node)).at(-1);expandedControl.focus();expandedControl.scrollIntoView({block:'nearest',inline:'nearest'});await tick();
 const controlBounds=rect(expandedControl),groupBounds=rect(disclosure.closest('.studyBrowseControls'));
 assert(document.activeElement===expandedControl&&controlBounds.top>=groupBounds.top-1&&controlBounds.bottom<=groupBounds.bottom+1,size+' '+page+' expanded final control focus reachable');await bounds(size+' '+page+' expanded');disclosure.open=false;
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
 setView('desk');await tick();await tick();const sheet=[...document.styleSheets].find(s=>s.href?.endsWith('study-workspace.css'));
 const geometry=()=>JSON.stringify([document.body.scrollHeight,document.body.scrollWidth,getComputedStyle(document.body).overflow,$('.wrap').getBoundingClientRect().toJSON(),getComputedStyle($('.wrap')).display,getComputedStyle($('.wrap')).padding]);
 const before=geometry();const incumbent=document.createElement('style');incumbent.textContent=(await (await fetch(sheet.href)).text()).split('/* Contained workspace.')[0];document.head.append(incumbent);sheet.disabled=true;await tick();const base=geometry();sheet.disabled=false;incumbent.remove();await tick();assert(before===base&&before===geometry(),size+' Desk wrapper/body equal original enhancement-disabled state '+before);
 setView('home');await tick();await bounds(size+' return from Desk');
 }
 out.dataset.result=failures?'fail':'pass';out.textContent=lines.join('\n')+'\n'+(failures?'FAIL '+failures:'ALL '+lines.filter(line=>line.startsWith('PASS ')).length+' CHECKS PASSED');
}catch(e){out.dataset.result='fail';out.textContent=lines.join('\n')+'\nFAIL '+e.stack}
finally{parent.finishFixture()}
