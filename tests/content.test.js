import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {contentItems} from '../src/lib/content.js';
import {allowedItemsWithOverlaps} from '../src/lib/content.js';
import {grayAreaCopy} from '../src/i18n/overlaps.js';
import {parseCalendar,parseAnnual,activeOn} from '../src/lib/calendar.js';
import {currentCard} from '../src/components/views.js';
import {messages} from '../src/i18n/messages.js';
const rows=parseCalendar(readFileSync(new URL('../src/data/calendar.csv',import.meta.url),'utf8'));
test('Autumn transitions at Black Friday and December 1 in every language',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 for(const [year,friday] of [[2024,29],[2026,27],[2027,26]])for(const language of ['en','ko','ga']) {
  for(const [month,day,restricted,count,warnings] of [[11,friday-1,20,10,0],[11,friday,0,10,8],[11,30,0,10,8],[12,1,0,2,0],[12,19,0,2,0]]) {
   const active=activeOn(rows,annual,new Date(year,month-1,day,12)),autumn=active.find(p=>p.id==='autumn');
   assert.equal(contentItems(autumn,'impermissible',language).length,restricted);
   const items=allowedItemsWithOverlaps(autumn,[],language);
   assert.equal(items.length,count);assert.equal(items.filter(item=>item.grayArea).length,warnings);
   for(const item of items)if(['sweater-weather themes','warm or cold cider'].includes(item.key))assert.equal(item.grayArea,false);
   if(month===12)assert.deepEqual(items.map(item=>item.key),['sweater-weather themes','warm cider']);
   const html=currentCard(active,language,messages[language]);
   assert.equal((html.match(/class="overlap-button gray-area-button"/g)||[]).length,warnings);
   if(warnings)assert.ok(html.includes(grayAreaCopy[language]));
  }
 }
});
test('Black Friday is featured only the day after Thanksgiving with Holiday Allowed items',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 for(const [year,day] of [[2024,29],[2026,27],[2027,26]]) {
  for(const date of [new Date(year,10,1,12),new Date(year,10,day-1,12),new Date(year,10,day+1,12)]) assert.ok(!activeOn(rows,annual,date).some(p=>p.id==='black-friday'));
  const active=activeOn(rows,annual,new Date(year,10,day,12));
  assert.equal(active[0].id,'black-friday');assert.equal(active[0].emoji,'🛍️');
  for(const language of ['en','ko','ga']) assert.deepEqual(contentItems(active[0],'permissible',language),contentItems(rows.find(r=>r.id==='holiday'),'permissible',language));
 }
});
test('Summer shares Late Summer restrictions only from August 1 onward',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 const source=rows.find(row=>row.id==='late-summer');
 for(const language of ['en','ko','ga'])for(const [month,day,restricted] of [[7,31,false],[8,1,true],[8,31,true],[9,6,true]]) {
  const summer=activeOn(rows,annual,new Date(2026,month-1,day,12)).find(row=>row.id==='summer');
  assert.ok(summer);
  assert.deepEqual(contentItems(summer,'impermissible',language),restricted?contentItems(source,'impermissible',language):[]);
 }
});
test('reset contains only approved seasonal lists and no automatic drafts',()=>{
 for(const language of ['en','ko','ga']) {
  const late=rows.find(r=>r.id==='late-summer'),autumn=rows.find(r=>r.id==='autumn');
  assert.equal(contentItems(late,'impermissible',language).length,11);
  assert.deepEqual(new Set(contentItems(late,'impermissible',language)),new Set([...contentItems(autumn,'permissible',language),contentItems(rows.find(r=>r.id==='halloween'),'permissible',language)[0]]));
  for(const row of rows)for(const prefix of ['permissible','impermissible']){
   const expected=row.id==='black-friday'&&prefix==='permissible'?21:row.id==='spring'&&prefix==='permissible'?5:row.id==='easter'&&prefix==='permissible'?11:row.id==='early-summer'&&prefix==='permissible'?7:row.id==='summer'&&prefix==='permissible'?13:row.id==='independence'&&prefix==='permissible'?10:row.id==='late-summer'&&prefix==='permissible'?11:row.id==='late-summer'&&prefix==='impermissible'?11:row.id==='autumn'?(prefix==='permissible'?10:13):row.id==='halloween'?(prefix==='permissible'?13:8):row.id==='thanksgiving'?(prefix==='permissible'?18:20):row.id==='holiday'?(prefix==='permissible'?21:18):row.id==='new-year'&&prefix==='permissible'?18:row.id==='winter'?(prefix==='permissible'?4:11):row.id==='valentine'&&prefix==='permissible'?11:row.id==='patrick'&&prefix==='permissible'?14:row.id==='chuseok'&&prefix==='permissible'?11:row.id==='lunar'&&prefix==='permissible'?8:0;
   const count = row.id==='halloween' && prefix==='permissible' ? 23 : expected;
   assert.equal(contentItems(row,prefix,language).length,count,`${row.id}: ${prefix}`);
  }
  assert.deepEqual(new Set(contentItems(rows.find(r=>r.id==='thanksgiving'),'permissible',language)),new Set([...contentItems(rows.find(r=>r.id==='halloween'),'impermissible',language),...contentItems(autumn,'permissible',language)]));
  assert.deepEqual(contentItems(rows.find(r=>r.id==='thanksgiving'),'impermissible',language),contentItems(rows.find(r=>r.id==='holiday'),'permissible',language).filter(item=>item!==rows.find(r=>r.id==='holiday')[`permissible_food_${language}`]));
  for (const item of contentItems(autumn,'permissible',language)) {
   assert.ok(contentItems(rows.find(r=>r.id==='halloween'),'permissible',language).includes(item));
  }
  const html=currentCard([{...late,start:new Date(2026,8,7),end:new Date(2026,8,21)}],language,messages[language]);
  assert.ok(!html.includes('restriction-draft'));
 }
 assert.deepEqual(contentItems(rows.find(r=>r.id==='holiday'),'permissible','en'),['Holiday décor', 'Holiday trees', 'Holiday lights', 'Holiday wreaths', 'Holiday stockings', 'Santa Claus', 'Reindeer', 'Candy canes', 'Gingerbread houses', 'Holiday ornaments', 'Mistletoe', 'Holly', 'Poinsettias', 'Snowmen', 'Snowflakes', 'Snow-covered scenery', 'Winter village décor', '“Winter Wonderland” décor', 'Eggnog', 'Holiday music', 'Holiday films']);
 assert.deepEqual(contentItems(rows.find(r=>r.id==='halloween'),'permissible','en').slice(0,13),['Halloween décor', 'Jack-o’-lanterns', 'Ghosts', 'Witches', 'Bats', 'Black cats', 'Skeletons', 'Spiderwebs', 'Haunted houses', 'Candy', 'Candy corn', 'Costumes', 'Candles']);
 assert.deepEqual(contentItems(rows.find(r=>r.id==='halloween'),'impermissible','en'),['Thanksgiving décor', 'Turkeys', 'Cornucopias', 'Pilgrims', '“Give Thanks” décor', '“Happy Thanksgiving” décor', 'Thanksgiving table settings', 'Thanksgiving dinner imagery']);
});

