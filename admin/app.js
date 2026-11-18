import {clone,serialize,validateContent,changedPaths,emptyProject,LANGUAGES,REPOSITORY} from './content-model.js';
import {renderPage} from './content-renderer.js';
import {loadRepository,publishContent} from './github-client.js';

const $=selector=>document.querySelector(selector);
const STORAGE_KEY='adnan-portfolio-editor:draft:v1';
const state={view:'overview',language:'ar',data:null,baseline:null,selected:0,busy:false,draft:null,timer:null,storageFailed:false,previewSize:'desktop',previewTheme:'light'};
const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
function button(text,action,className='button'){const b=node('button',className,text);b.type='button';b.addEventListener('click',action);return b;}
function link(text,url,className='button'){const a=node('a',className,text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function notice(message,error=false){const n=$('#notice');n.textContent=message;n.classList.toggle('error',error);n.hidden=!message;}
function get(path){return path.reduce((v,k)=>v?.[k],state.data);}
function set(path,value){let target=state.data;for(const key of path.slice(0,-1))target=target[key];target[path.at(-1)]=value;}
function isDirty(){return !!state.data&&JSON.stringify(state.data)!==JSON.stringify({profile:state.baseline.profile,projects:state.baseline.projects});}
function refreshState(message){
  $('#save-state').textContent=message||(isDirty()?'تعديلات في المسودة · لم تُنشر بعد':'مطابق لآخر بيانات محمّلة');
  $('#review').disabled=!state.data||state.busy||!isDirty();
  $('#save-draft').disabled=!state.data||state.busy;
  $('#reload').disabled=state.busy;
  $('#project-count').textContent=state.data?.projects.length??'—';
}
function saveDraft(showFeedback=false){
  clearTimeout(state.timer);
  if(!state.data)return;
  try{
    const draft={version:1,savedAt:new Date().toISOString(),baseline:clone(state.baseline),data:clone(state.data)};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));
    state.storageFailed=false;
    refreshState(isDirty()?'مسودة محفوظة على هذا الجهاز · لم تُنشر':'تم حفظ نسخة على هذا الجهاز');
    if(showFeedback)notice('حُفظت مسودتك على هذا الجهاز. لم يتغيّر الموقع المنشور.');
  }catch{state.storageFailed=true;notice('تعذّر حفظ المسودة على هذا الجهاز. نزّل نسخة احتياطية قبل إغلاق الصفحة.',true);}
}
function changed(){if($('#notice').classList.contains('error'))notice('');refreshState();clearTimeout(state.timer);state.timer=setTimeout(()=>saveDraft(),500);}
function field(path,label,{multiline=false,lines=false,ltr=false,readonly=false,type='text',hint='',optional=false}={}){
  const wrap=node('div','field'+(multiline||lines?' wide':''));
  const id='field-'+path.join('-'),lab=node('label','',label);lab.htmlFor=id;
  const input=node(multiline||lines?'textarea':'input');
  if(input.tagName==='INPUT')input.type=type;
  input.id=id;input.dataset.path=path.join('.');input.dir=ltr?'ltr':(path.includes('en')?'ltr':'rtl');
  input.value=lines?(get(path)||[]).join('\n'):(get(path)??'');
  input.readOnly=readonly;input.spellcheck=!(ltr||type==='email');input.autocomplete='off';
  if(!readonly)input.addEventListener('input',()=>{
    const value=lines?input.value.split('\n').map(s=>s.trim()).filter(Boolean):(optional&&!input.value.trim()?null:input.value);
    set(path,value);changed();
  });
  wrap.append(lab,input);
  if(hint||lines){const help=node('small','',hint||(lines?'اكتب كل عنصر في سطر منفصل.':''));help.id=id+'-help';input.setAttribute('aria-describedby',help.id);wrap.append(help);}
  return wrap;
}
const FIELDS={
  title:['عنوان الصفحة في نتائج البحث'],description:['وصف الصفحة في نتائج البحث',{multiline:true}],
  role:['التعريف المهني المختصر'],heroLines:['العنوان الرئيسي',{lines:true,hint:'ثلاثة أسطر بالضبط؛ يظهر السطر الأخير بلون مميّز.'}],
  heroDescription:['مقدمة الصفحة',{multiline:true}],aboutTitle:['عنوان النبذة',{multiline:true}],aboutBody:['نبذة عن الخبرة',{multiline:true}],aboutSecond:['نبذة عن التعلّم',{multiline:true}],
  experienceTitle:['عنوان قسم الخبرة',{multiline:true}],experienceRole:['الدور أو المهام المهنية'],experienceContext:['المؤسسة والسياق'],experienceDuration:['المدة أو التواريخ'],experienceBody:['وصف التجربة',{multiline:true}],experienceBullets:['المهام والمسؤوليات',{lines:true}],
  nextLearning:['خطوات التعلّم التالية',{multiline:true}],contactTitle:['عنوان التواصل',{multiline:true}],contactBody:['نص التواصل',{multiline:true}],
  name:['الاسم أو العنوان'],body:['الوصف',{multiline:true}],tags:['التقنيات أو الكلمات المفتاحية',{lines:true}],label:['اسم مجموعة المهارات'],items:['المهارات',{lines:true}],stage:['المرحلة'],
  category:['التصنيف'],status:['حالة المشروع'],complexity:['مستوى التعقيد'],learning:['ما تعلّمته',{multiline:true}],limitations:['نطاق المشروع وحدوده',{multiline:true}],features:['الميزات أو الأعمال المنفّذة',{lines:true}]
};
function card(title,description=''){const c=node('section','card');c.append(node('h2','',title));if(description)c.append(node('p','',description));return c;}
function addFields(container,prefix,keys){const grid=node('div','field-grid');for(const key of keys){const [defaultLabel,opts]=FIELDS[key];const label=prefix[0]==='projects'&&key==='description'?'وصف المشروع':defaultLabel;grid.append(field([...prefix,key],label,opts));}container.append(grid);}
function confirmAction(message,action){
  const dialog=$('#confirm-dialog');$('#confirm-message').textContent=message;
  $('#confirm-yes').onclick=()=>{dialog.close();action();};$('#confirm-cancel').onclick=()=>dialog.close();dialog.showModal();
}
function chooseView(view){state.view=view;render();}
function overview(){
  const frag=document.createDocumentFragment(),stats=node('div','stats');
  for(const [value,label] of [[String(state.data.projects.length).padStart(2,'0'),'مشاريع قابلة للتحرير'],['02','لغتان للمحتوى'],['02','ملفا بيانات منظّمان']]){
    const s=node('div','stat');s.append(node('strong','',value),node('span','',label));stats.append(s);
  }
  const welcome=node('section','welcome'),copy=node('div');
  copy.append(node('p','eyebrow','من الفكرة إلى الصفحة'),node('h2','','حدّث قصتك، خطوة بخطوة.'),node('p','','ابدأ بالملف الشخصي أو المشاريع. عاين النتيجة، ثم انشر النسخة التي تريد أن يراها الزائر.'),button('تعديل الملف الشخصي ←',()=>chooseView('profile')));
  welcome.append(copy,node('span','welcome-mark','{ }'));
  const quick=node('div','quick-grid'),p=card('مساحة مشاريعك','أضف مشروعًا، حدّث حالته، أو غيّر ترتيب عرضه مع الحفاظ على الوصف باللغتين.'),b=card('نسخة ترجع إليها','نزّل ملفاتك أو استعد مسودة محفوظة. الحفظ على هذا الجهاز منفصل عن النشر.');
  p.append(button('إدارة المشاريع',()=>chooseView('projects')));b.append(button('النسخ الاحتياطية',()=>chooseView('backup')));quick.append(p,b);
  const errors=validateContent(state.data.profile,state.data.projects);
  const status=node('p','status-line',errors.length?'تحتاج '+errors.length+' حقول إلى المراجعة قبل النشر.':'بياناتك جاهزة للمعاينة. راجع دقة المعلومات في اللغتين قبل نشرها.');
  frag.append(stats,welcome,quick,status);return frag;
}
function collection(group,title,fields,arrayField){
  const lang=state.language,prefix=['profile',lang,group],c=card(title,'كل لغة لها محتواها المستقل. حدّث النسخة المقابلة عند إضافة عنصر أو حذفه.');
  const rows=get(prefix);
  rows.forEach((row,index)=>{
    const box=node('div','sub-card'),head=node('div','sub-heading'),actions=node('div','row-actions');head.append(node('h3','','العنصر '+(index+1)));
    const up=button('↑',()=>{[rows[index-1],rows[index]]=[rows[index],rows[index-1]];changed();render();},'icon-button');up.disabled=index===0;up.setAttribute('aria-label','تقديم العنصر '+(index+1)+' في '+title);
    const down=button('↓',()=>{[rows[index+1],rows[index]]=[rows[index],rows[index+1]];changed();render();},'icon-button');down.disabled=index===rows.length-1;down.setAttribute('aria-label','تأخير العنصر '+(index+1)+' في '+title);
    const remove=button('×',()=>confirmAction('حذف هذا العنصر من المسودة؟ لن يتغيّر الموقع حتى تنشر.',()=>{rows.splice(index,1);changed();render();}),'icon-button');remove.disabled=rows.length<=1;remove.setAttribute('aria-label','حذف العنصر '+(index+1)+' من '+title);
    actions.append(up,down,remove);head.append(actions);box.append(head);addFields(box,[...prefix,index],[...fields,...(arrayField?[arrayField]:[])]);c.append(box);
  });
  const add=button('＋ إضافة عنصر',()=>{rows.push(Object.fromEntries([...fields.map(k=>[k,'']),...(arrayField?[[arrayField,[]]]:[])]));changed();render();},'button collection-add');add.disabled=rows.length>=12;c.append(add);return c;
}
function profile(){
  const frag=document.createDocumentFragment(),common=card('البيانات المشتركة','هذه الحقول مشتركة بين العربية والإنجليزية.'),grid=node('div','field-grid');
  grid.append(field(['profile','name'],'الاسم المهني',{ltr:true}),field(['profile','github'],'رابط الملف على GitHub',{ltr:true}),field(['profile','siteUrl'],'عنوان الموقع',{ltr:true,readonly:true}),field(['profile','verifiedOn'],'تاريخ مراجعة المحتوى',{type:'date',ltr:true}),field(['profile','experienceYears'],'سنوات الخبرة المعروضة',{ltr:true,hint:'مثال: 5+'}),field(['profile','experienceOrg'],'اختصار المؤسسة',{ltr:true}),field(['profile','contactEmail'],'بريد تواصل عام — اختياري',{type:'email',ltr:true,optional:true,hint:'اتركه فارغًا لإخفائه. سيُطلب تأكيد نشر أي بريد جديد.'}));common.append(grid);frag.append(common);
  const prefix=['profile',state.language];
  for(const [title,keys] of [
    ['المقدمة وظهور الموقع في البحث',['title','description','role','heroLines','heroDescription']],
    ['نبذة عني',['aboutTitle','aboutBody','aboutSecond']]
  ]){const c=card(title);addFields(c,prefix,keys);frag.append(c);}
  frag.append(collection('expertise','مجالات الخبرة',['name','body'],'tags'),collection('skills','مجموعات المهارات',['label'],'items'));
  const exp=card('الخبرة المهنية');addFields(exp,prefix,['experienceTitle','experienceRole','experienceContext','experienceDuration','experienceBody','experienceBullets']);frag.append(exp);
  frag.append(collection('journey','رحلة التعلّم',['stage','name','body'],null));
  const future=card('التعلّم والتواصل');addFields(future,prefix,['nextLearning','contactTitle','contactBody']);frag.append(future);return frag;
}
function projects(){
  const layout=node('div','project-layout'),list=node('div','project-list'),editor=node('div','project-editor'),rows=state.data.projects;
  state.selected=Math.max(0,Math.min(state.selected,rows.length-1));
  rows.forEach((p,i)=>{
    const b=button('',()=>{state.selected=i;render();},'project-choice');b.setAttribute('aria-pressed',String(i===state.selected));
    const text=node('span');text.append(node('strong','',p[state.language].name||'مشروع بلا عنوان'),node('small','',p[state.language].status||'الحالة غير محددة'));
    b.append(node('span','project-number',String(i+1).padStart(2,'0')),text);list.append(b);
  });
  const add=button('＋ إضافة مشروع',()=>{rows.push(emptyProject('project-'+Date.now().toString(36)));state.selected=rows.length-1;changed();render();});add.disabled=rows.length>=30;list.append(add);
  layout.append(list,editor);
  if(!rows.length){editor.append(node('div','empty','لا توجد مشاريع في المسودة. أضف مشروعك الأول.'));return layout;}
  const i=state.selected,common=card('بيانات المشروع المشتركة'),head=node('div','card-heading'),actions=node('div','row-actions');
  const up=button('تقديم ↑',()=>{[rows[i-1],rows[i]]=[rows[i],rows[i-1]];state.selected--;changed();render();});up.disabled=i===0;
  const down=button('تأخير ↓',()=>{[rows[i+1],rows[i]]=[rows[i],rows[i+1]];state.selected++;changed();render();});down.disabled=i===rows.length-1;
  actions.append(up,down,button('حذف',()=>confirmAction('حذف المشروع من المسودة؟ يبقى مستودعه الأصلي كما هو، ولن يختفي من الموقع حتى تنشر.',()=>{rows.splice(i,1);changed();render();}),'button danger'));head.append(node('small','','ترتيب العرض: '+(i+1)),actions);common.append(head);
  const grid=node('div','field-grid');grid.append(field(['projects',i,'id'],'معرّف ثابت للمشروع',{ltr:true,hint:'حروف إنجليزية صغيرة وأرقام وشرطات فقط.'}),field(['projects',i,'repo'],'رابط المستودع',{ltr:true}),field(['projects',i,'source'],'رابط ملف الكود المصدري',{ltr:true}),field(['projects',i,'tags'],'التقنيات المستخدمة',{lines:true,ltr:true}));
  common.append(grid);
  const translated=card('وصف المشروع — '+(state.language==='ar'?'العربية':'English'),'صف ما نفّذته فعليًا، واذكر ما يزال قيد التطوير.');
  addFields(translated,['projects',i,state.language],['name','category','status','complexity','description','features','learning','limitations']);editor.append(common,translated);return layout;
}
function preview(){
  const wrap=node('div'),errors=validateContent(state.data.profile,state.data.projects);
  if(errors.length){wrap.append(node('p','notice error','أكمل الحقول التالية قبل المعاينة:'),errorList(errors));return wrap;}
  const controls=node('div','preview-tools');
  for(const [key,options] of [['previewSize',[['desktop','حاسوب'],['mobile','هاتف']]],['previewTheme',[['light','فاتح'],['dark','داكن']]]]){
    const group=node('div','segmented');for(const [value,label] of options){const b=button(label,()=>{state[key]=value;render();},'');b.setAttribute('aria-pressed',String(state[key]===value));group.append(b);}controls.append(group);
  }
  const stage=node('div','preview-stage');stage.dataset.size=state.previewSize;
  const frame=node('iframe');frame.title='معاينة البورتفوليو قبل النشر';frame.setAttribute('sandbox','allow-same-origin');
  const doc=new DOMParser().parseFromString(renderPage(state.data.profile,state.data.projects,state.language),'text/html');
  doc.querySelectorAll('script').forEach(s=>s.remove());
  // Match the public page's initialized layout without running its scripts.
  doc.documentElement.classList.add('js');
  doc.documentElement.dataset.theme=state.previewTheme;
  for(const e of doc.querySelectorAll('[href],[src]')){
    for(const attr of ['href','src'])if(e.hasAttribute(attr)&&e.getAttribute(attr).includes('assets/'))e.setAttribute(attr,new URL('../assets/'+e.getAttribute(attr).split('assets/')[1],location.href).href);
  }
  frame.srcdoc='<!doctype html>'+doc.documentElement.outerHTML;stage.append(frame);
  wrap.append(controls,stage,node('p','preview-note','هذه معاينة للمظهر؛ أزرار الموقع داخلها غير مفعلة. اختر لغة المحتوى أعلاه لمعاينة النسخة الأخرى.'));return wrap;
}
function download(name,value){
  const blob=new Blob([serialize(value)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function backup(){
  const frag=document.createDocumentFragment(),exportCard=card('تنزيل نسخة احتياطية','احفظ نسخة من محتواك الحالي قبل إجراء تغييرات كبيرة.'),actions=node('div','backup-actions');
  actions.append(button('تنزيل النسخة الكاملة',()=>download('portfolio-content.json',state.data)),button('تنزيل profile.json',()=>download('profile.json',state.data.profile)),button('تنزيل projects.json',()=>download('projects.json',state.data.projects)));exportCard.append(actions);
  const importCard=card('استيراد بيانات','يمكن استيراد النسخة الكاملة، أو ملف profile.json، أو ملف projects.json. لا يُنشر الملف تلقائيًا.'),box=node('div','import-box'),input=node('input');input.type='file';input.accept='.json,application/json';input.id='import-file';const label=node('label','','اختيار ملف JSON');label.htmlFor=input.id;box.append(label,input);
  input.addEventListener('change',async()=>{
    const f=input.files[0];if(!f)return;
    try{
      if(f.size>500000)throw Error('الملف أكبر من الحد المسموح: 500 كيلوبايت.');
      const parsed=JSON.parse(await f.text()),candidate=clone(state.data);
      if(Array.isArray(parsed))candidate.projects=parsed;
      else if(parsed?.profile&&Array.isArray(parsed.projects)){candidate.profile=parsed.profile;candidate.projects=parsed.projects;}
      else if(parsed?.en&&parsed?.ar)candidate.profile=parsed;
      else throw Error('الملف لا يطابق بنية البيانات المطلوبة.');
      const errors=validateContent(candidate.profile,candidate.projects);if(errors.length)throw Error(errors.slice(0,8).join('\n'));
      confirmAction('استبدال البيانات المقابلة في المسودة بمحتوى الملف المستورد؟',()=>{state.data=candidate;changed();render();notice('تم استيراد البيانات إلى المسودة. عاينها قبل النشر.');});
    }catch(e){notice('تعذّر الاستيراد: '+e.message,true);}finally{input.value='';}
  });
  importCard.append(box);
  const reset=card('العودة إلى النسخة المحمّلة','يلغي تعديلات هذه المسودة ويعيد المحتوى إلى آخر نسخة حمّلتها.'),resetButton=button('إلغاء تعديلات المسودة',()=>confirmAction('إلغاء تعديلات المسودة الحالية؟ يمكنك تنزيل نسخة احتياطية أولًا.',()=>{state.data={profile:clone(state.baseline.profile),projects:clone(state.baseline.projects)};saveDraft();render();notice('عادت المسودة إلى النسخة المحمّلة.');}),'button danger');reset.append(resetButton);frag.append(exportCard,importCard,reset);return frag;
}
function errorList(errors){const list=node('ul','validation-list');for(const error of errors)list.append(node('li','',error));return list;}
const titles={overview:['محتواك، تحت السيطرة.','عدّل، عاين، ثم انشر. كل خطوة في مكان واحد.'],profile:['ملفك الشخصي.','نصوص واضحة تعكس خبرتك ومسارك المهني.'],projects:['مساحة مشاريعك.','الأعمال الفعلية، بالترتيب والوصف المناسبين.'],preview:['شاهد النتيجة أولًا.','عاين مسودتك قبل أن يراها زوّار موقعك.'],backup:['نسخة ترجع إليها.','تنزيل البيانات واستيرادها وإدارة المسودة.']};
function render(){
  if(!state.data)return;
  $('#page-title').textContent=titles[state.view][0];$('#page-description').textContent=titles[state.view][1];
  $('#language-control').hidden=!['profile','projects','preview'].includes(state.view);
  for(const b of document.querySelectorAll('[data-view]')){if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
  for(const b of document.querySelectorAll('[data-language]'))b.setAttribute('aria-pressed',String(b.dataset.language===state.language));
  $('#content').replaceChildren(({overview,profile,projects,preview,backup})[state.view]());refreshState();
}
async function reload(){
  clearTimeout(state.timer);
  state.busy=true;refreshState('جارٍ تحميل آخر نسخة…');
  try{
    state.baseline=await loadRepository();state.data={profile:clone(state.baseline.profile),projects:clone(state.baseline.projects)};
    saveDraft();$('#draft-banner').hidden=true;
    notice('تم تحميل آخر نسخة من المستودع.');render();
  }catch(e){notice(e.message,true);}finally{state.busy=false;refreshState();}
}
function review(){
  if(state.busy)return;
  const errors=validateContent(state.data.profile,state.data.projects);
  if(errors.length){notice('تحتاج البيانات إلى تصحيح قبل النشر:\n'+errors.slice(0,14).join('\n'),true);window.scrollTo({top:0,behavior:'smooth'});return;}
  notice('');
  const summary=$('#change-summary');summary.replaceChildren();
  const paths=changedPaths({profile:state.baseline.profile,projects:state.baseline.projects},state.data);
  summary.append(node('strong','','الأجزاء المعدّلة: '+paths.length));const list=node('ul');
  for(const path of paths){const li=node('li'),text=node('bdi','',path);li.append(text);list.append(li);}summary.append(list);
  const needsEmail=state.data.profile.contactEmail&&state.data.profile.contactEmail!==state.baseline.profile.contactEmail;
  $('#email-consent-row').hidden=!needsEmail;$('#email-consent').checked=false;
  $('#github-token').value='';$('#publish-status').textContent='';$('#publish-status').className='';
  $('#publish-dialog').showModal();
}
async function publish(){
  if(state.busy)return;
  let token=$('#github-token').value.trim();$('#github-token').value='';
  state.busy=true;refreshState();$('#publish').disabled=true;
  for(const b of document.querySelectorAll('[data-close="publish-dialog"]'))b.disabled=true;
  const status=$('#publish-status');status.className='';
  try{
    const result=await publishContent({baseline:clone(state.baseline),profile:clone(state.data.profile),projects:clone(state.data.projects),token,approveEmail:$('#email-consent').checked,onProgress:message=>status.textContent=message});
    state.baseline=result;saveDraft();$('#publish-dialog').close();render();
    notice('حُفظت التعديلات في GitHub بنجاح. تحديث الموقع عبر Pages قيد المعالجة وقد يستغرق بضع دقائق.');
    $('#notice').append(link('متابعة النشر على GitHub','https://github.com/'+REPOSITORY+'/actions','published-link'));
  }catch(e){status.className='error-text';status.textContent=e.message+'\nتعديلاتك ما زالت في المحرر. بعد معالجة السبب أدخل الرمز مجددًا للمحاولة.';saveDraft();}
  finally{token='';state.busy=false;$('#publish').disabled=false;for(const b of document.querySelectorAll('[data-close="publish-dialog"]'))b.disabled=false;refreshState();}
}
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>chooseView(b.dataset.view));
for(const b of document.querySelectorAll('[data-language]'))b.addEventListener('click',()=>{state.language=b.dataset.language;render();});
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>{if(!state.busy)$('#'+b.dataset.close).close();});
$('#publish-dialog').addEventListener('cancel',e=>{if(state.busy)e.preventDefault();});
$('#publish-dialog').addEventListener('close',()=>{$('#github-token').value='';});
$('#save-draft').addEventListener('click',()=>saveDraft(true));$('#review').addEventListener('click',review);$('#publish').addEventListener('click',publish);
$('#reload').addEventListener('click',()=>{if(isDirty())confirmAction('تحميل آخر نسخة سيستبدل المسودة المفتوحة. نزّلها أولًا إن أردت الاحتفاظ بتعديلاتك.',reload);else reload();});
$('#restore-draft').addEventListener('click',()=>{state.data=clone(state.draft.data);state.baseline=clone(state.draft.baseline);$('#draft-banner').hidden=true;render();notice('استُعيدت المسودة. يُفحص وجود تعديلات أحدث في GitHub عند النشر.');});
$('#forget-draft').addEventListener('click',()=>confirmAction('حذف النسخة المحفوظة على هذا الجهاز فقط؟',()=>{try{localStorage.removeItem(STORAGE_KEY);state.draft=null;$('#draft-banner').hidden=true;}catch{notice('تعذّر حذف المسودة من تخزين المتصفح.',true);}}));
window.addEventListener('beforeunload',e=>{
  if(isDirty())saveDraft();
  if(state.busy||(state.storageFailed&&isDirty())){e.preventDefault();e.returnValue='';}
});
window.addEventListener('pagehide',()=>{if(isDirty())saveDraft();});
async function boot(){
  try{
    let fallback=null;
    try{const r=await fetch('./snapshot.json',{cache:'no-store'});if(!r.ok)throw Error();fallback=await r.json();}catch{}
    try{state.baseline=await loadRepository();}
    catch(e){
      if(!fallback)throw e;
      const errors=validateContent(fallback.profile,fallback.projects);if(errors.length)throw Error('ملف البيانات المنشور غير صالح.');
      state.baseline={...fallback,head:null,tree:null};
      notice('تم تحميل النسخة المرفقة بالموقع. تعذّر تحديثها من GitHub الآن؛ ستُقارن بأحدث نسخة قبل النشر.');
    }
    state.data={profile:clone(state.baseline.profile),projects:clone(state.baseline.projects)};
    // Optional display settings remain compatible with backups made before the editor.
    for(const target of [state.data.profile,state.baseline.profile]){target.experienceYears??='5+';target.experienceOrg??='IYD';}
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(saved?.version===1&&saved.data&&saved.baseline&&!validateContent(saved.data.profile,saved.data.projects,{draft:true}).length&&!validateContent(saved.baseline.profile,saved.baseline.projects).length){state.draft=saved;$('#draft-banner').hidden=false;}
    }catch{}
    render();
  }catch(e){notice('تعذّر تجهيز المحرر: '+e.message,true);$('#content').replaceChildren(node('p','empty','يمكنك إعادة تحميل الصفحة للمحاولة مجددًا.'));}
}
boot();
