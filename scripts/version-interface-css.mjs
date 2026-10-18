import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const htmlPath=new URL('index.html',root),shellPath=new URL('assets/js/classics/study-shell.js',root);
const html=readFileSync(htmlPath,'utf8'),shell=readFileSync(shellPath,'utf8');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex').slice(0,16);
// Refresh the small presentation chain from leaf to entry. Original data,
// auth and application-module request construction remains unchanged.
const browseVersion='./browse-controls.js?v='+hash(readFileSync(new URL('assets/js/classics/browse-controls.js',root)));
const importPattern=/(\bfrom\s*['"])\.\/browse-controls\.js(?:\?[^'"]*)?(['"])/g;
if([...shell.matchAll(importPattern)].length!==1)throw new Error('Expected one browse controls import');
const nextShell=shell.replace(importPattern,(_,prefix,suffix)=>prefix+browseVersion+suffix);
const entries=[
  ['assets/css/study-workspace.css','href',readFileSync(new URL('assets/css/study-workspace.css',root))],
  ['assets/js/classics/study-shell.js','src',nextShell],
];
let next=html;
const versions=[browseVersion];
for(const[path,attribute,bytes]of entries){
  const expected=path+'?v='+hash(bytes);
  const escaped=path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(attribute+'="'+escaped+'(?:\\?[^\"]*)?"','g');
  if([...next.matchAll(pattern)].length!==1)throw new Error('Expected one interface resource: '+path);
  next=next.replace(pattern,attribute+'="'+expected+'"');versions.push(expected);
}
if(process.argv.includes('--write')){
  if(nextShell!==shell)writeFileSync(shellPath,nextShell);
  if(next!==html)writeFileSync(htmlPath,next);
  console.log(versions.join('\n'));
}else if(next!==html||nextShell!==shell){
  console.error('Interface presentation changed. Run node scripts/version-interface-css.mjs --write before release.');process.exitCode=1;
}else console.log('Interface presentation versions are current:\n'+versions.join('\n'));
