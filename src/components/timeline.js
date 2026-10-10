import { escapeHTML as e, localized } from './views.js';
import { formatDate } from '../lib/formatting.js';
import { key, difference } from '../lib/dates.js';
import { paletteFor } from '../lib/csv.js';
import { site } from '../config/site.js';

export function timelineView(periods, year, lang, t, today, colors) {
  const todayItem = `<li class="timeline-today"><span>${e(t.today)} · <time datetime="${key(today)}">${e(formatDate(today,t))}</time></span></li>`;
  let inserted = year !== today.getFullYear();
  const entries = periods.map(p => {
    let marker = '';
    if (!inserted && difference(p.start, today) > 0) { marker = todayItem; inserted = true; }
    const light = paletteFor(colors,p.start,'light',site.fallbackPalette);
    const dark = paletteFor(colors,p.start,'dark',site.fallbackPalette);
    const category = p.phaseId ? 'phase' : p.category;
    const dates = difference(p.end,p.start) === 0
      ? `<time datetime="${key(p.start)}">${e(formatDate(p.start,t,false,true))}</time>`
      : `<time datetime="${key(p.start)}">${e(formatDate(p.start,t,false,true))}</time> – <time datetime="${key(p.end)}">${e(formatDate(p.end,t,false,true))}</time>`;
    return `${marker}<li class="timeline-entry" data-period="${e(p.phaseId || p.id)}">
      <a class="timeline-card" href="#home?date=${key(p.start)}" style="--period-light:${light.background};--period-dark:${dark.background}">
        <span class="timeline-emoji" aria-hidden="true">${e(p.emoji)}</span>
        <div class="timeline-copy"><p class="eyebrow">${e(t[category])}</p><h2>${e(localized(p,'name',lang))}</h2><p>${e(localized(p,'description',lang))}</p></div>
        <span class="timeline-dates">${dates}</span>
      </a></li>`;
  }).join('');
  return `<section class="reference" aria-labelledby="timeline-title"><h1 id="timeline-title">${e(t.complete)} <span class="timeline-beta">${e(t.beta)}</span></h1><p>${e(t.referenceIntro)}</p>
    <div class="timeline-navigation"><div class="year-controls"><button id="timeline-previous" aria-label="${e(t.previousYear)}" ${year<=site.minYear?'disabled':''}>←</button><label class="year-label"><span class="sr-only">${e(t.year)}</span><select id="year">${Array.from({length:site.maxYear-site.minYear+1},(_,i)=>site.minYear+i).map(y=>`<option ${y===year?'selected':''}>${y}</option>`).join('')}</select></label><button id="timeline-next" aria-label="${e(t.nextYear)}" ${year>=site.maxYear?'disabled':''}>→</button></div><button id="timeline-current" ${year===today.getFullYear()?'disabled':''}>${e(t.currentYear)}</button></div>
    <p class="timeline-hint">${e(t.timelineHint)}</p><ol class="seasonal-timeline">${entries}${!inserted?todayItem:''}</ol></section>`;
}
