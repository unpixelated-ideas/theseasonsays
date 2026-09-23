import assert from 'node:assert/strict';
import {site,languagePath} from '../src/config/site.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5173');
 await page.locator('#current-title').waitFor();
 for(const language of ['en','ko','ga']) {
  await page.locator('#language').selectOption(language);
  for(const route of ['home','about','privacy','terms','feedback','complete','missing']) {
   await page.goto(`http://127.0.0.1:5173/${languagePath(language)}#${route}`);
   await page.locator('.brand').waitFor();
   assert.equal(await page.title(),site.productName[language]);
   assert.equal(await page.locator('.brand').innerText(),site.productName[language]);
   assert.equal(await page.locator('.masthead p').innerText(),site.tagline[language]);
   assert.equal(await page.locator('html').getAttribute('lang'),language);
   assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),site.metadataDescription[language]);
   if(await page.locator('.information').count())assert.equal(await page.locator('.information .eyebrow').textContent(),site.productName[language]);
  }
  await page.reload();await page.locator('.brand').waitFor();
  assert.equal(await page.title(),site.productName[language]);
  // A data-load failure must still use the URL language's product title.
  await page.route('**/src/data/calendar.csv',route=>route.fulfill({status:500,body:''}));
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#app').textContent.length>0);
  assert.equal(await page.title(),site.productName[language]);
  await page.unroute('**/src/data/calendar.csv');
  await page.goto('http://127.0.0.1:5173');await page.locator('#current-title').waitFor();
 }
 assert.deepEqual(errors,[]);
 console.log('Branding checks passed: all languages, routes, metadata, unchanged taglines, reload persistence, and data-error titles.');
} finally {await browser.close();}
