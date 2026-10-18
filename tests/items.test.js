import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCalendar,parseAnnual,activeOn} from '../src/lib/calendar.js';
import {createItemCatalog,dateItems,itemYear,itemHref,entries} from '../src/lib/items.js';
import {currentCard} from '../src/components/views.js';
import {messages} from '../src/i18n/messages.js';
import {fromKey,key,localDate,addDays} from '../src/lib/dates.js';
const rows=parseCalendar(readFileSync(new URL('../src/data/calendar.csv',import.meta.url),'utf8'));
const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
const catalog=createItemCatalog(rows,annual);
test('holiday music follows inclusive Black Friday–January 6 rules',()=>{
 for(const [day,allowed] of [['2026-11-02',false],['2026-11-26',false],['2026-11-27',true],['2027-01-06',true],['2027-01-07',false]])assert.equal(dateItems(rows,annual,fromKey(day)).has('holiday-music'),allowed,day);
 assert.deepEqual(itemYear(rows,annual,2026).get('holiday-music').map(w=>[key(w.start),key(w.end)]),[['2026-01-01','2026-01-06'],['2026-11-27','2026-12-31']]);
});
test('stable IDs resolve every maintained and dynamically rendered item in every language',()=>{
 for(const row of rows)for(const prefix of ['permissible','impermissible'])for(const item of entries(row,prefix))for(const lang of ['en','ko','ga'])assert.equal(itemHref(item.labels[lang],lang),`#item/${item.id}`);
 for(let date=localDate(2026,1,1);date.getFullYear()===2026;date=addDays(date,1)){
  for(const period of activeOn(rows,annual,date)){
   const combined={...period};for(const [field,value] of Object.entries(period.guidance||{}))combined[field]=[combined[field],value].filter(Boolean).join(' | ');
   for(const prefix of ['permissible','impermissible'])for(const item of entries(combined,prefix))for(const lang of ['en','ko','ga'])assert.equal(itemHref(item.labels[lang],lang),`#item/${item.id}`);
  }
 }
 assert.ok(catalog.has('warm-cider'));
});
test('gray-area and multi-season items retain calendar qualifications',()=>{
 assert.equal(dateItems(rows,annual,fromKey('2026-11-27')).get('pumpkin-spice').gray,true);
 assert.equal(dateItems(rows,annual,fromKey('2026-11-26')).get('pumpkin-spice').gray,false);
 assert.equal(dateItems(rows,annual,fromKey('2026-12-01')).has('pumpkin-spice'),false);
 assert.equal(dateItems(rows,annual,fromKey('2026-12-01')).has('warm-cider'),true);
 assert.equal(dateItems(rows,annual,fromKey('2026-07-01')).has('summery-white-attire'),true);
 assert.equal(dateItems(rows,annual,fromKey('2026-11-01')).has('summery-white-attire'),false);
 assert.equal(dateItems(rows,annual,fromKey('2026-07-01')).has('clear-light-spirits'),true);
 assert.equal(dateItems(rows,annual,fromKey('2026-07-01')).has('amber-dark-spirits'),false);
});
test('list links preserve exploratory dates and keep indicators outside anchors',()=>{
 const date=fromKey('2026-10-18');
 for(const lang of ['en','ko','ga']){
  const html=currentCard(activeOn(rows,annual,date),lang,messages[lang],1,date);
  assert.match(html,/class="item-link" href="#item\/pumpkin-spice\?date=2026-10-18"/);
  assert.match(html,/<\/a><span class="allowed-overlap">/);
  assert.doesNotMatch(html,/<a class="item-link"[^>]*>[^<]*<span/);
 }
});
