import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const docs=path.join(root,'docs');
const read=p=>readFile(path.join(root,p),'utf8');
const profile=JSON.parse(await read('data/profile.json'));
const projects=JSON.parse(await read('data/projects.json'));
for(const [language,file] of [['en','index.html'],['ar','ar/index.html']]){
 test(`${language}: valid structure, metadata, project data and privacy`,async()=>{
  const html=await read('docs/'+file);
  assert.match(html,new RegExp(`<html lang="${language}" dir="${language==='ar'?'rtl':'ltr'}"`));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.equal((html.match(/class="project-card /g)||[]).length,projects.length);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,'No duplicate IDs');
  for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),`Missing anchor: ${m[1]}`);
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   const href=m[1];if(/^(https?:|mailto:|#)/.test(href))continue;
   let target=path.resolve(docs,path.dirname(file),href.split('#')[0]);
   if(href.endsWith('/'))target=path.join(target,'index.html');
   await access(target);
  }
  const structured=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(structured.mainEntity.name,'Adnan Alosman');
  assert.equal(structured.inLanguage,language);
  assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="ar"/);
  assert.match(html,/<link rel="canonical"/);
  for(const project of projects){assert.ok(html.includes(project.repo));assert.ok(html.includes(project.source));assert.ok(project[language].limitations);}
  if (!profile.contactEmail) assert.doesNotMatch(html,/mailto:|tel:|@gmail\.com/i);
  assert.doesNotMatch(html,/api[_-]?key|[0-9]{10,}/i);
  assert.doesNotMatch(html,/<form|https?:\/\/.*(?:google-analytics|fonts\.googleapis)/i);
  for(const m of html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gs))assert.ok(/aria-label=/.test(m[1])||m[2].replace(/<[^>]*>/g,'').trim());
 });
}
test('data entries have unique stable IDs and approved public source links',()=>{
 assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);
 assert.ok(profile.contactEmail === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.contactEmail));
 for(const p of projects){assert.ok(p.repo.startsWith(profile.github+'/'));assert.ok(p.source.startsWith(p.repo+'/blob/'));for(const lang of ['en','ar'])for(const key of ['name','description','status','complexity','features','learning','limitations'])assert.ok(p[lang][key]);}
});
test('core body and action colors meet WCAG AA text contrast',()=>{
 const luminance=hex=>{const rgb=hex.match(/[\da-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 const pairs=[['182b22','f6f7f2'],['5c685f','f6f7f2'],['5c685f','eef0e9'],['f6f7f2','285d43'],['eef3e7','121b17'],['b2bdb2','121b17'],['b2bdb2','1b2821'],['121b17','c6e49b'],['bcc9bc','1c3327']];
 for(const [a,b] of pairs){const x=luminance(a),y=luminance(b);assert.ok((Math.max(x,y)+.05)/(Math.min(x,y)+.05)>=4.5,`${a} on ${b}`);}
});
test('site is compact and generated assets are present',async()=>{
 const {stat}=await import('node:fs/promises');let bytes=0;
 const walk=async dir=>{for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else bytes+=(await stat(p)).size;}};
 await walk(docs);assert.ok(bytes<700000,`Static output ${bytes} bytes exceeds intended budget`);
 await access(path.join(docs,'404.html'));await access(path.join(docs,'sitemap.xml'));await access(path.join(docs,'.nojekyll'));
});
