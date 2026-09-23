import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {supportedLanguages,languagePath} from '../src/config/site.js';
import {entryPage} from './entry-page.mjs';
const built=process.argv.includes('--dist'),root=resolve(built?'dist':'.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.csv':'text/csv; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};
http.createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let target=resolve(root,'.'+pathname);
 if(!target.startsWith(root+sep)&&target!==root){res.writeHead(403).end();return;}
 res.setHeader('Cache-Control','no-store');
 const language=supportedLanguages.find(lang=>pathname===`/${languagePath(lang)}`||pathname===`/${languagePath(lang)}index.html`);
 if(!built&&language){res.setHeader('Content-Type',types['.html']);res.end(entryPage(await readFile(resolve(root,'index.html'),'utf8'),language));return;}
 if((await stat(target)).isDirectory()){
  if(!pathname.endsWith('/')){res.writeHead(301,{Location:pathname+'/'}).end();return;}
  target=resolve(target,'index.html');
 }
 res.setHeader('Content-Type',types[extname(target)]||'application/octet-stream');
 res.end(await readFile(target));
}catch{res.writeHead(404).end('Not found');}}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
