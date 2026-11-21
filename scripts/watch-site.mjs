#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function files(){
 const list=['index.html','style.css','app.js','i18n.js','site.config.json','scripts/build-site.mjs','scripts/prepare-images.mjs'];
 const config=JSON.parse(fs.readFileSync(path.join(root,'site.config.json'),'utf8'));
 for(const language of config.languages)for(const name of fs.readdirSync(path.join(root,'assets',language.toLowerCase())))if(name.endsWith('.png'))list.push(`assets/${language.toLowerCase()}/${name}`);
 return list;
}
function snapshot(){return new Map(files().map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));}
let previous=snapshot();
console.log('Watching source files; save changes, then refresh your browser.');
setInterval(()=>{
 try{
  const next=snapshot();
  if([...next].some(([file,hash])=>previous.get(file)!==hash)){
   execFileSync(process.execPath,[path.join(root,'scripts/build-site.mjs')],{stdio:'inherit'});
   // Ignore our generated root HTML, but do not swallow source edits made
   // while the child build was writing the other language pages.
   previous=next;
   previous.set('index.html',crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'index.html'))).digest('hex'));
  }
 }catch(error){console.error('Build failed:',error.message);}
},800);
