import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {site,supportedLanguages,languagePath} from '../src/config/site.js';
import {entryPage} from './entry-page.mjs';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('src','dist/src',{recursive:true});
await cp(site.previewImage,`dist/${site.previewImage}`);
for(const asset of ["favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png", "site.webmanifest"]) await cp(asset,`dist/${asset}`);
const template=await readFile('index.html','utf8');
for(const language of supportedLanguages){
 const directory=`dist/${languagePath(language)}`;
 await mkdir(directory,{recursive:true});
 await writeFile(`${directory}index.html`,entryPage(template,language));
}
console.log('Static build ready in dist/ (en, ko, ga)');
