import assert from 'node:assert/strict';
import {aboutPages} from '../src/i18n/about.js';
import {messages} from '../src/i18n/messages.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.ABOUT_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try {
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)errors.push(response.url());});
 for(const language of ['en','ko','ga']) {
  await page.goto(new URL(`${language==='en'?'':language+'/'}?source=about-check#about`,base).href);
  await page.locator('.about-copy').waitFor();
  await page.reload();
  await page.locator('.about-copy').waitFor();
  for(const next of ['en','ko','ga',language]) {
   await page.locator('#language').selectOption(next);
   const copy=aboutPages[next];
   assert.equal(await page.locator('h1').textContent(),copy.heading);
   assert.equal(await page.locator('html').getAttribute('lang'),next);
   assert.deepEqual(await page.locator('.about-copy > p').allTextContents(),[copy.introduction,copy.creep,`${copy.mission} ${copy.guide}`,`${copy.moment} ${copy.patience}`]);
   assert.deepEqual(await page.locator('.about-copy strong').allTextContents(),[copy.mission,copy.patience]);
   assert.equal(await page.locator('.about-geography h2').textContent(),copy.geographyHeading);
   assert.equal(await page.locator('.about-geography p').textContent(),copy.geography);
   assert.equal(await page.locator('footer a[aria-current="page"]').textContent(),messages[next].about);
   assert.equal(new URL(page.url()).hash,'#about');
   assert.equal(new URL(page.url()).search,'?source=about-check');
  }
  for(const mode of ['light','dark']) {
   await page.locator('#appearance').selectOption(mode);
   assert.equal(await page.locator('html').getAttribute('data-theme'),mode);
   for(const width of [320,768,1280]) {
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`/tmp/about-${language}-${mode}-${width}.png`,fullPage:true});
   }
  }
  await page.locator('.back').click();
  await page.locator('#date-slider').waitFor();
  assert.equal(await page.locator('#language').inputValue(),language);
  await page.locator('footer a[href="#about"]').click();
  await page.locator('.about-copy').waitFor();
  await page.goBack();await page.locator('#date-slider').waitFor();
  await page.goForward();await page.locator('.about-copy').waitFor();
  await page.locator('.brand').click();await page.locator('#date-slider').waitFor();
  assert.equal(new URL(page.url()).search,'?source=about-check');
  assert.equal(await page.locator('#language').inputValue(),language);
 }
 assert.deepEqual(errors,[]);
 console.log('About checks passed: translations, emphasis, direct routes/reload, query preservation, language switching, navigation/history, responsive layouts and themes.');
} finally {await browser.close();}
