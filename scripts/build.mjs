import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {site} from '../src/config/site.js';
await mkdir('dist',{recursive:true});await cp('src','dist/src',{recursive:true});
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let html=await readFile('index.html','utf8');html=html.replace(/<title>[^<]*<\/title>/,`<title>${escape(site.productName.en)}</title>`).replace('name="description" content=""',`name="description" content="${escape(site.metadataDescription.en)}"`);await writeFile('dist/index.html',html);console.log('Static build ready in dist/');
