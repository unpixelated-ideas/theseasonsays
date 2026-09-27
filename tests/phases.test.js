import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCalendar,parseAnnual,activeOn,resolve,nextChange,guidanceOn} from '../src/lib/calendar.js';
import {fromKey,key,addDays,difference,daysInYear} from '../src/lib/dates.js';
import {contentItems} from '../src/lib/content.js';
import {currentCard} from '../src/components/views.js';
import {messages} from '../src/i18n/messages.js';
import {updates} from '../src/data/updates.js';
const read=name=>readFileSync(new URL(`../src/data/${name}`,import.meta.url),'utf8');
const rows=parseCalendar(read('calendar.csv')),annual=parseAnnual(read('annual-dates.csv'));
const phase=(date,id)=>activeOn(rows,annual,fromKey(date)).find(p=>p.id===id);
test('phase names and inclusive ranges cover all requested boundaries',()=>{
 for(const [date,id,name,start,end] of [
 ['2026-09-30','autumn','Early Autumn',key(resolve('autumn',2026,annual)),'2026-09-30'],
 ['2026-10-01','autumn','Early to Mid Autumn','2026-10-01','2026-10-20'],
 ['2026-10-20','autumn','Early to Mid Autumn','2026-10-01','2026-10-20'],
 ['2026-10-21','autumn','Mid to Late Autumn','2026-10-21',key(resolve('winter-1',2026,annual))],
 ['2026-12-25','holiday','Holiday Season','2026-11-27','2026-12-25'],
 ['2026-12-26','holiday','Late Holiday Season','2026-12-26','2027-01-06'],
 ['2027-01-06','holiday','Late Holiday Season','2026-12-26','2027-01-06'],
 ['2026-01-08','winter','Early Winter',key(resolve('winter',2025,annual)),'2026-01-31'],
 ['2026-02-01','winter','Midwinter','2026-02-01','2026-02-14'],
 ['2026-02-14','winter','Midwinter','2026-02-01','2026-02-14'],
 ['2026-02-15','winter','Late Winter','2026-02-15','2026-02-28'],
 ['2024-02-29','winter','Late Winter','2024-02-15','2024-02-29'],
 ['2026-03-01','winter','End of Winter','2026-03-01','2026-03-17'],
 ['2026-03-17','winter','End of Winter','2026-03-01','2026-03-17'],
 ['2026-03-18','winter','Final Days of Winter','2026-03-18',key(resolve('spring-1',2026,annual))],
 ]){const p=phase(date,id);assert.equal(p.name_en,name);assert.equal(key(p.start),start);assert.equal(key(p.end),end);}
});
test('each active broad season resolves exactly one phase, localized and containing the date',()=>{
 for(let year=2024;year<=2028;year++)for(let day=0;day<daysInYear(year);day++){
  const date=addDays(fromKey(`${year}-01-01`),day),active=activeOn(rows,annual,date);
  for(const id of ['autumn','winter','holiday']){
   const periods=active.filter(p=>p.id===id);assert.ok(periods.length<=1);
   for(const p of periods){assert.ok(p.phaseId);assert.ok(difference(date,p.start)>=0&&difference(p.end,date)>=0);for(const lang of ['en','ko','ga'])assert.ok(p[`name_${lang}`]&&p[`description_${lang}`]);}
  }
 }
});
test('overlaps render phase names and coming-up detects a phase change without a broad season change',()=>{
 const active=activeOn(rows,annual,fromKey('2026-12-26'));
 assert.equal(active[0].id,'new-year');
 const html=currentCard(active,'en',messages.en);
 assert.match(html,/Late Holiday Season/);assert.match(html,/Early Winter/);
 const next=nextChange(rows,annual,fromKey('2026-10-20'));
 assert.equal(key(next.date),'2026-10-21');assert.equal(next.added[0].name_en,'Mid to Late Autumn');
});
test('guidance has complementary spirits and dynamically dated summer whites in all languages',()=>{
 for(const year of [2024,2025,2026,2027,2028]){
  const memorial=resolve('memorial',year,annual),labor=resolve('labor',year,annual);
  for(const [date,white,light] of [[addDays(memorial,-1),false,true],[memorial,true,true],[labor,true,true],[addDays(labor,1),false,true],[fromKey(`${year}-04-30`),false,false],[fromKey(`${year}-05-01`),false,true],[fromKey(`${year}-09-30`),false,true],[fromKey(`${year}-10-01`),false,false],[fromKey(`${year}-01-01`),false,false]]){
   const guidance=guidanceOn(rows,annual,date);
   for(const lang of ['en','ko','ga'])for(const [id,allowed] of [['summer-whites',white],['light-spirits',light],['dark-spirits',!light]]){
    const item=contentItems(rows.find(r=>r.id===id),'permissible',lang)[0];
    assert.ok(contentItems(guidance,allowed?'permissible':'impermissible',lang).includes(item));
    assert.ok(!contentItems(guidance,allowed?'impermissible':'permissible',lang).includes(item));
   }
  }
 }
 const html=currentCard(activeOn(rows,annual,fromKey('2026-12-26')),'en',messages.en);
 assert.equal((html.match(/Amber\/dark spirits/g)||[]).length,1);
});
test('v0.5 contains exactly the requested three updates in every language',()=>{
 const entry=updates.find(p=>p.version==='v0.5');assert.equal(entry.date,'2026-09-27');
 for(const lang of ['en','ko','ga'])assert.equal(entry[lang].length,3);
 assert.deepEqual(entry.en,['Refined date slider usability','Clarified the nuances of overlapping seasons','Expanded the Allowed / Not Allowed guidance based on user feedback']);
});
