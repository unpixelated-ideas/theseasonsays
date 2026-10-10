import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try{
 const page=await browser.newPage({timezoneId:'America/New_York'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-10T16:00:00Z')});
 await page.goto('http://127.0.0.1:5173/#complete');
 await page.locator('#year').waitFor();assert.equal(await page.locator('#year').inputValue(),'2026');
 assert.equal(await page.locator('.timeline-today').count(),1);
 await page.locator('#timeline-next').click();assert.equal(await page.locator('#year').inputValue(),'2027');assert.equal(await page.locator('.timeline-today').count(),0);
 await page.locator('#timeline-current').click();assert.equal(await page.locator('#year').inputValue(),'2026');
 for(const year of ['2024','2028']){await page.locator('#year').selectOption(year);assert.equal(await page.locator(year==='2024'?'#timeline-previous':'#timeline-next').isDisabled(),true);}
 await page.locator('#year').selectOption('2026');
 for(const lang of ['en','ko','ga'])for(const mode of ['light','dark'])for(const width of [320,768,1440]){
  await page.locator('#language').selectOption(lang);await page.locator('#appearance').selectOption(mode);await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('.timeline-entry').count(),31);
 }
 await page.locator('[data-period="halloween"] a').click();assert.equal(await page.locator('#calendar-date').inputValue(),'2026-10-01');assert.ok(page.url().includes('/ga/'));
 await page.reload();assert.equal(await page.locator('#calendar-date').inputValue(),'2026-10-01');
 await page.locator('#date-slider').fill('290');assert.ok(!page.url().includes('?date='));
 await page.locator('footer a[href="#complete"]').click();assert.equal(await page.locator('#year').inputValue(),'2026');
 await page.locator('#language').selectOption('en');await page.locator('#appearance').selectOption('light');await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/tmp/timeline-desktop.png'});
 await page.locator('#appearance').selectOption('dark');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/timeline-mobile.png'});
 assert.deepEqual(errors,[]);console.log('Timeline browser checks passed');
}finally{await browser.close();}