test('Autumn Halloween restrictions end after September 30',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 for(const language of ['en','ko','ga']) {
  for(const [month,day,count] of [[9,30,13],[10,1,8],[10,15,8],[10,31,8],[11,1,20],[11,26,20],[11,27,0],[11,30,0]]) {
   const autumn=activeOn(rows,annual,new Date(2026,month-1,day,12)).find(r=>r.id==='autumn');
   assert.equal(contentItems(autumn,'impermissible',language).length,count);
   assert.equal(contentItems(autumn,'permissible',language).length,10);
   if(month===10)assert.deepEqual(contentItems(autumn,'impermissible',language),contentItems(rows.find(r=>r.id==='halloween'),'impermissible',language));
   if(month===11 && count)assert.deepEqual(contentItems(autumn,'impermissible',language),contentItems(rows.find(r=>r.id==='thanksgiving'),'impermissible',language));
  }
 }
});

test('Holiday restrictions end December 25 and do not return in January',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 for(const language of ['en','ko','ga']) {
  const expected=contentItems(rows.find(r=>r.id==='new-year'),'permissible',language);
  assert.equal(expected.length,18);
  for(const [year,month,day,count] of [[2026,11,27,0],[2026,11,30,0],[2026,12,1,18],[2026,12,25,18],[2026,12,26,0],[2026,12,31,0],[2027,1,1,0],[2027,1,6,0]]) {
   const active=activeOn(rows,annual,new Date(year,month-1,day,12));
   const holiday=active.find(r=>r.id==='holiday');
   assert.deepEqual(contentItems(holiday,'impermissible',language),count?expected:[]);
   if(!count && month!==11)assert.deepEqual(contentItems(active.find(r=>r.id==='new-year'),'permissible',language),expected);
  }
 }
});

