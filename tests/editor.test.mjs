import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent,clone,emptyProject,REPOSITORY} from '../src/content-model.js';
import {renderPage,renderContentFiles} from '../src/content-renderer.js';
import {publishContent,publicationEntries,decodeContent,createGitHubClient} from '../.local-admin/github-client.js';
const profile=JSON.parse(await readFile(new URL('../data/profile.json',import.meta.url),'utf8'));
const projects=JSON.parse(await readFile(new URL('../data/projects.json',import.meta.url),'utf8'));
const baseline={head:'old-head',tree:'old-tree',profile,projects};
const edited=()=>{const p=clone(profile);p.ar.role='متخصص في البيانات — تعديل تجريبي';return p;};
const stubToken='github_pat_TEST_ONLY';
function mock({conflict=false,patchStatus=200,networkAfterPatch=false,badAuth=false}={}){
  const calls=[];
  const fetcher=async(url,init)=>{
    calls.push({url,...init,body:init.body?JSON.parse(init.body):undefined});
    let body={},status=200;
    if(url.endsWith('/user')){body={login:'adnanalosman',id:123,name:'Adnan Alosman'};if(badAuth)status=401;}
    else if(url.endsWith('/git/ref/heads/main'))body={object:{sha:networkAfterPatch&&calls.some(x=>x.method==='PATCH')?'new-commit':conflict?'someone-else':'old-head'}};
    else if(url.endsWith('/git/trees'))body={sha:'new-tree'};
    else if(url.endsWith('/git/commits'))body={sha:'new-commit'};
    else if(init.method==='PATCH'){if(networkAfterPatch)throw Error('network');status=patchStatus;}
    else throw Error('Unexpected URL');
    return {ok:status<400,status,json:async()=>body};
  };
  return {calls,fetcher};
}
test('editor validates current data, rejects unsafe URLs, missing translation and malformed schema',()=>{
  assert.deepEqual(validateContent(profile,projects),[]);
  const a=clone(profile);a.github='javascript:alert(1)';
  assert.ok(validateContent(a,projects).some(s=>s.startsWith('profile.github')));
  const b=clone(projects);b[1].id=b[0].id;b[1].source='https://example.com/code';delete b[1].ar.name;
  assert.ok(validateContent(profile,b).length>=3);
  const c=clone(profile);c.verifiedOn='2026-02-30';c.secret='never publish unknown fields';
  assert.ok(validateContent(c,projects).length>=2);
  const incomplete=[...clone(projects),emptyProject('new-project')];
  assert.ok(validateContent(profile,incomplete).length);
  assert.deepEqual(validateContent(profile,incomplete,{draft:true}),[],'Incomplete projects can be restored as drafts');
});
test('renderer applies edited name and project count, escapes text, preserves Arabic and does not mutate input',()=>{
  const p=edited();p.name='<img src=x onerror=alert(1)> & Name';
  const before=JSON.stringify(p);
  const list=[...clone(projects),{...clone(projects[0]),id:'another',en:{...projects[0].en,name:'Another project'}}];
  const html=renderPage(p,list,'ar');
  assert.ok(html.includes('متخصص في البيانات — تعديل تجريبي'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; &amp; Name'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('<strong dir="ltr">05</strong>'));
  assert.equal(JSON.stringify(p),before);
  assert.ok(!Object.keys(renderContentFiles(p,list)).some(path=>path.startsWith('docs/admin/')));
});
test('Unicode JSON decoding and generated files remain in sync',()=>{
  const content=Buffer.from(JSON.stringify(profile),'utf8').toString('base64');
  assert.deepEqual(JSON.parse(decodeContent({encoding:'base64',content})),profile);
  const entries=publicationEntries(edited(),projects);
  assert.deepEqual(entries.map(x=>x.path),['data/profile.json','data/projects.json','docs/index.html','docs/ar/index.html']);
  assert.equal(JSON.parse(entries[0].content).ar.role,edited().ar.role);
  assert.ok(entries[3].content.includes(edited().ar.role));
});
test('publishing creates one atomic commit with an existing parent and non-force update',async()=>{
  const m=mock();
  const result=await publishContent({baseline,profile:edited(),projects,token:stubToken,fetcher:m.fetcher});
  assert.equal(result.head,'new-commit');
  const tree=m.calls.find(x=>x.url.endsWith('/git/trees'));assert.equal(tree.body.base_tree,'old-tree');assert.equal(tree.body.tree.length,4);
  const commit=m.calls.find(x=>x.url.endsWith('/git/commits'));assert.deepEqual(commit.body.parents,['old-head']);assert.equal(commit.body.author.email,'123+adnanalosman@users.noreply.github.com');
  const patch=m.calls.at(-1);assert.equal(patch.method,'PATCH');assert.equal(patch.body.force,false);
  for(const call of m.calls){
    assert.ok(call.url.startsWith('https://api.github.com/'));
    assert.equal(call.credentials,'omit');assert.equal(call.redirect,'error');
    assert.equal(call.headers.Authorization,'Bearer '+stubToken);
    assert.ok(!JSON.stringify(call.body||{}).includes(stubToken),'Token must never be committed');
  }
});
test('concurrent changes, invalid data and unapproved email prevent publication',async()=>{
  const m=mock({conflict:true});
  await assert.rejects(publishContent({baseline,profile:edited(),projects,token:stubToken,fetcher:m.fetcher}),/تغيّر المستودع/);
  assert.ok(m.calls.every(x=>x.method==='GET'));
  const e=edited();e.contactEmail='example@example.com';
  const n=mock();
  await assert.rejects(publishContent({baseline,profile:e,projects,token:stubToken,fetcher:n.fetcher}),/تأكيد/);
  assert.equal(n.calls.length,0);
  const bad=edited();bad.siteUrl='https://elsewhere.example';
  await assert.rejects(publishContent({baseline,profile:bad,projects,token:stubToken,fetcher:n.fetcher}));
  assert.equal(n.calls.length,0);
});
test('permission failure and racing branch update report failure without claiming success',async()=>{
  for(const opts of [{badAuth:true},{patchStatus:422}]){
    const m=mock(opts);await assert.rejects(publishContent({baseline,profile:edited(),projects,token:stubToken,fetcher:m.fetcher}));
    assert.ok(m.calls.filter(x=>x.method==='PATCH').every(x=>x.body.force===false));
  }
});
test('uncertain network result is checked without retrying the write',async()=>{
  const m=mock({networkAfterPatch:true});
  const result=await publishContent({baseline,profile:edited(),projects,token:stubToken,fetcher:m.fetcher});
  assert.equal(result.head,'new-commit');assert.equal(m.calls.filter(x=>x.method==='PATCH').length,1);
});
test('client will not send credentials to arbitrary endpoints',async()=>{
  const m=mock(),request=createGitHubClient(stubToken,m.fetcher);
  await assert.rejects(request('https://evil.example/'));
  await assert.rejects(request('/repos/someone/another/git/trees'));
  assert.equal(m.calls.length,0);
});
test('editor has restrictive CSP, no indexing, external scripts and isolated token input',async()=>{
  const html=await readFile(new URL('../.local-admin/index.html',import.meta.url),'utf8');
  assert.match(html,/noindex,nofollow/);assert.match(html,/script-src 'self'/);assert.match(html,/form-action 'none'/);
  assert.match(html,/id="github-token" type="password" autocomplete="off"/);
  assert.doesNotMatch(html,/<script[^>]+src="https?:/);
});
