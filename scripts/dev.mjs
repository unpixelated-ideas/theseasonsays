import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.argv.includes('--dist')?'dist':'.');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.csv':'text/csv','.json':'application/json'};
http.createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403).end();return;}const target=path===root?resolve(root,'index.html'):path;res.setHeader('Content-Type',`${types[extname(target)]||'application/octet-stream'}; charset=utf-8`);res.setHeader('Cache-Control','no-store');res.end(await readFile(target));}catch{res.writeHead(404).end('Not found');}}).listen(5173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5173'));
