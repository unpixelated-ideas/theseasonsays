import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||undefined});
try{
 const context=await browser.newContext({timezoneId:'America/New_York',permissions:['clipboard-read','clipboard-write'],viewport:{width:1440,height:1100}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.clock.install({time:new Date('2026-11-02T12:00:00-05:00')});
 const base=process.env.BASE_URL||'http://127.0.0.1:5173/';
 const copyLink=async selector=>{
  await page.locator('.item-share summary').press('Enter');
  await page.locator(selector).click();
  await page.getByRole('status').filter({hasText:'Link copied.'}).waitFor();
 };
 await page.goto(`${base}#home`);
 await page.locator('#current-title').waitFor().catch(async error=>{console.log(errors,await page.locator('body').innerText());throw error;});
 const music=page.getByRole('link',{name:'Holiday music',exact:true});
 assert.equal(await music.count(),1,await page.locator('main').innerText());
 await music.focus();assert.equal(await music.evaluate(el=>el.matches(':focus-visible')),true);assert.notEqual(await music.evaluate(el=>getComputedStyle(el).outlineStyle),'none');
 const decoration=await music.evaluate(el=>getComputedStyle(el).textDecorationLine);
 assert.equal(decoration,'none');await music.hover();assert.equal(await music.evaluate(el=>getComputedStyle(el).textDecorationLine),'underline');
 await music.click();await page.locator('#item-year').waitFor();
 assert.match(await page.locator('.item-verdict').innerText(),/Not allowed/);
 assert.match(await page.locator('.item-page').innerText(),/Black Friday through January 6/);
 assert.match(await page.locator('.item-page').innerText(),/November 27 – December 31/);
 assert.equal(await page.title(),'Holiday music · The Season Says');
 await copyLink('#copy-item');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),`${base}#item/holiday-music`);
 await page.reload();await page.locator('#item-year').waitFor();
 await page.locator('#item-year').selectOption('2027');assert.match(await page.locator('.item-page').innerText(),/November 26 – December 31/);
 assert.match(await page.locator('.item-verdict').innerText(),/November 2, 2026/);
 assert.equal(await page.locator('.item-date-marker').count(),0);
 await page.locator('#item-year').selectOption('2026');
 assert.equal(await page.locator('.item-date-marker').count(),1);
 for(const lang of ['ko','ga','en']){await page.locator('#language').selectOption(lang);await page.locator('#item-year').waitFor();assert.equal(new URL(page.url()).hash,'#item/holiday-music');assert.ok((await page.locator('.item-page h1').innerText()).length>0);}
 for(const [date,expected] of [['2026-11-26','Not allowed'],['2026-11-27','Allowed'],['2027-01-06','Allowed'],['2027-01-07','Not allowed']]){
  await page.goto(`${base}#item/holiday-music?date=${date}`);await page.locator('#item-year').waitFor();assert.ok((await page.locator('.item-verdict').innerText()).includes(`${expected} on`));
 }
 await copyLink('#copy-dated-item');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),`${base}#item/holiday-music?date=2027-01-07`);
 await copyLink('#copy-item');assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),`${base}#item/holiday-music`);
 await page.locator('.item-page .back').click();await page.locator('#current-title').waitFor();assert.equal(await page.locator('#calendar-date').inputValue(),'2027-01-07');
 await page.goBack();await page.locator('#item-year').waitFor();await page.goForward();await page.locator('#current-title').waitFor();
 await page.goto(`${base}#home?date=2026-10-18`);await page.locator('#current-title').waitFor();
 const before=page.url();await page.locator('.overlap-button').first().click();assert.equal(page.url(),before);assert.equal(await page.locator('.overlap-button').first().getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');
 await page.getByRole('link',{name:'Pumpkin spice',exact:true}).first().click();await page.locator('#item-year').waitFor();assert.equal(new URL(page.url()).hash,'#item/pumpkin-spice?date=2026-10-18');
 await page.goto(`${base}#item/pumpkin-spice?date=2026-11-27`);await page.locator('#item-year').waitFor();assert.match(await page.locator('.item-page').innerText(),/Not prohibited, but not encouraged/);
 await page.goto(`${base}#item/holiday-music?date=bad`);await page.locator('#item-year').waitFor();assert.match(await page.locator('.item-page').innerText(),/Invalid or unsupported date/);
 await page.goto(`${base}#item/no-such-item`);await page.locator('.information h1').waitFor();assert.match(await page.locator('.information h1').innerText(),/not found/i);
 const annualTitle={en:'Year at a glance',ko:'한눈에 보는 연간 일정',ga:'Sracfhéachaint ar an mbliain'};
 for(const lang of ['ko','ga','en']){
  await page.locator('#language').selectOption(lang);
  await page.goto(`${page.url().split('#')[0]}#item/pumpkin-spice?date=2026-11-27`);
  await page.getByRole('heading',{name:annualTitle[lang]}).waitFor();
  if(lang==='ga')assert.deepEqual(await page.locator('.item-axis span').allTextContents(),['Eanáir','Aibreán','Iúil','Deireadh Fómhair']);
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const mode of ['light','dark']){
    await page.locator('#appearance').selectOption(mode);
    assert.equal(await page.locator('html').getAttribute('data-theme'),mode);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await page.locator('.item-axis').evaluate(axis=>[...axis.children].every(tick=>
     tick.getBoundingClientRect().right<=axis.getBoundingClientRect().right+1 &&
     tick.getBoundingClientRect().bottom<=axis.getBoundingClientRect().bottom)));
    assert.equal(await page.locator('.item-legend li').count(),3);
    if(lang==='en')assert.deepEqual(await page.locator('.item-legend li > span').allTextContents(),[
     '66 days · 18.1% of the year','4 days · 1.1% of the year','295 days · 80.8% of the year',
    ]);
    const widths=await page.locator('.item-bar').evaluate(bar=>[bar.getBoundingClientRect().width,...[...bar.children].map(segment=>segment.getBoundingClientRect().width)]);
    assert.ok(Math.abs(widths[0]-widths.slice(1).reduce((sum,width)=>sum+width,0))<0.1);
    if([390,1440].includes(width))await page.screenshot({path:`/tmp/season-item-${lang}-${mode}-${width}.png`,fullPage:true});
   }
  }
 }
 const touchContext=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});const touch=await touchContext.newPage();await touch.goto(`${base}#home?date=2026-11-02`);await touch.locator('#current-title').waitFor();await touch.getByRole('link',{name:'Holiday music',exact:true}).tap();await touch.locator('#item-year').waitFor();assert.equal(new URL(touch.url()).hash,'#item/holiday-music?date=2026-11-02');await touchContext.close();
 assert.deepEqual(errors,[]);
 console.log('Item browser checks passed: dates, split cross-year windows, sharing, localization, history, exploratory links, errors, hover and mobile layout.');
}finally{await browser.close();}
