import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseAnnual,resolve} from '../src/lib/calendar.js';
import {daysInYear,fromKey,key} from '../src/lib/dates.js';
import {site} from '../src/config/site.js';

const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
test('1900–2127 and neighboring buffer years have all six annual events',()=>{
 assert.equal(site.minYear,1900);assert.equal(site.maxYear,2127);
 for(let year=site.minYear-1;year<=site.maxYear+1;year++){
  for(const event of ['spring','summer','autumn','winter','lunar-new-year','chuseok']){
   assert.ok(annual.has(`${year}:${event}`),`${year}:${event}`);
   assert.ok(resolve(event,year,annual));
  }
 }
});
test('century years obey Gregorian leap rules',()=>{
 for(const year of [1900,2100]){
  assert.equal(daysInYear(year),365);assert.equal(fromKey(`${year}-02-29`),null);
 }
 assert.equal(daysInYear(2000),366);assert.ok(fromKey('2000-02-29'));
});
test('Korean reference dates and the existing 2027 Korean/Chinese distinction survive',()=>{
 for(const [year,event,date] of [
  [1900,'lunar-new-year','1900-01-31'],[2000,'chuseok','2000-09-12'],
  [2027,'lunar-new-year','2027-02-07'],[2050,'chuseok','2050-09-30'],
 ])assert.equal(key(resolve(event,year,annual)),date);
});
