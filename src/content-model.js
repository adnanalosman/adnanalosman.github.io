export const REPOSITORY = 'adnanalosman/adnanalosman.github.io';
export const SITE_URL = 'https://adnanalosman.github.io';
export const LANGUAGES = ['ar', 'en'];
export const PROFILE_TEXT = ['title','description','role','heroDescription','aboutTitle','aboutBody','aboutSecond','experienceTitle','experienceRole','experienceContext','experienceDuration','experienceBody','nextLearning','contactTitle','contactBody'];
export const PROJECT_TEXT = ['name','category','status','complexity','description','learning','limitations'];
export const clone = value => JSON.parse(JSON.stringify(value));
export const serialize = value => JSON.stringify(value, null, 2) + '\n';
export const fingerprint = value => JSON.stringify(value);
export function emptyProject(id) {
  const translation = () => Object.fromEntries([...PROJECT_TEXT.map(k=>[k,'']), ['features',[]]]);
  return {id,repo:'',source:'',tags:[],en:translation(),ar:translation()};
}
export function validateContent(profile, projects, {draft=false}={}) {
  const errors=[];
  const fail=(path,message)=>errors.push(path+' — '+message);
  const object=(v,path,allowed)=> {
    if(!v || typeof v!=='object' || Array.isArray(v)){fail(path,'يجب أن يكون كائن بيانات.');return false;}
    for(const key of Object.keys(v))if(!allowed.includes(key))fail(path+'.'+key,'حقل غير معروف؛ لن يُنشر.');
    return true;
  };
  const text=(v,path,max=5000,optional=false)=>{
    if(typeof v!=='string' || (!draft&&!optional&&!v.trim()) || v.length>max)fail(path,'أدخل نصًا '+(optional?'':'غير فارغ ')+ 'لا يتجاوز '+max+' حرفًا.');
  };
  const list=(v,path,min=0,max=30)=>{
    if(!Array.isArray(v)||v.length<(draft?0:min)||v.length>max){fail(path,'عدد العناصر المطلوب بين '+min+' و'+max+'.');return false;}return true;
  };
  const strings=(v,path,min=0,max=30)=>{if(list(v,path,min,max))v.forEach((x,i)=>text(x,path+'.'+i,1000));};
  const github=(v,path)=>{
    if(draft){text(v,path,2000,true);return;}
    try {const u=new URL(v);if(u.protocol!=='https:'||u.hostname!=='github.com'||u.username||u.password||u.port||u.search||u.hash||!/^\/[\w-]+(?:\/[^/]+)*\/?$/.test(u.pathname))throw Error();}
    catch{fail(path,'أدخل رابط HTTPS صالحًا من github.com دون معاملات إضافية.');}
  };
  if(object(profile,'profile',['name','github','siteUrl','verifiedOn','contactEmail','experienceYears','experienceOrg','en','ar'])){
    text(profile.name,'profile.name',100);
    github(profile.github,'profile.github');
    if(profile.siteUrl!==SITE_URL)fail('profile.siteUrl','عنوان الاستضافة ثابت: '+SITE_URL);
    if(!draft&&(typeof profile.verifiedOn!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(profile.verifiedOn)||Number.isNaN(Date.parse(profile.verifiedOn))||new Date(profile.verifiedOn).toISOString().slice(0,10)!==profile.verifiedOn))fail('profile.verifiedOn','تاريخ غير صالح.');
    if(!draft&&profile.contactEmail!==null&&(typeof profile.contactEmail!=='string'||! /^[^\s@<>"'&?]+@[^\s@<>"'&?]+\.[^\s@<>"'&?]+$/.test(profile.contactEmail)||profile.contactEmail.length>254))fail('profile.contactEmail','أدخل بريدًا صالحًا أو اتركه فارغًا.');
    for(const k of ['experienceYears','experienceOrg'])if(profile[k]!==undefined)text(profile[k],'profile.'+k,40);
    for(const lang of LANGUAGES){
      const p=profile[lang], prefix='profile.'+lang;
      if(!object(p,prefix,[...PROFILE_TEXT,'heroLines','expertise','skills','experienceBullets','journey']))continue;
      for(const k of PROFILE_TEXT)text(p[k],prefix+'.'+k,k==='title'?160:5000);
      strings(p.heroLines,prefix+'.heroLines',3,3);
      strings(p.experienceBullets,prefix+'.experienceBullets',1,20);
      for(const [group,fields,arrayField] of [['expertise',['name','body'],'tags'],['skills',['label'],'items'],['journey',['stage','name','body'],null]]){
        if(!list(p[group],prefix+'.'+group,1,12))continue;
        p[group].forEach((row,i)=>{
          const path=prefix+'.'+group+'.'+i;
          if(!object(row,path,[...fields,...(arrayField?[arrayField]:[])]))return;
          for(const k of fields)text(row[k],path+'.'+k);
          if(arrayField)strings(row[arrayField],path+'.'+arrayField,1,20);
        });
      }
    }
  }
  if(list(projects,'projects',0,30)){
    const ids=new Set();
    projects.forEach((p,i)=>{
      const prefix='projects.'+i;
      if(!object(p,prefix,['id','repo','source','tags','en','ar']))return;
      if(!draft&&(typeof p.id!=='string'||! /^[a-z][a-z0-9-]{0,39}$/.test(p.id)||ids.has(p.id)))fail(prefix+'.id','المعرّف يجب أن يكون فريدًا بحروف إنجليزية صغيرة وأرقام وشرطات.');
      ids.add(p.id);github(p.repo,prefix+'.repo');github(p.source,prefix+'.source');
      if(!draft&&typeof p.repo==='string'&&typeof p.source==='string'&&!p.source.startsWith(p.repo.replace(/\/$/,'')+'/blob/'))fail(prefix+'.source','رابط المصدر يجب أن يشير إلى ملف داخل مستودع المشروع.');
      strings(p.tags,prefix+'.tags',1,12);
      for(const lang of LANGUAGES){
        if(!object(p[lang],prefix+'.'+lang,[...PROJECT_TEXT,'features']))continue;
        for(const k of PROJECT_TEXT)text(p[lang][k],prefix+'.'+lang+'.'+k);
        strings(p[lang].features,prefix+'.'+lang+'.features',1,20);
      }
    });
  }
  return errors;
}
export function assertContent(profile,projects) {
  const errors=validateContent(profile,projects);
  if(errors.length)throw new Error(errors.slice(0,12).join('\n'));
}
export function changedPaths(before,after,path='') {
  if(fingerprint(before)===fingerprint(after))return [];
  if(!before||!after||typeof before!=='object'||typeof after!=='object')return [path];
  if(Array.isArray(before)||Array.isArray(after))return [path];
  return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(key=>changedPaths(before[key],after[key],path?path+'.'+key:key));
}
