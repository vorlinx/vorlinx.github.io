#!/usr/bin/env node
// Generate crawlable language pages from index.html and the shared message catalog.
// No dependencies; all output is committed and GitHub Pages serves it directly.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const origin=new URL(config.baseUrl);
if(origin.protocol!=='https:' || origin.pathname!=='/' || origin.search || origin.hash) throw Error('baseUrl must be an HTTPS site origin ending in /.');
const context={};
vm.runInNewContext(fs.readFileSync(path.join(root,'i18n.js'),'utf8').split('const languageAliases')[0].replace('const messages =','messages ='),context);
const messages=context.messages;
function writeFile(file,content){
 if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content)fs.writeFileSync(file,content);
}
const source=fs.readFileSync(path.join(root,'index.html'),'utf8')
 .replace(/<!-- INLINE-CSS:START -->[\s\S]*?<!-- INLINE-CSS:END -->\s*/g,'')
 .replace(/<!-- INLINE-JS:START -->[\s\S]*?<!-- INLINE-JS:END -->\s*/g,'')
 .replace(/<link[^>]+rel="stylesheet"[^>]*>\s*/g,'')
 .replace(/<script[^>]+src="\/?(?:app|i18n)\.js"[^>]*><\/script>\s*/g,'')
 .replace(/<picture class="responsive-shot">[\s\S]*?(<img[^>]+data-screenshot[^>]*>)<\/picture>/g,'$1');
