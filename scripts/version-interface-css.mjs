import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const htmlPath=new URL('index.html',root);
const html=readFileSync(htmlPath,'utf8');
const hash=createHash('sha256').update(readFileSync(new URL('assets/css/study-workspace.css',root))).digest('hex').slice(0,16);
const expected='assets/css/study-workspace.css?v='+hash;
const pattern=/href="assets\/css\/study-workspace\.css(?:\?[^"]*)?"/g;
if ([...html.matchAll(pattern)].length!==1) throw new Error('Expected one interface stylesheet link');
const next=html.replace(pattern,'href="'+expected+'"');
if (process.argv.includes('--write')) {
  if (next!==html) writeFileSync(htmlPath,next);
  console.log(expected);
} else if (next!==html) {
  console.error('Interface CSS changed. Run node scripts/version-interface-css.mjs --write before release.');
  process.exitCode=1;
} else console.log('Interface CSS version is current: '+hash);
