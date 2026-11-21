// Exercise actual language switching and image-preload code for each generated page.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const code=fs.readFileSync(path.join(root,'i18n.js'),'utf8');
const catalog={};vm.runInNewContext(code.split('const languageAliases')[0].replace('const messages =','messages ='),catalog);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/image-manifest.json'),'utf8'));
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^\"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const routing=code.slice(code.indexOf('const languageAliases'),code.indexOf('const languageControl'));
const apply=code.slice(code.indexOf('function applyLanguage('),code.indexOf('async function fadeLanguageContent('));
const prepare=code.slice(code.indexOf('async function prepareHeroImage('),code.indexOf('async function changeLanguage('));
for(const page of ['','faq','privacy','support','about','404']){
 const html=fs.readFileSync(path.join(root,'zh-hans-cn',page,'index.html'),'utf8').split('<!-- INLINE-JS:START -->')[0];
 const nodes=new Map();
 for(const m of html.matchAll(/<meta[^>]+>/g)){
  const a=attrs(m[0]),kind=a.name?'name':'property';if(a[kind])nodes.set(`meta[${kind}="${a[kind]}"]`,{content:a.content});
 }
 nodes.set('link[rel="canonical"]',{href:attrs(html.match(/<link rel="canonical"[^>]+>/)[0]).href});
 nodes.set('#language-current',{textContent:''});
 nodes.set('#site-schema',{textContent:html.match(/<script type="application\/ld\+json" id="site-schema">([\s\S]*?)<\/script>/)[1]});
 const images=[...html.matchAll(/<img[^>]+data-screenshot[^>]+>/g)].map(m=>{
  const a=attrs(m[0]),source={srcset:'',sizes:'100vw'};
  return {src:a.src,alt:a.alt,dataset:{screenshot:a['data-screenshot'],dimensions:a['data-dimensions'],resources:a['data-resources']},
   getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v},closest(){return {querySelector(){return source}}}};
 });
 const historyCalls=[],preloads=[];
 const context={messages:catalog.messages,URL,location:{href:`https://vorlinx.dekuan.org/zh-hans-cn/${page?page+'/':''}`},
  document:{documentElement:{lang:'zh-Hans-CN'},body:{dataset:{page}},querySelectorAll(s){return s==='[data-screenshot]'?images:[]},querySelector(s){return s==='.hero-shot [data-screenshot]'?images[0]||null:nodes.get(s)}},
  languageOptions:[],languageNames:{'en-US':'English','zh-Hans-CN':'简体中文','zh-Hant-TW':'繁體中文'},intro:null,renderLocalizedText(){},
  history:{replaceState(...args){historyCalls.push(args)}},Image:class {decode(){preloads.push(this);return Promise.resolve()}}};
 vm.createContext(context);vm.runInContext(routing+apply+prepare,context);
 for(const language of Object.keys(catalog.messages)){
  context.applyLanguage(language);await context.prepareHeroImage(language);
  const copy=catalog.messages[language],expectedDescription=page==='404'?copy.error404Body:page?copy[page+'Description']:copy.seoDescription;
  assert.equal(nodes.get('meta[name="description"]').content,expectedDescription);
  assert.equal(new URL(nodes.get('link[rel="canonical"]').href).pathname,`/${language.toLowerCase()}/${page?page+'/':''}`);
  for(const image of images){const resource=manifest[language][image.dataset.screenshot];assert.equal(image.src,resource.src);assert.equal(image.width,resource.width);assert.equal(image.height,resource.height);assert.equal(image.closest().querySelector().srcset,resource.srcset);}
 }
 if(!page)assert.equal(preloads.length,3);
 if(page==='404')assert.equal(historyCalls.length,0);
}
console.log('PASS: 18 language/page switches: metadata, canonical paths, image variants, sizes, preloading and 404 URL preservation.');
