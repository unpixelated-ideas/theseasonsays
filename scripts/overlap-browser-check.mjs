import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try {
 const context=await browser.newContext({viewport:{width:1280,height:900},hasTouch:true});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5173');
 await page.locator('#current-title').waitFor();
 const date=async value=>{await page.locator('#calendar-button').click();await page.locator('#calendar-date').fill(value);await page.keyboard.press('Escape');};
 await date('2026-10-15');
 const buttons=page.locator('.overlap-button'), visible=page.locator('.overlap-popup:visible');
 assert.equal(await buttons.count(),10);
 await buttons.first().hover(); assert.equal(await visible.count(),1);
 assert.equal(await visible.innerText(),'Also in Autumn');
 await visible.hover(); await page.waitForTimeout(250); assert.equal(await visible.count(),1);
 await page.mouse.move(0,0);await page.waitForTimeout(250);assert.equal(await visible.count(),0);
 await buttons.first().focus();assert.equal(await visible.count(),1);
 await page.keyboard.press('Escape');assert.equal(await visible.count(),0);
 await page.keyboard.press('Enter');assert.equal(await visible.count(),1);
 await page.keyboard.press('Enter');assert.equal(await visible.count(),0);
 await buttons.first().click();assert.equal(await visible.count(),1);
 await buttons.nth(1).click();assert.equal(await visible.count(),1);
 await page.locator('#current-title').click();assert.equal(await visible.count(),0);
 for(const lang of ['ko','ga','en']) {
  await page.locator('#language').selectOption(lang);assert.equal(await visible.count(),0);
  assert.equal(await buttons.count(),10);await buttons.first().click();
  assert.match(await visible.innerText(),lang==='ko'?/에도 해당/:lang==='ga'?/Le linn.*freisin/:/Also in Autumn/);
 }
 await date('2026-11-15');assert.equal(await visible.count(),0);assert.equal(await buttons.count(),10);
 for(const mode of ['light','dark']) {
  await page.locator('#appearance').selectOption(mode);
  await page.setViewportSize({width:390,height:844});
  await buttons.first().tap();assert.equal(await visible.count(),1);
  const box=await visible.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390&&box.y>=0&&box.y+box.height<=844);
  assert.equal(await visible.evaluate(el=>getComputedStyle(el).boxShadow),'none');
  await buttons.first().tap();assert.equal(await visible.count(),0);
 }
 await buttons.first().tap();
 await date('2026-09-30');assert.equal(await visible.count(),0);
 assert.equal(await buttons.count(),0);
 await date('2026-11-27');
 for(const lang of ['en','ko','ga']) {
  await page.locator('#language').selectOption(lang);
  const warning=page.locator('.gray-area-button');
  assert.equal(await warning.count(),8);
  await warning.first().locator('xpath=ancestor::details').evaluate(el=>el.open=true);
  await warning.first().tap();assert.equal(await visible.count(),1);
  assert.match(await visible.innerText(),lang==='en'?/not prohibited, but not encouraged/:lang==='ko'?/금지되지는/:/níl cosc/);
  const box=await visible.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);
  await page.keyboard.press('Escape');assert.equal(await visible.count(),0);
  await warning.first().hover();assert.equal(await visible.count(),1);
  await visible.hover();await page.waitForTimeout(250);assert.equal(await visible.count(),1);
  await page.mouse.move(0,0);await page.waitForTimeout(250);
  await page.locator('#date-slider').focus();
  await warning.first().focus();assert.equal(await visible.count(),1);
  await page.keyboard.press('Escape');assert.equal(await visible.count(),0);
 }
 await date('2026-12-01');assert.equal(await page.locator('.gray-area-button').count(),0);
 assert.deepEqual(errors,[]);
 console.log('Overlap browser checks passed: hover bridge, focus, keyboard/touch toggles, single popup, outside/Escape/date/language dismissal, translations, mobile bounds, light/dark.');
} finally {await browser.close();}
