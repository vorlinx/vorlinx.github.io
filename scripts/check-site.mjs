import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'i18n.js'),'utf8'),ctx={};
const documentHTML=p=>fs.readFileSync(p,'utf8').replace(/<!-- INLINE-JS:START -->[\s\S]*?<!-- INLINE-JS:END -->/g,'');
vm.runInNewContext(source.split('const languageAliases')[0].replace('const messages =','messages ='),ctx);
for(const language of config.languages){
 const html=documentHTML(path.join(root,language.toLowerCase(),'index.html'));
 assert.ok(html.includes(`<html lang="${language}"`));
 assert.ok(html.includes(ctx.messages[language].productDefinition));
 assert.ok(html.includes(ctx.messages[language].seoDescription));
 assert.ok(html.includes(`href="${config.baseUrl}${language.toLowerCase()}/"`));
 assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
 assert.equal((html.match(/id="site-schema"/g)||[]).length,1);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json" id="site-schema">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema['@graph'][1].operatingSystem,'macOS');
 assert.equal(schema['@graph'][1].inLanguage,language);
 assert.ok(!schema['@graph'][1].aggregateRating);
 for(const match of html.matchAll(/(?:src|href)="(\/(?!\/)[^"#]*)"/g)){
  const relative=match[1].split(/[?#]/)[0];
  const file=path.join(root,relative.endsWith('/')?relative+'index.html':relative);
  assert.ok(fs.existsSync(file),`${language}: missing ${relative}`);
 }
 for(const other of config.languages)assert.ok(html.includes(`hreflang="${other}"`));
 for(const match of html.matchAll(/<img[^>]*data-screenshot[^>]*>/g)){
  const tag=match[0],src=tag.match(/src="([^"]+)"/)[1];
  const data=fs.readFileSync(path.join(root,src.split('?')[0]));
  assert.equal(Number(tag.match(/width="(\d+)"/)[1]),data.readUInt32BE(16));
  assert.equal(Number(tag.match(/height="(\d+)"/)[1]),data.readUInt32BE(20));
  assert.ok(tag.includes('data-dimensions='));
 }
 assert.ok(html.includes('class="site-footer"'));
 assert.ok(!html.includes('class="footer-information shell"'));
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
}
// Exercise URL selection including legacy query links without a browser.
const routing=source.slice(source.indexOf('const languageAliases'),source.indexOf('const screenshotLabels'));
for(const [href,expected]of [
 ['https://vorlinx.dekuan.org/en-us/','en-US'],
 ['https://vorlinx.dekuan.org/zh-hant-tw/','zh-Hant-TW'],
 ['https://vorlinx.dekuan.org/','zh-Hans-CN'],
 ['https://vorlinx.dekuan.org/?lang=zh-TW','zh-Hant-TW']]){
 const context={URL,location:{href},document:{documentElement:{lang:'zh-Hans-CN'},body:{dataset:{}}}};
 vm.createContext(context);vm.runInContext(routing,context);
 assert.equal(context.languageFromURL(),expected);
 assert.equal(context.languagePath(expected),`/${expected.toLowerCase()}/`);
}
console.log('PASS: 3 crawlable static pages, shared assets, metadata, structured data and legacy/new language routing.');

for(const language of config.languages)for(const page of ['faq','privacy','support','about']){
 const html=documentHTML(path.join(root,language.toLowerCase(),page,'index.html'));
 assert.ok(html.includes(`data-page="${page}"`));
 assert.ok(html.includes(`href="${config.baseUrl}${language.toLowerCase()}/${page}/"`));
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.ok(!html.includes('class="hero-shot"'));
 for(const match of html.matchAll(/(?:src|href)="(\/(?!\/)[^"#]*)"/g)){
  const relative=match[1].split(/[?#]/)[0];
  assert.ok(fs.existsSync(path.join(root,relative.endsWith('/')?relative+'index.html':relative)),relative);
 }
}
console.log('PASS: 12 information pages, localized footer links, canonical URLs and shared assets.');

for(const language of config.languages)for(const page of ['', 'faq','privacy','support','about','404']){
 const file=path.join(root,language.toLowerCase(),page,'index.html'),raw=fs.readFileSync(file,'utf8'),html=documentHTML(file);
 assert.ok(!/<script[^>]+src=/.test(html));
 assert.ok(!/<link[^>]+rel="stylesheet"/.test(html));
 assert.equal((html.match(/<style id="site-styles">/g)||[]).length,1);
 const code=raw.match(/<script id="site-runtime">([\s\S]*?)<\/script>/)[1];new vm.Script(code);
 const expected=page==='404'?ctx.messages[language].error404Body:page?ctx.messages[language][page+'Description']:ctx.messages[language].seoDescription;
 assert.ok(html.includes(`<meta name="description" content="${expected}">`));
 if(page==='404')assert.ok(html.includes('noindex, follow'));
 for(const match of html.matchAll(/<source[^>]+srcset="([^"]+)"/g))for(const candidate of match[1].split(', '))assert.ok(fs.existsSync(path.join(root,candidate.split(' ')[0])));
}
assert.ok(fs.existsSync(path.join(root,'404.html')));
assert.ok(!fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('/404/'));
console.log('PASS: 18 self-contained pages, inline JS syntax, unique descriptions, responsive images and noindex 404.');
