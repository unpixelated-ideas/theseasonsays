import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCalendar,parseAnnual,activeOn} from '../src/lib/calendar.js';
import {createItemCatalog,dateItems,itemYear,itemYearOverview,itemHref,entries} from '../src/lib/items.js';
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
test('apple cider donuts are allowed throughout autumn only', () => {
  for (const [day, allowed] of [
    ['2026-06-22', false], ['2026-09-21', false], ['2026-09-22', true],
    ['2026-10-31', true], ['2026-11-26', true], ['2026-11-27', true],
    ['2026-12-20', true], ['2026-12-22', false],
  ]) {
    const item = dateItems(rows, annual, fromKey(day)).get('apple-cider-donuts');
    assert.equal(Boolean(item), allowed, day);
    if (item) assert.equal(item.gray, false, day);
  }
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

test('annual segments classify each day once using effective guide status', () => {
  for (const [year, days] of [[1900, 365], [2000, 366], [2026, 365], [2028, 366], [2100, 365], [2127, 365]]) {
    for (const id of ['holiday-music', 'pumpkin-spice', 'warm-or-cold-cider', 'summery-white-attire']) {
      const overview = itemYearOverview(rows, annual, id, year);
      assert.equal(overview.days, days);
      const counts = { allowed: 0, gray: 0, notAllowed: 0 };
      let offset = 0;
      let previous;
      for (const { status, start, end, days: length } of overview.segments) {
        assert.notEqual(status, previous);
        assert.equal(key(start), key(localDate(year, 1, offset + 1)));
        for (let index = 0; index < length; index++) {
          const date = localDate(year, 1, ++offset);
          const item = dateItems(rows, annual, date).get(id);
          assert.equal(status, item ? item.gray ? 'gray' : 'allowed' : 'notAllowed', `${id} on ${key(date)}`);
          counts[status]++;
        }
        assert.equal(key(end), key(localDate(year, 1, offset)));
        previous = status;
      }
      assert.equal(offset, days);
      assert.deepEqual(overview.totals, counts);
    }
  }
});

test('annual totals include cross-year carryover and real gray-area boundaries', () => {
  const music = itemYearOverview(rows, annual, 'holiday-music', 2026);
  assert.deepEqual(music.totals, { allowed: 41, gray: 0, notAllowed: 324 });
  assert.deepEqual(music.segments.filter(segment => segment.status === 'allowed').map(segment =>
    [key(segment.start), key(segment.end), segment.days]), [
    ['2026-01-01', '2026-01-06', 6], ['2026-11-27', '2026-12-31', 35],
  ]);
  const pumpkin = itemYearOverview(rows, annual, 'pumpkin-spice', 2026);
  assert.deepEqual(pumpkin.segments.filter(segment => segment.status === 'gray').map(segment =>
    [key(segment.start), key(segment.end)]), [['2026-11-27', '2026-11-30']]);
  const cider = itemYearOverview(rows, annual, 'warm-or-cold-cider', 2026);
  assert.equal(cider.totals.gray, 0);
  assert.equal(cider.segments.find(segment => segment.start <= fromKey('2026-11-27') &&
    segment.end >= fromKey('2026-11-27')).status, 'allowed');
});

test('36 eligible days have different shares in ordinary and leap years', () => {
  const percent = new Intl.NumberFormat('en-US', {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
  const window = [{
    id: 'sample', start_rule: '01-01', end_rule: '02-05',
    permissible_decor_en: 'Sample item',
  }];
  for (const [year, expected] of [[2026, '9.9%'], [2028, '9.8%']]) {
    const { totals, days } = itemYearOverview(window, annual, 'sample-item', year);
    assert.equal(totals.allowed, 36);
    assert.equal(percent.format(totals.allowed / days), expected);
  }
});

test('an overlapping allowed listing takes precedence over the gray-area listing', () => {
  const overlap = {
    id: 'sample-overlap', priority: '0', start_rule: '11-28', end_rule: '11-29',
    permissible_food_en: 'Pumpkin spice',
  };
  const { segments } = itemYearOverview([...rows, overlap], annual, 'pumpkin-spice', 2026);
  for (const [day, expected] of [[27, 'gray'], [28, 'allowed'], [29, 'allowed'], [30, 'gray']]) {
    const date = localDate(2026, 11, day);
    assert.equal(segments.find(({ start, end }) => start <= date && date <= end).status, expected);
  }
});
