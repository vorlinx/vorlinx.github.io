#!/usr/bin/env node
// Keep user PNG originals untouched. Derivatives have content-versioned names.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
const names=['link','groups','pdf','files','reading','search','mcp','import','sharing','recipient','backup'];
const manifest={};let created=0;
for(const language of config.languages){
 manifest[language]={};
 const locale=language.toLowerCase(),dir=path.join(root,'assets','optimized',locale);fs.mkdirSync(dir,{recursive:true});
 for(const name of names){
  const original=path.join(root,'assets',locale,name+'.png'),data=fs.readFileSync(original);
  const version=crypto.createHash('sha256').update(data).digest('hex').slice(0,12),width=data.readUInt32BE(16),height=data.readUInt32BE(20);
  const prefix=`/assets/optimized/${locale}/${name}-${version}`;
  const fallback=prefix+'.png';if(!fs.existsSync(path.join(root,fallback)))fs.copyFileSync(original,path.join(root,fallback));
  const variants=[...new Set([Math.min(720,width),Math.min(1080,width),width])].sort((a,b)=>a-b);
  const webp=variants.map(w=>{
   const file=prefix+`-${w}.webp`;
   if(!fs.existsSync(path.join(root,file))){
    const resize=w===width?[]:['-resize',String(w),String(Math.round(height*w/width))];
    execFileSync('cwebp',['-quiet','-lossless','-m','6',...resize,original,'-o',path.join(root,file)]);created++;
   }
   return `${file} ${w}w`;
  }).join(', ');
  manifest[language][name]={width,height,src:fallback,srcset:webp};
 }
}
fs.writeFileSync(path.join(root,'assets','image-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${names.length * config.languages.length} images; created ${created} lossless WebP variants. Original PNGs unchanged.`);
