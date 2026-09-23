import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {site,supportedLanguages,languagePath,canonicalURL} from '../src/config/site.js';
import {entryPage} from './entry-page.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const origin='http://127.0.0.1:5173';
 const template=await readFile('index.html','utf8');
 for(const language of supportedLanguages){
  const path=`/${languagePath(language)}`;
  const response=await page.request.get(origin+path);
  assert.equal(response.status(),200);
  assert.equal(await response.text(),entryPage(template,language));
  assert.equal(await readFile(`dist${path}index.html`,'utf8'),entryPage(template,language));
  for(const hash of ['','#privacy','#complete']){
   await page.goto(origin+path+hash);await page.locator('.brand').waitFor();
   await page.evaluate(lang=>localStorage.setItem('guide-language',lang),language==='en'?'ko':'en');
   await page.reload();await page.locator('.brand').waitFor();
   assert.equal(await page.locator('#language').inputValue(),language);
   assert.equal(await page.title(),site.productName[language]);
  }
 }
 const image=await page.request.get(origin+'/'+site.previewImage);
 assert.equal(image.headers()['content-type'],'image/png');
 assert.deepEqual(await image.body(),await readFile(site.previewImage));
 await page.goto(origin+'/#privacy');await page.locator('.brand').waitFor();
 await page.evaluate(()=>window.navigationMarker='same document');
 const check=async language=>{
  await page.waitForFunction(lang=>document.documentElement.lang===lang,language);
  assert.equal(new URL(page.url()).pathname,`/${languagePath(language)}`);
  assert.equal(new URL(page.url()).hash,'#privacy');
  assert.equal(await page.evaluate(()=>window.navigationMarker),'same document');
  assert.equal(await page.title(),site.productName[language]);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),canonicalURL(language));
  for(const name of ['og:title','og:site_name'])assert.equal(await page.locator(`meta[property="${name}"]`).getAttribute('content'),site.productName[language]);
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),canonicalURL(language));
  for(const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]'])assert.equal(await page.locator(selector).getAttribute('content'),site.metadataDescription[language]);
  assert.equal(await page.locator('meta[name="twitter:title"]').getAttribute('content'),site.productName[language]);
 };
 for(const language of ['ko','ga','en']){await page.locator('#language').selectOption(language);await check(language);}
 for(const language of ['ga','ko','en']){await page.goBack();await check(language);}
 for(const language of ['ko','ga','en']){await page.goForward();await check(language);}
 assert.deepEqual(errors,[]);
 console.log('Localization checks passed: raw served/built HTML, preview bytes/MIME, direct URLs, refresh, preference precedence, hash preservation, no reload, Back/Forward, live metadata.');
}finally{await browser.close();}
