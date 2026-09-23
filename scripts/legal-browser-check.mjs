import assert from 'node:assert/strict';
import {legalPages} from '../src/i18n/legal.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try {
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5173');await page.locator('#current-title').waitFor();
 for(const language of ['en','ko','ga']) {
  await page.locator('#language').selectOption(language);
  for(const route of ['privacy','terms']) {
   await page.goto(`http://127.0.0.1:5173/#${route}`);
   await page.locator('.legal-copy').waitFor();
   assert.equal(await page.locator('.legal-copy section').count(),5);
   assert.equal(await page.locator('.legal-copy section p').first().textContent(),legalPages[language][route][0][1]);
   assert.ok(!(await page.locator('.legal-copy').innerText()).includes('placeholder'));
   for(const mode of ['light','dark']) {
    await page.locator('#appearance').selectOption(mode);
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   }
   if(route==='privacy')assert.equal(await page.locator('.legal-copy a').getAttribute('href'),'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement');
  }
 }
 await page.locator('.back').click();await page.locator('#date-slider').waitFor();
 assert.deepEqual(errors,[]);
 console.log('Legal pages passed: direct page navigation, English/Korean/Irish content, mobile light/dark, privacy source link, and return navigation.');
} finally {await browser.close();}
