import {contentItems,allowedItemsWithOverlaps} from '../lib/content.js';
import {overlapCopy,grayAreaCopy} from '../i18n/overlaps.js';
import {formatDate} from '../lib/formatting.js';
export {formatDate} from '../lib/formatting.js';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHTML;
export const localized=(p,field,lang)=>p[`${field}_${lang}`]||'';
export const range=(p,t)=>{
 const crossYear=p.start.getFullYear()!==p.end.getFullYear();
 return `${formatDate(p.start,t,false,crossYear)} – ${formatDate(p.end,t,false,crossYear)}`;
};

function suggestions(period,lang,t,active) {
  // Show date-wide clothing and drink guidance once, on the primary card.
  period = {...period};
  for (const [field, value] of Object.entries(period.guidance || {})) {
    period[field] = [period[field], value].filter(Boolean).join(' | ');
  }
  return [['permissible',t.allowed],['impermissible',t.notAllowed]].map(([prefix,title])=>{
    const items=contentItems(period,prefix,lang);
    if (prefix === 'impermissible' && !items.length) return '';
    return `<div><h3>${e(title)}</h3>${items.length
      ? `<ul>${prefix==='permissible' ? allowedItemsWithOverlaps(period,active||[],lang).map((item,index)=>{
        const copy=overlapCopy[lang],id=`allowed-overlap-${e(period.id)}-${index}`;
        const indicator=(suffix,symbol,label,body,extra='')=>`<span class="allowed-overlap"><sup><button type="button" class="overlap-button${extra?` ${extra}`:''}" aria-label="${e(label)}" aria-expanded="false" aria-controls="${id}-${suffix}" aria-describedby="${id}-${suffix}">${symbol}</button></sup><span class="overlap-popup" id="${id}-${suffix}" role="tooltip" hidden>${body}</span></span>`;
        return `<li>${e(item.label)}${item.matches.length?indicator('shared',`+${item.matches.length}`,copy.label(item.label,item.matches.length),item.matches.map(match=>`<span>${e(copy.alsoIn(match.name))}</span>`).join('')):''}${item.grayArea?indicator('gray','⚠️',`${item.label}: ${grayAreaCopy[lang]}`,e(grayAreaCopy[lang]),'gray-area-button'):''}</li>`;
      }).join('') : items.map(item=>`<li>${e(item)}</li>`).join('')}</ul>`
      : `<p class="unspecified">${e(t.noneSpecified)}</p>`}</div>`;
  }).join('');
}
export function currentCard(active,lang,t,relativeDay=0){if(!active.length)return `<section class="card"><p>${t.empty}</p></section>`;const [p,...others]=active;return `<section class="card primary" aria-labelledby="current-title"><span class="season-mark" aria-hidden="true">${e(p.emoji)}</span><p class="eyebrow">${relativeDay!==0?t.onDate:t.now}</p><h2 id="current-title">${e(localized(p,'name',lang))}</h2><p class="date-range">${e(range(p,t))}</p><p class="description">${e(localized(p,'description',lang))}</p><div class="suggestions">${suggestions(p,lang,t,active)}</div>${others.length?`<div class="overlaps"><p class="eyebrow">${t.also}</p>${others.map(o=>`<details><summary><span class="overlap-emoji" aria-hidden="true">${e(o.emoji)}</span>${e(localized(o,'name',lang))}<span>${e(range(o,t))}</span></summary><p>${e(localized(o,'description',lang))}</p><div class="suggestions">${suggestions(o,lang,t)}</div></details>`).join('')}</div>`:''}</section>`;}
export function upcomingCard(next,lang,t){if(!next)return '';const p=next.added[0]||next.active[0];return `<section class="card upcoming"><div><p class="eyebrow">${t.next}</p><h2>${next.added.length?next.added.map(p=>e(localized(p,'name',lang))).join(' · '):t.ending}</h2><p class="date-range">${e(formatDate(next.date,t,true))}</p><p>${p?e(localized(p,'description',lang)):t.soon}</p>${next.ended.length?`<p class="ending">${t.ends}: ${next.ended.map(p=>e(localized(p,'name',lang))).join(' · ')}</p>`:''}</div><div class="countdown"><p>${next.added.length?t.begins:t.reset}</p><strong>${e(t.days(next.days))}</strong></div></section>`;}