execFileSync(process.execPath,[path.join(root,'scripts/prepare-images.mjs')],{stdio:'inherit'});
const images=JSON.parse(fs.readFileSync(path.join(root,'assets/image-manifest.json'),'utf8'));
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const javascript=['app.js','i18n.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script')).join('\n');
const escape=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const url=p=>new URL(p,origin).href;
const languagePath=(l,page="")=>`/${l.toLowerCase()}/${page ? page+"/" : ""}`;
const labels={link:'heroImageLabel',groups:'groupsCaption',pdf:'pdfCaption',files:'filesCaption',reading:'readingCaption',search:'searchCaption',mcp:'mcpCaption',import:'importCaption',sharing:'sharingCaption',recipient:'recipientCaption',backup:'backupCaption'};
const names={'zh-Hans-CN':'简体中文','zh-Hant-TW':'繁體中文','en-US':'English'};
function imageDimensions(name){
 return Object.fromEntries(config.languages.map(language=>{
  const data=fs.readFileSync(path.join(root,'assets',language.toLowerCase(),name+'.png'));
  if(data.subarray(1,4).toString()!=='PNG')throw Error('Expected PNG: '+name);
  return [language,[data.readUInt32BE(16),data.readUInt32BE(20)]];
 }));
}
function renderImage(tag,name,language,copy){
 const dimensions=imageDimensions(name),resources=Object.fromEntries(config.languages.map(l=>[l,images[l][name]]));
 for(const l of config.languages){
  const actual=dimensions[l],item=resources[l];
  if(item.width!==actual[0] || item.height!==actual[1])throw Error('Run prepare-images.mjs after replacing screenshots.');
 }
 const item=resources[language],sizes=name==='link'?'(max-width: 700px) calc(100vw - 56px), (max-width: 1000px) calc(100vw - 96px), (max-width: 1500px) calc(100vw - 160px), 1320px'
  :name==='search'?'(max-width: 700px) calc(100vw - 72px), 760px':'(max-width: 700px) calc(100vw - 72px), (max-width: 1000px) 50vw, 620px';
 const img=tag.replace(/src="[^"]+"/,`src="${item.src}"`)
  .replace(/alt="[^"]*"/,`alt="${escape(copy[labels[name]])}"`)
  .replace(/width="[^"]*"/,`width="${item.width}"`).replace(/height="[^"]*"/,`height="${item.height}"`)
  .replace(/ data-(?:dimensions|resources)="[^"]*"/g,'')
  .replace(/>$/,` data-dimensions="${escape(JSON.stringify(dimensions))}" data-resources="${escape(JSON.stringify(resources))}">`);
 return `<picture class="responsive-shot"><source type="image/webp" srcset="${item.srcset}" sizes="${sizes}">${img}</picture>`;
}
const pages=['','faq','privacy','support','about','404'];
const pageKeys={faq:'pageFaqTitle',privacy:'pagePrivacyTitle',support:'pageSupportTitle',about:'pageAboutTitle','404':'page404Title'};
function information(copy,page){
 const p=key=>`<p data-i18n="${key}">${escape(copy[key])}</p>`;
 const pair=key=>`<h2 data-i18n="${key}Q">${escape(copy[key+'Q'])}</h2>`+p(key+'A');
 const body=page==='404' ? p('error404Body') : page==='faq' ? ['faqLocal','faqModels','faqStart','faqSystem','faqShare','faqBackup'].map(pair).join('')+p('backupRoadmap')
  :page==='privacy' ? p('policyIntro')+['policyCollection','policyLocal','policyPermissions','policyNetwork','policySharing','policyBackup','policyRetention','policyContact'].map(pair).join('')
  :page==='support' ? pair('supportDownload')+p('supportRecommended')+'<section id="contact">'+pair('supportContact')+'</section><h2 data-i18n="footerLicense">'+escape(copy.footerLicense)+'</h2>'+p('licenseBody')+'<p><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" data-i18n="licenseLink">'+escape(copy.licenseLink)+'</a></p>'
  :'<h2 data-i18n="aboutTitle">'+escape(copy.aboutTitle)+'</h2>'+p('aboutBody')+p('productDefinition');
 return `<main class="information-page shell"><a class="back-home" href="/zh-hans-cn/" data-page-link="" data-i18n="backHome">${escape(copy.backHome)}</a><h1 data-i18n="${pageKeys[page]}">${escape(copy[pageKeys[page]])}</h1><article>${body}</article></main>`;
}
function render(language,page=''){
 const copy=messages[language],canonical=url(languagePath(language,page));
 let template=source;
 if(page)template=template.replace(/<main>[\s\S]*?<\/main>/,information(copy,page)).replace('<body>',`<body data-page="${page}">`);
 let html=template.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->\s*/,'')
  .replace(/\s*<title>[\s\S]*?<\/title>/,'')
  .replace(/\s*<meta name="description"[^>]*>/,'')
  .replace(/<html lang="[^"]+"/,`<html lang="${language}"`)
  .replace(/(<([a-z][a-z0-9]*)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/gi,(_,open,tag,key,close)=>{
    if(copy[key]===undefined)throw Error(`Missing ${language}/${key}`);
    return open+(Array.isArray(copy[key])?copy[key]:[copy[key]]).map(escape).join('<br>')+close;
  })
  .replace(/<[^>]+data-i18n-aria="([^"]+)"[^>]*>/g,(tag,key)=>tag.replace(/aria-label="[^"]*"/,`aria-label="${escape(copy[key])}"`))
  .replace(/(<span id="language-current">)[\s\S]*?(<\/span>)/,`$1${names[language]}$2`)
  .replace(/<a[^>]+data-language="([^"]+)"[^>]*>/g,(tag,l)=>tag.replace(/aria-checked="[^"]+"/,`aria-checked="${l===language}"`).replace(/href="[^"]+"/,`href="${languagePath(l,page)}"`))
  .replace(/<a[^>]+data-page-link="([^"]*)"[^>]*>/g,(tag,target)=>tag.replace(/href="[^"]+"/,`href="${languagePath(language,target)}"`))
  .replace(/<img[^>]+data-screenshot="([^"]+)"[^>]*>/g,(tag,name)=>renderImage(tag,name,language,copy))
  .replace(/(src|href)="(assets\/[^" ]+|(?:app|i18n)\.js|(?:base|canvas|layout|style)\.css)"/g,'$1="/$2"');
 const title=page ? copy[pageKeys[page]]+" | Vorlinx" : copy.seoTitle,description=page==='404'?copy.error404Body:page?copy[page+'Description']:copy.seoDescription,image=url(images[language].link.src);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebSite','@id':url('/#website'),name:'Vorlinx',url:url(languagePath(language)),inLanguage:language},
  {'@type':'SoftwareApplication','@id':url('/#software'),name:'Vorlinx',url:canonical,operatingSystem:'macOS',applicationCategory:'UtilitiesApplication',description,inLanguage:language,screenshot:image}
 ]};
 if(page) schema['@graph'][1]={'@type':'WebPage','@id':canonical+'#page',name:copy[pageKeys[page]],url:canonical,inLanguage:language,description};
 const meta=[`<title>${escape(title)}</title>`,`<meta name="description" content="${escape(description)}">`,`<meta name="robots" content="${page==='404'?'noindex, follow':'index, follow'}">`,`<link rel="canonical" href="${canonical}">`,
 ...config.languages.map(l=>`<link rel="alternate" hreflang="${l}" href="${url(languagePath(l,page))}">`),`<link rel="alternate" hreflang="x-default" href="${page ? url(languagePath(config.defaultLanguage,page)) : url('/')}">`,
 ...Object.entries({'og:type':'website','og:site_name':'Vorlinx','og:title':title,'og:description':description,'og:url':canonical,'og:image':image,'og:locale':language==='en-US'?'en_US':language==='zh-Hant-TW'?'zh_TW':'zh_CN'}).map(([property,content])=>`<meta property="${property}" content="${escape(content)}">`),
 ...Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image}).map(([name,content])=>`<meta name="${name}" content="${escape(content)}">`),
 `<script type="application/ld+json" id="site-schema">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`];
 html=html.replace('</head>',`<!-- INLINE-CSS:START -->\n<style id="site-styles">${css}</style>\n<!-- INLINE-CSS:END -->\n</head>`).replace('</body>',`<!-- INLINE-JS:START -->\n<script id="site-runtime">${javascript}</script>\n<!-- INLINE-JS:END -->\n</body>`);
 return html.replace('</head>',`<!-- SEO:START -->\n  ${meta.join('\n  ')}\n  <!-- SEO:END -->\n</head>`);
}
for(const page of pages)for(const language of config.languages){
 const dir=path.join(root,language.toLowerCase(),page);fs.mkdirSync(dir,{recursive:true});writeFile(path.join(dir,'index.html'),render(language,page));
}
writeFile(path.join(root,'index.html'),render(config.defaultLanguage));
writeFile(path.join(root,'404.html'),render(config.defaultLanguage,'404'));
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${pages.filter(page=>page!=='404').flatMap(page=>config.languages.map(l=>`  <url>\n    <loc>${url(languagePath(l,page))}</loc>\n${config.languages.map(other=>`    <xhtml:link rel="alternate" hreflang="${other}" href="${url(languagePath(other,page))}"/>`).join('\n')}\n  </url>`)).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`);
console.log('Generated inline HTML for 18 localized pages + root + 404, sitemap.xml and robots.txt.');
