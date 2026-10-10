import assert from 'node:assert/strict';
import {legalPages} from '../src/i18n/legal.js';
import {messages} from '../src/i18n/messages.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.LEGAL_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try {
 const context=await browser.newContext();
 const page=await context.newPage();
 const errors=[],requests=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>requests.push(request.url()));
 page.on('response',response=>{if(response.status()>=400)failed.push(response.url());});
 for(const language of ['en','ko','ga']) {
  for(const route of ['privacy','terms']) {
   const url=new URL(`${language==='en'?'':language+'/'}#${route}`,base).href;
   await page.goto(url);
   await page.locator('.legal-copy').waitFor();
   await page.reload();
   await page.locator('.legal-copy').waitFor();
   assert.equal(await page.locator('html').getAttribute('lang'),language);
   assert.equal(await page.locator('h1').textContent(),messages[language][route]);
   assert.deepEqual(await page.locator('.legal-copy section p').allTextContents(),legalPages[language][route].map(section=>section[1]));
   assert.equal(await page.locator('.legal-copy .date-range').textContent(),legalPages[language].updated);
   for(const target of ['privacy','terms'])assert.equal(await page.locator(`footer a[href="#${target}"]`).textContent(),messages[language][target]);
   for(const mode of ['light','dark']) {
    await page.locator('#appearance').selectOption(mode);
    assert.equal(await page.locator('html').getAttribute('data-theme'),mode);
    for(const width of [390,1280]){
     await page.setViewportSize({width,height:900});
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     await page.screenshot({path:`/tmp/legal-${language}-${route}-${mode}-${width}.png`,fullPage:true});
    }
   }
   if(route==='privacy')assert.equal(await page.locator('.legal-copy a').getAttribute('href'),'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement');
   for(const next of ['ga','ko','en',language]){
    await page.locator('#language').selectOption(next);
    assert.equal(new URL(page.url()).hash,`#${route}`);
    assert.equal(await page.locator('h1').textContent(),messages[next][route]);
   }
   await page.locator('.back').click();await page.locator('#date-slider').waitFor();
   assert.equal(await page.locator('html').getAttribute('lang'),language);
   await page.locator(`footer a[href="#${route}"]`).click();await page.locator('.legal-copy').waitFor();
  }
 }
 assert.deepEqual(await context.cookies(),[]);
 assert.equal(await page.evaluate(()=>sessionStorage.length),0);
 assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).sort()),['guide-appearance','guide-language']);
 assert.ok(requests.every(url=>new URL(url).origin===new URL(base).origin));
 assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);
 console.log('Legal pages passed: all translations, direct URLs and refresh, language switching, footer and return links, desktop/mobile, light/dark, no external requests or cookies.');
} finally {await browser.close();}