test('Winter and Valentine lists match the approved content in each language',()=>{
 for(const language of ['en','ko','ga']) {
  assert.deepEqual(contentItems(rows.find(r=>r.id==='winter'),'impermissible',language),contentItems(rows.find(r=>r.id==='valentine'),'permissible',language));
 }
 assert.deepEqual(contentItems(rows.find(r=>r.id==='winter'),'permissible','en'),['Snowmen', 'Snowflakes', 'Snow-covered scenery', 'Winter village décor']);
 assert.deepEqual(contentItems(rows.find(r=>r.id==='valentine'),'permissible','en'),['Hearts', 'Valentines', 'Cupid', 'Love letters', 'Conversation hearts', 'Heart-shaped candy', 'Roses', 'Romantic décor', 'Pink and red décor', '“Be Mine” décor', 'Valentine’s candy']);
});

test('Winter Valentine restrictions stop February 1, including cross-year winter',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 for(const language of ['en','ko','ga'])for(const [year,month,day,count] of [[2025,12,22,11],[2026,1,31,11],[2026,2,1,0],[2026,2,14,0],[2026,2,15,14],[2026,3,1,0]]) {
  const winter=activeOn(rows,annual,new Date(year,month-1,day,12)).find(r=>r.id==='winter');
  assert.equal(contentItems(winter,'impermissible',language).length,count);
  assert.equal(contentItems(winter,'permissible',language).length,4);
 }
});

test('Winter borrows Patrick Allowed only February 15 through the last February day',()=>{
 const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
 for(const language of ['en','ko','ga'])for(const year of [2024,2026,2028]) {
  const expected=contentItems(rows.find(r=>r.id==='patrick'),'permissible',language);
  assert.equal(expected.length,14);
  for(const date of [new Date(year,1,14,12),new Date(year,1,15,12),new Date(year,2,0,12),new Date(year,2,1,12)]) {
   const winter=activeOn(rows,annual,date).find(r=>r.id==='winter');
   assert.deepEqual(contentItems(winter,'impermissible',language),date.getMonth()===1&&date.getDate()>=15?expected:[]);
  }
 }
});

test('Chuseok and Lunar New Year preserve the approved list order',()=>{
 assert.deepEqual(contentItems(rows.find(r=>r.id==='chuseok'),'permissible','en'),['Chuseok décor', 'Full moon imagery', 'Songpyeon (half-moon-shaped rice cakes)', 'Harvest imagery', 'Rice stalks', 'Persimmons', 'Chestnuts', 'Jujubes', 'Korean pears', 'Gift sets', 'Traditional Korean or East Asian patterns']);
 assert.deepEqual(contentItems(rows.find(r=>r.id==='lunar'),'permissible','en'),['Lunar New Year décor', 'New Year greetings', 'Year-of-the-zodiac imagery', 'Traditional Korean or East Asian games', 'Traditional Korean or East Asian patterns', 'Lucky pouches', 'New Year gift sets', 'Tteokguk (Rice Cake Soup)']);
});

test('Spring through Late Summer allowed lists and renamed periods are present',()=>{
 const expected={spring:5,easter:11,'early-summer':7,summer:13,independence:10,'late-summer':11};
 for(const language of ['en','ko','ga'])for(const [id,count] of Object.entries(expected))assert.equal(contentItems(rows.find(r=>r.id===id),'permissible',language).length,count,id);
 assert.equal(rows.find(r=>r.id==='independence').name_en,'U.S. Independence Day');
 assert.equal(rows.find(r=>r.id==='early-summer').name_en,'Late Spring');
});

test('empty Not Allowed lists hide their entire section',()=>{
 const row={start:new Date(2026,0,1),end:new Date(2026,0,31),name_en:'Test',description_en:'Test',emoji:'',permissible_decor_en:'Flowers'};
 const html=currentCard([row],'en',messages.en);
 assert.match(html,/Allowed/);assert.doesNotMatch(html,/NOT ALLOWED|None specified yet/);
});
