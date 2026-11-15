import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const screens=JSON.parse(readFileSync(new URL('../../data/screens.json',import.meta.url)));
const subflows=JSON.parse(readFileSync(new URL('../../data/subflows.json',import.meta.url)));
const caps=JSON.parse(readFileSync(new URL('../../data/capabilities.json',import.meta.url)));
test('approved 104 / 35 / 40 registers stable',()=>{
 assert.equal(screens.length,104);assert.equal(subflows.length,35);assert.equal(caps.length,40);
 assert.equal(new Set(screens.map(s=>s.id)).size,104);
});
test('React web covers public and mobile/enterprise/family surfaces',()=>{
 for(const mark of ['PublicSite','CommandCenter','Family','Enterprise','Forensics','Support','Admin','MobilePreview','Partners'])assert.ok(src.includes('function '+mark));
 assert.ok(src.includes("CFG-AGE-002"));
 assert.ok(src.includes("RESULT_UNCONFIRMED"));
});
test('no production device API calls or fake payment action',()=>{
 assert.equal(src.includes('navigator.mediaDevices'),false);
 assert.equal(src.includes('fetch('),false);
 assert.equal(src.includes('WIPE_DEVICE'),false);
});
