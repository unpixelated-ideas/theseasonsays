import {dateItems,itemYear} from '../lib/items.js';
import {itemCopy} from '../i18n/items.js';
import {grayAreaCopy} from '../i18n/overlaps.js';
import {site} from '../config/site.js';
import {key,addDays,fromKey,localDate,difference} from '../lib/dates.js';
import {escapeHTML as e,formatDate} from './views.js';

export function createItemPages(rows,annual,catalog){
 const years=new Map();
 const getYear=year=>{if(!years.has(year))years.set(year,itemYear(rows,annual,year));return years.get(year);};
 return function renderItem(page,id,language,m,today){
  const copy=itemCopy[language],item=catalog.get(id);
  if(!item){page.innerHTML=`<a class="back" href="#home">← ${e(m.back)}</a><section class="card information"><h1>${e(m.notFound)}</h1></section>`;return;}
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  const supplied=params.get('date'),parsed=fromKey(supplied||'');
  const supported=date=>date&&date.getFullYear()>=site.minYear&&date.getFullYear()<=site.maxYear;
  const date=supported(parsed)?parsed:today;
  let year=Math.min(site.maxYear,Math.max(site.minYear,date.getFullYear()));
  document.title=`${item.labels[language]} · ${site.productName[language]}`;
  const back=`#home${supplied&&supported(parsed)?`?date=${key(date)}`:''}`;
  function draw(){
   const available=supported(date),state=available?dateItems(rows,annual,date).get(id):null;
   // Join adjacent year fragments to retain real cross-year boundaries.
   const windows=[];
   for(let y=year-1;y<=year+1;y++){
    for(const window of getYear(y).get(id)||[]){
     const last=windows.at(-1);
     if(last&&key(addDays(last.end,1))===key(window.start)&&last.gray===window.gray)last.end=window.end;
     else windows.push({...window});
    }
   }
   const relevant=windows.filter(w=>w.start.getFullYear()<=year&&w.end.getFullYear()>=year);
   const prohibited=[];
   let cursor=localDate(year,1,1),endOfYear=localDate(year,12,31);
   for(const window of relevant){
    if(difference(window.start,cursor)>0)prohibited.push({start:cursor,end:addDays(window.start,-1)});
    cursor=addDays(window.end,1);
   }
   if(difference(endOfYear,cursor)>=0)prohibited.push({start:cursor,end:endOfYear});
   const windowList=list=>`<ul>${list.map(window=>`<li>${e(formatDate(window.start,m,false,true))} – ${e(formatDate(window.end,m,false,true))}${window.gray?` — ${e(grayAreaCopy[language])}`:''}</li>`).join('')}</ul>`;
   page.innerHTML=`<div class="item-page"><a class="back" href="${e(back)}">← ${e(m.back)}</a><section class="card information"><h1>${e(item.labels[language])} <span class="timeline-beta">${e(m.beta)}</span></h1>${supplied&&!supported(parsed)?`<p role="status">${e(copy.invalid)}</p>`:''}<p>${e(formatDate(date,m,true))}</p><p class="item-verdict"><strong>${e(available?(state?copy.allowed:copy.notAllowed):copy.unavailable)}</strong></p>${state?.gray?`<p>${e(grayAreaCopy[language])}</p>`:''}${id==='holiday-music'?`<p>${e(copy.holiday)}</p>${available&&!state&&date.getMonth()>=1&&date.getMonth()<=10?`<p>${e(copy.early)}</p>`:''}`:''}<label class="item-year">${e(copy.year)}<select id="item-year">${Array.from({length:site.maxYear-site.minYear+1},(_,index)=>site.minYear+index).map(value=>`<option value="${value}" ${value===year?'selected':''}>${value}</option>`).join('')}</select></label><h2>${e(copy.allowed)}</h2><p>${e(copy.inclusive)}</p>${relevant.length?windowList(relevant):`<p>${e(copy.none)}</p>`}<h2>${e(copy.notAllowed)}</h2><p>${e(copy.outside)}</p>${prohibited.length?windowList(prohibited):`<p>${e(copy.noProhibition)}</p>`}<div class="item-actions"><button type="button" id="copy-item">${e(copy.copy)}</button><button type="button" id="copy-dated-item">${e(copy.dated)}</button></div><p class="item-share-status" role="status" aria-live="polite"></p></section></div>`;
   page.querySelector('#item-year').onchange=event=>{year=Number(event.target.value);draw();page.querySelector('#item-year').focus();};
   async function share(dated){
    const url=new URL(location.href);url.hash=`item/${id}${dated?`?date=${key(date)}`:''}`;
    const status=page.querySelector('.item-share-status');
    try{await navigator.clipboard.writeText(url.href);status.textContent=copy.copied;}
    catch{status.replaceChildren(document.createTextNode(copy.failed+' '));const input=document.createElement('input');input.readOnly=true;input.value=url.href;input.setAttribute('aria-label',copy.copy);status.append(input);input.focus();input.select();}
   }
   page.querySelector('#copy-item').onclick=()=>share(false);
   page.querySelector('#copy-dated-item').onclick=()=>share(true);
  }
  draw();
 };
}
