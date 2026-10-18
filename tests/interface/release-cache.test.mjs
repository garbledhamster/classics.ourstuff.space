import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,copyFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
test('the released interface URL changes when its stylesheet bytes change',()=>{
  const html=readFileSync(new URL('index.html',root),'utf8');
  const href=html.match(/href="(assets\/css\/study-workspace\.css[^"]*)"/)?.[1];
  const hash=createHash('sha256').update(readFileSync(new URL('assets/css/study-workspace.css',root))).digest('hex').slice(0,16);
  assert.equal(new URL(href,'https://classics.ourstuff.space/').searchParams.get('v'),hash,
    'Release CSS must have a content version. Run node scripts/version-interface-css.mjs --write before publishing.');
});

test('the directly loaded presentation shell URL changes when its bytes change',()=>{
  const html=readFileSync(new URL('index.html',root),'utf8');
  const src=html.match(/src="(assets\/js\/classics\/study-shell\.js[^"]*)"/)?.[1];
  const hash=createHash('sha256').update(readFileSync(new URL('assets/js/classics/study-shell.js',root))).digest('hex').slice(0,16);
  assert.equal(new URL(src,'https://classics.ourstuff.space/').searchParams.get('v'),hash,
    'Release presentation shell must have a content version. Run node scripts/version-interface-css.mjs --write before publishing.');
});

test('the presentation shell imports the current browse controls content version',()=>{
  const shell=readFileSync(new URL('assets/js/classics/study-shell.js',root),'utf8');
  const src=shell.match(/from ['"](\.\/browse-controls\.js[^'"]*)['"]/)?.[1];
  const hash=createHash('sha256').update(readFileSync(new URL('assets/js/classics/browse-controls.js',root))).digest('hex').slice(0,16);
  assert.equal(new URL(src,'https://classics.ourstuff.space/assets/js/classics/study-shell.js').searchParams.get('v'),hash,
    'The imported browse controls module must have a content version; refresh the presentation chain before publishing.');
});

test('the release helper refreshes a changed child through shell and entry without touching data URLs',()=>{
  const dir=mkdtempSync(join(tmpdir(),'classics-presentation-cache-'));
  try{
    for(const folder of ['scripts','assets/css','assets/js/classics'])mkdirSync(join(dir,folder),{recursive:true});
    copyFileSync(new URL('scripts/version-interface-css.mjs',root),join(dir,'scripts/version-interface-css.mjs'));
    writeFileSync(join(dir,'assets/css/study-workspace.css'),'body { color: black; }');
    writeFileSync(join(dir,'assets/js/classics/browse-controls.js'),'export const initial = true;');
    writeFileSync(join(dir,'assets/js/classics/study-shell.js'),"import {initial} from './browse-controls.js';\n");
    writeFileSync(join(dir,'index.html'),'<link href="assets/css/study-workspace.css"><script src="assets/js/classics/study-shell.js"></script><link href="./data/manifest.json">');
    const run=(...args)=>spawnSync(process.execPath,[join(dir,'scripts/version-interface-css.mjs'),...args],{encoding:'utf8'});
    assert.equal(run('--write').status,0);
    const beforeShell=readFileSync(join(dir,'assets/js/classics/study-shell.js'),'utf8'),beforeHtml=readFileSync(join(dir,'index.html'),'utf8');
    assert.equal(run().status,0);
    writeFileSync(join(dir,'assets/js/classics/browse-controls.js'),'export const initial = false;');
    assert.equal(run().status,1,'a child-only change must invalidate the chain');
    assert.equal(readFileSync(join(dir,'assets/js/classics/study-shell.js'),'utf8'),beforeShell,'check mode must not modify sources');
    assert.equal(readFileSync(join(dir,'index.html'),'utf8'),beforeHtml,'check mode must not modify entry HTML');
    assert.equal(run('--write').status,0);
    const afterShell=readFileSync(join(dir,'assets/js/classics/study-shell.js'),'utf8'),afterHtml=readFileSync(join(dir,'index.html'),'utf8');
    assert.notEqual(afterShell,beforeShell);assert.notEqual(afterHtml,beforeHtml);
    const digest=value=>createHash('sha256').update(value).digest('hex').slice(0,16);
    assert.ok(afterShell.includes('./browse-controls.js?v='+digest('export const initial = false;')));
    assert.ok(afterHtml.includes('assets/js/classics/study-shell.js?v='+digest(afterShell)));
    assert.equal(afterHtml.match(/assets\/css\/study-workspace\.css[^"]*/)[0],beforeHtml.match(/assets\/css\/study-workspace\.css[^"]*/)[0]);
    assert.ok(afterHtml.includes('href="./data/manifest.json"'));assert.equal(run().status,0);
  }finally{rmSync(dir,{recursive:true,force:true})}
});
