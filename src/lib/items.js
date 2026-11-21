import {activeOn} from './calendar.js';
import {localDate,addDays,key,daysInYear} from './dates.js';
const categories=['decor','food','activities','media'];
const languages=['en','ko','ga'];
const normalize=value=>value.normalize('NFC').trim().replace(/\s+/gu,' ').toLowerCase();
export const itemId=label=>normalize(label).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const split=value=>(value||'').split('|').map(x=>x.trim());
let catalog=new Map();
export function entries(period,prefix='permissible') {
 const result=[];
 for(const category of categories){
  const labels=Object.fromEntries(languages.map(lang=>[lang,split(period[`${prefix}_${category}_${lang}`])]));
  labels.en.forEach((label,index)=>{if(label)result.push({id:itemId(label),labels:Object.fromEntries(languages.map(lang=>[lang,labels[lang][index]||label]))});});
 }
 return result;
}
export function dateItems(rows,annual,date){
 const result=new Map();
 for(const period of activeOn(rows,annual,date)){
  const combined={...period};
  for(const [field,value] of Object.entries(period.guidance||{}))combined[field]=[combined[field],value].filter(Boolean).join(' | ');
  for(const item of entries(combined)){
   const gray=Boolean(period.autumnGrayArea)&&!['sweater-weather-themes','warm-or-cold-cider'].includes(item.id);
   const old=result.get(item.id);
   result.set(item.id,{...item,gray:old?old.gray&&gray:gray});
  }
 }
 return result;
}
export function createItemCatalog(rows,annual,year=2026){
 const result=new Map();
 const add=item=>{const old=result.get(item.id);if(old&&old.labels.en!==item.labels.en)throw Error(`Item slug collision: ${item.id}`);result.set(item.id,item);};
 for(const row of rows)for(const prefix of ['permissible','impermissible'])entries(row,prefix).forEach(add);
 for(let d=localDate(year,1,1);d.getFullYear()===year;d=addDays(d,1))for(const item of dateItems(rows,annual,d).values())add(item);
 catalog=result;
 return result;
}
export function itemForLabel(label,language){return [...catalog.values()].find(item=>normalize(item.labels[language])===normalize(label));}
export function itemHref(label,language,date){const item=itemForLabel(label,language);return item?`#item/${item.id}${date?`?date=${key(date)}`:''}`:null;}
export function itemYear(rows,annual,year){
 const result=new Map();
 for(let date=localDate(year,1,1);date.getFullYear()===year;date=addDays(date,1)){
  for(const item of dateItems(rows,annual,date).values()){
   if(!result.has(item.id))result.set(item.id,[]);
   const windows=result.get(item.id),last=windows.at(-1);
   if(last&&key(addDays(last.end,1))===key(date)&&last.gray===item.gray)last.end=date;
   else windows.push({start:date,end:date,gray:item.gray});
  }
 }
 return result;
}

// Both the verdict and the annual overview use the effective guide result.
export function itemStatus(item) {
  return item ? (item.gray ? 'gray' : 'allowed') : 'notAllowed';
}

export function itemYearOverview(rows, annual, id, year) {
  const segments = [];
  const totals = { allowed: 0, gray: 0, notAllowed: 0 };
  const days = daysInYear(year);
  for (let index = 0; index < days; index++) {
    const date = localDate(year, 1, index + 1);
    const status = itemStatus(dateItems(rows, annual, date).get(id));
    const last = segments.at(-1);
    totals[status]++;
    if (last?.status === status) {
      last.end = date;
      last.days++;
    } else {
      segments.push({ status, start: date, end: date, days: 1 });
    }
  }
  return { segments, totals, days };
}
