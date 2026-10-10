import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCalendar,parseAnnual,timelineForYear,activeOn,resolve} from '../src/lib/calendar.js';
import {localDate,key,difference,addDays,daysInYear} from '../src/lib/dates.js';
import {timelineView} from '../src/components/timeline.js';
import {messages} from '../src/i18n/messages.js';
import {site,supportedLanguages} from '../src/config/site.js';
const rows=parseCalendar(readFileSync(new URL('../src/data/calendar.csv',import.meta.url),'utf8'));
const annual=parseAnnual(readFileSync(new URL('../src/data/annual-dates.csv',import.meta.url),'utf8'));
test('every visible definition and homepage period is represented, ordered and untruncated for all supported years',()=>{
 for(let year=site.minYear;year<=site.maxYear;year++){
  const entries=timelineForYear(rows,annual,year);
  for(const row of rows.filter(row=>row.category!=='guidance'&&row.id!=='holiday'))assert.ok(entries.some(p=>(p.phaseId||p.id)===row.id),`${year}: ${row.id}`);
  entries.forEach((p,i)=>{assert.ok(difference(p.end,p.start)>=0);if(i)assert.ok(difference(p.start,entries[i-1].start)>=0);});
  for(let d=0;d<daysInYear(year);d++)for(const p of activeOn(rows,annual,addDays(localDate(year,1,1),d)))assert.ok(entries.some(e=>(e.phaseId||e.id)===(p.phaseId||p.id)&&key(e.start)===key(p.start)&&key(e.end)===key(p.end)));
  assert.ok(entries.some(p=>p.start.getFullYear()<year));assert.ok(entries.some(p=>p.end.getFullYear()>year));
  assert.equal(key(entries.find(p=>p.id==='easter').end),key(resolve('easter',year,annual)));
  assert.ok(entries.every(p=>p.category!=='guidance'));
  assert.ok(!entries.some(p=>p.id==='holiday'&&!p.phaseId));
 }
 assert.equal(key(timelineForYear(rows,annual,2024).find(p=>p.phaseId==='late-winter').end),'2024-02-29');
});
test('localized cards retain content, dates, links and an independent today position',()=>{
 for(const lang of supportedLanguages){
  const entries=timelineForYear(rows,annual,2026),today=localDate(2026,10,10);
  const html=timelineView(entries,2026,lang,messages[lang],today,new Map());
  assert.ok(!html.includes('undefined'));assert.match(html,/<h1 id="timeline-title">/);
  assert.equal((html.match(/class="timeline-today"/g)||[]).length,1);
  assert.ok(html.indexOf('data-period="halloween"')<html.indexOf('class="timeline-today"'));
  assert.ok(html.indexOf('class="timeline-today"')<html.indexOf('data-period="mid-late-autumn"'));
  assert.match(html,/#home\?date=2026-10-01/);
  assert.ok(!timelineView(entries,2026,lang,messages[lang],localDate(2025,10,10),new Map()).includes('class="timeline-today"'));
  for(const p of entries)assert.ok(p[`name_${lang}`]&&p[`description_${lang}`]);
 }
});
