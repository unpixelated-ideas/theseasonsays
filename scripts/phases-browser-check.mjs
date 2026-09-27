import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try {
 const page=await browser.newPage({timezoneId:'America/New_York'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173');await page.locator('#current-title').waitFor();
 const choose=async date=>{await page.locator('#calendar-button').click();await page.locator('#calendar-date').fill(date);await page.keyboard.press('Escape');};
 await choose('2026-12-31');
 assert.equal(await page.locator('#next-year').innerText(),'2027 →');assert.equal(await page.locator('#previous-year').isVisible(),false);
 await page.locator('#next-year').click();
 assert.equal(await page.locator('#calendar-date').inputValue(),'2027-01-01');assert.equal(await page.locator('#date-slider').inputValue(),'0');assert.equal(await page.locator('#slider-year').innerText(),'2027');assert.match(await page.locator('#full-date').innerText(),/January 1, 2027/);
 assert.match(await page.locator('.overlaps').innerText(),/Late Holiday Season/);
 await page.locator('#previous-year').click();assert.equal(await page.locator('#calendar-date').inputValue(),'2026-12-31');assert.equal(await page.locator('#date-slider').inputValue(),'364');
 await choose('2024-12-31');await page.locator('#next-year').click();await page.locator('#previous-year').click();assert.equal(await page.locator('#date-slider').inputValue(),'365');
 for(const [date,title] of [['2026-01-08','Early Winter'],['2026-02-20','Late Winter'],['2026-10-15','Halloween']]){await choose(date);assert.match(await page.locator('#current-title').innerText(),new RegExp(title));assert.equal(await page.locator('#previous-year').isVisible(),false);assert.equal(await page.locator('#next-year').isVisible(),false);}
 assert.match(await page.locator('.overlaps').innerText(),/Early to Mid Autumn/);
 for(const [date,control] of [['2024-01-01','#previous-year'],['2028-12-31','#next-year']]){await choose(date);assert.equal(await page.locator(control).isVisible(),false);}
 await choose('2026-12-31');
 for(const width of [320,390,768,1440])for(const mode of ['light','dark'])for(const lang of ['en','ko','ga']){
  await page.setViewportSize({width,height:1000});await page.locator('#appearance').selectOption(mode);await page.locator('#language').selectOption(lang);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.ok(await page.locator('#slider-help').isVisible());assert.ok(await page.locator('#next-year').isVisible());
  const help=await page.locator('#slider-help').boundingBox(),button=await page.locator('#next-year').boundingBox();assert.ok(help.x+help.width<=button.x);
 }
 await page.locator('#language').selectOption('en');await page.screenshot({path:'/tmp/season-phases-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/season-phases-mobile.png',fullPage:true});
 await page.locator('#open-update-log').click();const entry=page.locator('#update-log > ul > li').filter({hasText:'v0.5'});assert.equal(await entry.locator('.update-changes li').count(),3);
 assert.deepEqual(errors,[]);console.log('Phase and slider browser checks passed.');
} finally {await browser.close();}
