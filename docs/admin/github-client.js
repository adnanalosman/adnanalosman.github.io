import { REPOSITORY, assertContent, fingerprint, serialize } from './content-model.js';
import { renderContentFiles } from './content-renderer.js';

const API='https://api.github.com';
const ROOT='/repos/'+REPOSITORY;
export class GitHubError extends Error {
  constructor(message,status=0){super(message);this.status=status;}
}
export function createGitHubClient(token='',fetcher=globalThis.fetch) {
  return async function request(path,{method='GET',body}={}) {
    if(!(path=== '/user'||path===ROOT||path.startsWith(ROOT+'/')))throw new Error('وجهة غير مسموحة.');
    const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
    if(token)headers.Authorization='Bearer '+token;
    if(body)headers['Content-Type']='application/json';
    let response;
    try{response=await fetcher(API+path,{method,headers,body:body?JSON.stringify(body):undefined,credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(25000)});}
    catch{throw new GitHubError('تعذّر الاتصال بـ GitHub. احتفظ بمسودتك وأعد المحاولة بعد التحقق من الاتصال.');}
    if(!response.ok){
      const messages={
        401:'رمز الوصول غير صالح أو انتهت صلاحيته.',
        403:'رفض GitHub الطلب. تحقق من صلاحية Contents: Read and write لهذا المستودع، أو انتظر إن بلغ حد الطلبات.',
        404:'المستودع أو الملف غير متاح. تحقق من اختيار المستودع في صلاحيات الرمز.',
        409:'تعارض في الحفظ. لم تُستبدل النسخة الحالية؛ حمّل آخر نسخة بعد تنزيل مسودتك.',
        422:'لم يقبل GitHub الحفظ. ربما تغيّر الفرع أثناء التحرير أو توجد قاعدة تمنع الكتابة المباشرة.',
        429:'بلغ حد الطلبات. احتفظ بمسودتك وحاول لاحقًا.'
      };
      throw new GitHubError(messages[response.status]||'تعذّر إكمال العملية في GitHub ('+response.status+').',response.status);
    }
    return response.status===204?null:response.json();
  };
}
export function decodeContent(file) {
  if(file.encoding!=='base64'||typeof file.content!=='string')throw new Error('تعذّر قراءة ملف البيانات.');
  return new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
}
export async function loadRepository(request=createGitHubClient()) {
  const ref=await request(ROOT+'/git/ref/heads/main');
  const head=ref.object.sha;
  const [commit,profileFile,projectsFile]=await Promise.all([
    request(ROOT+'/git/commits/'+head),
    request(ROOT+'/contents/data/profile.json?ref='+head),
    request(ROOT+'/contents/data/projects.json?ref='+head)
  ]);
  const profile=JSON.parse(decodeContent(profileFile)),projects=JSON.parse(decodeContent(projectsFile));
  assertContent(profile,projects);
  return {head,tree:commit.tree.sha,profile,projects};
}
export function publicationEntries(profile,projects) {
  assertContent(profile,projects);
  return Object.entries({
    'data/profile.json':serialize(profile),
    'data/projects.json':serialize(projects),
    ...renderContentFiles(profile,projects)
  }).map(([path,content])=>({path,mode:'100644',type:'blob',content}));
}
export async function publishContent({baseline,profile,projects,token,approveEmail=false,onProgress=()=>{},fetcher=globalThis.fetch}) {
  assertContent(profile,projects);
  if(!baseline?.profile||!baseline.projects)throw new Error('حمّل بيانات الموقع قبل النشر.');
  if(fingerprint(profile)===fingerprint(baseline.profile)&&fingerprint(projects)===fingerprint(baseline.projects))throw new Error('لا توجد تعديلات جديدة للنشر.');
  if(profile.contactEmail&&profile.contactEmail!==baseline.profile.contactEmail&&!approveEmail)throw new Error('يلزم تأكيد نشر البريد الإلكتروني للعامة.');
  if(typeof token!=='string'||!/^github_pat_[A-Za-z0-9_]+$/.test(token))throw new Error('استخدم رمز Fine-grained personal access token من GitHub.');
  const request=createGitHubClient(token,fetcher);
  onProgress('التحقق من الصلاحية وآخر نسخة…');
  const user=await request('/user');
  if(user.login!=='adnanalosman'||!Number.isSafeInteger(user.id)||user.id<1)throw new Error('يجب استخدام رمز من حساب adnanalosman.');
  if(!baseline.head||!baseline.tree){
    const latest=await loadRepository(request);
    if(fingerprint(latest.profile)!==fingerprint(baseline.profile)||fingerprint(latest.projects)!==fingerprint(baseline.projects))throw new GitHubError('تختلف البيانات المنشورة عن النسخة في المحرر. نزّل مسودتك وحمّل آخر نسخة قبل النشر.',409);
    baseline=latest;
  }
  const ref=await request(ROOT+'/git/ref/heads/main');
  if(ref.object.sha!==baseline.head)throw new GitHubError('تغيّر المستودع منذ تحميل البيانات. نزّل مسودتك ثم حمّل آخر نسخة لتجنب تجاوز تعديلات أحدث.',409);
  onProgress('تجهيز البيانات والصفحات باللغتين…');
  const tree=await request(ROOT+'/git/trees',{method:'POST',body:{base_tree:baseline.tree,tree:publicationEntries(profile,projects)}});
  const identity={name:user.name||user.login,email:user.id+'+'+user.login+'@users.noreply.github.com'};
  const commit=await request(ROOT+'/git/commits',{method:'POST',body:{message:'Update portfolio content through the web editor',tree:tree.sha,parents:[baseline.head],author:identity,committer:identity}});
  onProgress('حفظ التعديلات في الفرع الرئيسي…');
  try {await request(ROOT+'/git/refs/heads/main',{method:'PATCH',body:{sha:commit.sha,force:false}});}
  catch(error){
    // A connection can fail after GitHub has accepted the update. Read once,
    // never retry a write blindly and never report an uncertain write as saved.
    if(error.status===0){
      try {const check=await request(ROOT+'/git/ref/heads/main');if(check.object.sha===commit.sha)return {head:commit.sha,tree:tree.sha,profile,projects};}catch{}
    }
    throw error;
  }
  return {head:commit.sha,tree:tree.sha,profile,projects};
}
