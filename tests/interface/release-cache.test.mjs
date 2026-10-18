import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
test('the released interface URL changes when its stylesheet bytes change',()=>{
  const html=readFileSync(new URL('index.html',root),'utf8');
  const href=html.match(/href="(assets\/css\/study-workspace\.css[^"]*)"/)?.[1];
  const hash=createHash('sha256').update(readFileSync(new URL('assets/css/study-workspace.css',root))).digest('hex').slice(0,16);
  assert.equal(new URL(href,'https://classics.ourstuff.space/').searchParams.get('v'),hash,
    'Release CSS must have a content version. Run node scripts/version-interface-css.mjs --write before publishing.');
});
