// Offline maintenance tool; neither converter is shipped to the browser.
// Usage: node scripts/extend-annual-dates.mjs astronomy.cjs korean_calendar.py [python3]
// Astronomy Engine v2.1.19; usingsky/korean_lunar_calendar_py reference table.
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [astronomyPath,koreanPath,python='python3']=process.argv.slice(2);
if(!astronomyPath||!koreanPath)throw new Error('Provide Astronomy Engine CommonJS and Korean calendar Python source paths.');
// Pin maintenance inputs so an upstream change cannot silently alter the table.
for(const [file,sha256] of [
 [astronomyPath,'729c0ce37cc1a8096034a689039a5f04585ee8184177c638e8c74dec4fa3185a'],
 [koreanPath,'feac47dce0c204117170754e754bf795cdfd40ca8ee098cc2e1f0e0b0c7e6e2f'],
])assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),sha256,`Unexpected converter source: ${file}`);
const {Seasons}=createRequire(import.meta.url)(resolve(astronomyPath));
const reference=JSON.parse(execFileSync(python,['-c',`
import importlib.util,json,sys
spec=importlib.util.spec_from_file_location('korean',sys.argv[1])
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
calendar=module.KoreanLunarCalendar()
result={}
for year in range(1899,2051):
    for event,month,day in [('lunar-new-year',1,1),('chuseok',8,15)]:
        assert calendar.setLunarDate(year,month,day,False)
        result[f'{year}:{event}']=calendar.SolarIsoFormat()
print(json.dumps(result))
`,resolve(koreanPath)],{encoding:'utf8'}));
const file=new URL('../src/data/annual-dates.csv',import.meta.url);
// Retain the previously curated NWS/USNO/KASI records exactly.
const curated=new Map(readFileSync(file,'utf8').trim().split('\n').slice(1).map(line=>{
 const [year,event,date]=line.split(',');return [`${year}:${event}`,date];
}).filter(([id])=>/^(202[4-8]:|2023:(spring|winter)$|2029:spring$)/.test(id)));
const lunar=new Intl.DateTimeFormat('en-u-ca-dangi',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',year:'numeric'});
assert.equal(lunar.resolvedOptions().calendar,'dangi');
const output=['year,event,date'];
for(let year=1899;year<=2128;year++){
 const seasons=Seasons(year);
 for(const [event,field] of Object.entries({spring:'mar_equinox',summer:'jun_solstice',autumn:'sep_equinox',winter:'dec_solstice'})){
  const rounded=new Date(Math.round(seasons[field].date.getTime()/60000)*60000).toISOString().replace('.000Z','Z');
  output.push(`${year},${event},${curated.get(`${year}:${event}`)||rounded}`);
 }
 const dates={};
 if(year<=2050){
  for(const event of ['lunar-new-year','chuseok'])dates[event]=reference[`${year}:${event}`];
 }else{
  // Numeric month excludes leap months (e.g. "8bis"). Use Korean Dangi,
  // not the Chinese calendar: they can differ by a civil day or a month.
  for(let stamp=Date.UTC(year,0,1,3);stamp<Date.UTC(year+1,0,1,3);stamp+=86400000){
   const parts=Object.fromEntries(lunar.formatToParts(new Date(stamp)).map(p=>[p.type,p.value]));
   const event=parts.month==='1'&&parts.day==='1'?'lunar-new-year':parts.month==='8'&&parts.day==='15'?'chuseok':null;
   if(event){assert.ok(!dates[event],`Duplicate ${year}:${event}`);dates[event]=new Date(stamp).toISOString().slice(0,10);}
  }
 }
 for(const event of ['lunar-new-year','chuseok']){
  assert.ok(dates[event],`Missing ${year}:${event}`);
  output.push(`${year},${event},${curated.get(`${year}:${event}`)||dates[event]}`);
 }
}
writeFileSync(file,output.join('\n')+'\n');
console.log(`Wrote 1899–2128 annual data (Node ${process.versions.node}, ICU ${process.versions.icu}).`);
