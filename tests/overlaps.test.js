import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allowedItemsWithOverlaps} from '../src/lib/content.js';
import {parseCalendar,parseAnnual,activeOn} from '../src/lib/calendar.js';
import {currentCard} from '../src/components/views.js';
import {messages} from '../src/i18n/messages.js';
import {overlapCopy} from '../src/i18n/overlaps.js';
const rows=parseCalendar(readFileSync(new URL('../src/data/calendar.csv',import.meta.url),'utf8'));
const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
test('actual Halloween and Thanksgiving overlap with Autumn in every language',()=>{
 for(const month of [9,10]) {
  const active=activeOn(rows,annual,new Date(2026,month,15,12));
  for(const lang of ['en','ko','ga']) {
   const items=allowedItemsWithOverlaps(active[0],active,lang);
   assert.equal(items.filter(item=>item.matches.length).length,10);
   assert.deepEqual(items.find(item=>item.key==='pumpkin spice').matches,[{id:'autumn',name:rows.find(r=>r.id==='autumn')[`name_${lang}`]}]);
   const html=currentCard(active,lang,messages[lang]);
   assert.equal((html.match(/class="overlap-button"/g)||[]).length,10);
   assert.ok(html.includes(overlapCopy[lang].alsoIn(rows.find(r=>r.id==='autumn')[`name_${lang}`])));
   assert.ok(!html.split('class="overlaps"')[1].includes('overlap-button'));
  }
 }
});
test('canonical keys normalize Unicode, case and spaces; count distinct active IDs only',()=>{
 const event=(id,text)=>({id,name_en:id,name_ko:id,name_ga:id,permissible_decor_en:text,permissible_decor_ko:'번역',permissible_decor_ga:'Aistriúchán'});
 const primary=event('main','Café décor|Unique');
 const a=event('a',' CAFÉ   DÉCOR |Café décor'),b=event('b','café décor'),c=event('c','café décor');
 const unrelated=event('other','Coffee décor');
 unrelated.impermissible_decor_en='Unique';
 for(const lang of ['en','ko','ga']) {
  const result=allowedItemsWithOverlaps(primary,[primary,a,a,b,c,unrelated],lang);
  assert.deepEqual(result[0].matches.map(m=>m.id),['a','b','c']);
  assert.equal(allowedItemsWithOverlaps(primary,[primary,unrelated],lang)[0].matches.length,0);
 }
 assert.equal(allowedItemsWithOverlaps(primary,[primary,a,b],'en')[0].matches.length,2);
 assert.equal(allowedItemsWithOverlaps(primary,[primary,a,b],'en')[1].matches.length,0);
});
test('calendar translation fields have one translation per canonical item',()=>{
 for(const row of rows)for(const category of ['decor','food','activities','media'])for(const lang of ['ko','ga']) {
  const parts=language=>(row[`permissible_${category}_${language}`]||'').split('|').filter(Boolean);
  assert.equal(parts(lang).length,parts('en').length,`${row.id} ${category} ${lang}`);
 }
});
test('inactive Halloween cannot contribute in September',()=>{
 const active=activeOn(rows,annual,new Date(2026,8,30,12));
 assert.ok(!active.some(p=>p.id==='halloween'));
 for(const item of allowedItemsWithOverlaps(active[0],active,'en')) assert.ok(!item.matches.some(m=>m.id==='halloween'));
});
