import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const profile = JSON.parse(await readFile(path.join(root, 'data/profile.json'), 'utf8'));
const projects = JSON.parse(await readFile(path.join(root, 'data/projects.json'), 'utf8'));
import { renderContentFiles } from '../src/content-renderer.js';
import { validateContent } from '../src/content-model.js';
const errors=validateContent(profile,projects);
if(errors.length)throw new Error(errors.join('\n'));
const out = path.join(root, 'docs');

await rm(out,{recursive:true,force:true});
await mkdir(path.join(out,'ar'),{recursive:true});
await cp(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
for(const f of ['style.css','app.js','theme-init.js'])await cp(path.join(root,'src',f),path.join(out,'assets',f));
await cp(path.join(root,'admin'),path.join(out,'admin'),{recursive:true});
for(const f of ['content-renderer.js','content-model.js'])await cp(path.join(root,'src',f),path.join(out,'admin',f));
for(const [file,content] of Object.entries(renderContentFiles(profile,projects)))await writeFile(path.join(root,file),content);
const e=value=>String(value).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
await writeFile(path.join(out,'.nojekyll'),'');
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${profile.siteUrl}/sitemap.xml\n`);
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(profile.siteUrl)}/</loc></url><url><loc>${e(profile.siteUrl)}/ar/</loc></url></urlset>`);
await writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found — Adnan Alosman</title><meta name="robots" content="noindex"><style>body{background:#f6f7f2;color:#19291f;font:20px system-ui;max-width:44rem;margin:15vh auto;padding:2rem}h1{font-size:3rem}a{color:#216546}p{line-height:1.7}</style><main><p>404 / ADNAN ALOSMAN</p><h1>This page isn’t here.</h1><p>The address may have changed.</p><a href="${profile.siteUrl}/">Back to the portfolio →</a><p lang="ar" dir="rtl">هذه الصفحة غير موجودة. <a href="${profile.siteUrl}/ar/">العودة إلى البورتفوليو</a></p></main></html>`);
console.log(`Built English and Arabic pages with ${projects.length} projects → docs/`);
