import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {site,supportedLanguages,languagePath,languageFromPath,canonicalURL} from '../src/config/site.js';
import {entryPage} from '../scripts/entry-page.mjs';
const template=await readFile(new URL('../index.html',import.meta.url),'utf8');
test('language paths support root and mounted hosting independently of preferences',()=>{
 for(const base of ['/','/theseasonsays/','/another/mount/'])for(const language of supportedLanguages){
  assert.equal(languageFromPath(base+languagePath(language),base),language);
  assert.equal(languageFromPath(base+languagePath(language)+'index.html',base),language);
 }
 assert.equal(languagePath('en'),'');
});
for(const language of supportedLanguages)test(`raw ${language} entry has localized crawler metadata and shared assets`,()=>{
 const html=entryPage(template,language);
 assert.ok(html.includes(`<html lang="${language}">`));
 assert.ok(html.includes(`<title>${site.productName[language]}</title>`));
 for(const [kind,name,value] of [
  ['name','description',site.metadataDescription[language]],
  ['property','og:title',site.productName[language]],
  ['property','og:site_name',site.productName[language]],
  ['property','og:description',site.metadataDescription[language]],
  ['property','og:type','website'],['property','og:url',canonicalURL(language)],
  ['name','twitter:title',site.productName[language]],
  ['name','twitter:description',site.metadataDescription[language]],
  ['name','twitter:card','summary_large_image'],
  ['name','twitter:image',new URL(site.previewImage,site.productionBaseURL).href],
  ['property','og:image',new URL(site.previewImage,site.productionBaseURL).href],
 ])assert.ok(html.includes(`<meta ${kind}="${name}" content="${value}">`),name);
 assert.ok(html.includes(`<link rel="canonical" href="${canonicalURL(language)}">`));
 for(const lang of [...supportedLanguages,'x-default'])assert.ok(html.includes(`hreflang="${lang}" href="${canonicalURL(lang==='x-default'?'en':lang)}"`));
 const prefix=language==='en'?'./':'../';
 assert.ok(html.includes(`href="${prefix}src/styles/main.css"`));
 assert.ok(html.includes(`src="${prefix}src/main.js"`));
 assert.ok(!html.includes('<base'));
});
test('metadata escapes HTML safely',()=>{
 const original=site.productName.en;
 try{site.productName.en='A & "B" <C>\'D';assert.ok(entryPage(template,'en').includes('A &amp; &quot;B&quot; &lt;C&gt;&#39;D'));}
 finally{site.productName.en=original;}
});
