// Optional integration check: point PLAYWRIGHT_MODULE at an installed Playwright module.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
const context=await browser.newContext({timezoneId:'America/New_York',viewport:{width:1440,height:1100}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install({time:new Date('2026-09-08T21:14:37-04:00')});
await page.goto('http://127.0.0.1:5173');await page.locator('#current-title').waitFor();
assert.match(await page.locator('#full-date').innerText(),/September 8, 2026/);
const clock=await page.locator('#clock').innerText();await page.clock.runFor(1000);assert.notEqual(await page.locator('#clock').innerText(),clock);
await page.screenshot({path:'/tmp/seasonal-desktop.png',fullPage:true});
assert.match(await page.locator('.primary > .eyebrow').innerText(),/Right now/i);
await page.locator('#calendar-button').click();await page.locator('#full-date').click();assert.equal(await page.locator('#date-popover').isVisible(),false);assert.equal(await page.locator('#calendar-button').getAttribute('aria-expanded'),'false');
await page.locator('#calendar-button').click();await page.locator('#calendar-date').fill('2026-12-25');assert.match(await page.locator('.primary > .eyebrow').innerText(),/On this date/i);await page.keyboard.press('Escape');

await page.locator('#calendar-button').click();await page.locator('#calendar-date').fill('2024-02-29');assert.equal(await page.locator('#date-slider').getAttribute('max'),'365');assert.equal(await page.locator('#date-slider').inputValue(),'59');assert.match(await page.locator('#date-state').innerText(),/Exploring/i);assert.match(await page.locator('.primary > .eyebrow').innerText(),/On this date/i);assert.equal(await page.locator('#clock').isVisible(),false);assert.equal(await page.locator('#timezone').isVisible(),false);
// Verify the imported leap-day palette reaches all three visible page colors.
for(const mode of ['light','dark']){
 await page.locator('#appearance').selectOption(mode);
 const result=await page.evaluate(async mode=>{
  const {parseColors}=await import('./src/lib/csv.js');
  const row=parseColors(await (await fetch('./src/data/daily-colors.csv')).text()).get('2-29');
  const rgb=hex=>`rgb(${hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')})`;
  return {actual:[getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.querySelector('#full-date')).color,getComputedStyle(document.querySelector('#date-slider')).accentColor],expected:['background','text','slider_accent'].map(k=>rgb(row[`${mode}_${k}`]))};
 },mode);
 assert.deepEqual(result.actual,result.expected);
}
await page.locator('#date-slider').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#calendar-date').inputValue(),'2024-03-01');await page.keyboard.press('Escape');
await page.locator('#appearance').selectOption('dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
for(const language of ['ko','ga','en']){await page.locator('#language').selectOption(language);await page.locator('#open-update-log').click();assert.equal(await page.locator('#update-log').isVisible(),true);assert.equal(await page.locator('#update-log > ul > li').count(),3);assert.match(await page.locator('#update-log').innerText(),language==='en'?/Initial build created/:language==='ko'?/최초 버전/:/Cruthaíodh/);await page.keyboard.press('Escape');assert.equal(await page.locator('#update-log').isVisible(),false);assert.equal(await page.locator('#open-update-log').evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('html').getAttribute('lang'),language);assert.ok((await page.locator('#current-title').innerText()).length>0);assert.match(await page.locator('#timezone').innerText(),/UTC−04:00/);if(language==='ko')assert.match(await page.locator('#timezone').innerText(),/북미 동부/);if(language==='ga'){assert.match(await page.locator('#timezone').innerText(),/Am Samhraidh/);assert.match(await page.locator('#full-date').innerText(),/Márta/);}}
await page.reload();await page.locator('#current-title').waitFor();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/seasonal-mobile-dark.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('#language').selectOption('ko');await page.screenshot({path:'/tmp/seasonal-mobile-ko.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.locator('#language').selectOption('ga');await page.setViewportSize({width:768,height:1024});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.equal(await page.locator('.footer-links [aria-disabled="true"]').count(),3);assert.equal(await page.locator('.footer-links a[href]').count(),2);await page.goto('http://127.0.0.1:5173/#complete');assert.ok(await page.locator('.annual-list article').count()>17);await page.locator('#year').selectOption('2024');assert.match(await page.locator('.reference .eyebrow').innerText(),/2024/);
for(const r of ['about','privacy','terms','feedback']){await page.goto(`http://127.0.0.1:5173/#${r}`);assert.ok((await page.locator('.information p').last().innerText()).length>30);}
await page.locator('.brand').click();await page.locator('#language').selectOption('en');
await page.clock.setSystemTime(new Date('2026-12-31T23:59:59-05:00'));await page.reload();await page.locator('#current-title').waitFor();await page.clock.runFor(2000);assert.match(await page.locator('#full-date').innerText(),/January 1, 2027/);assert.equal(await page.locator('#calendar-date').inputValue(),'2027-01-01');
await page.locator('#calendar-button').click();await page.locator('#calendar-date').fill('2026-10-31');await page.clock.setSystemTime(new Date('2027-01-02T00:00:01-05:00'));await page.clock.runFor(1000);assert.equal(await page.locator('#calendar-date').inputValue(),'2026-10-31');await page.locator('#return-today').click();assert.equal(await page.locator('#calendar-date').inputValue(),'2027-01-02');
await page.locator('#appearance').selectOption('system');await page.emulateMedia({colorScheme:'light'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');assert.equal(await page.locator('html').getAttribute('data-theme'),'light');await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
await page.route('**/src/config/site.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("en:'The Season Says'","en:'Test Almanac'")});});await page.reload();await page.locator('#current-title').waitFor();assert.equal(await page.title(),'Test Almanac');assert.equal(await page.locator('.brand').innerText(),'Test Almanac');
assert.deepEqual(errors,[]);console.log('Browser checks passed: clock, midnight, exploration, leap slider, keyboard, locales, themes, responsive widths, and footer routes.');await browser.close();
