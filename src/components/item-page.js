import { dateItems, itemStatus, itemYearOverview } from '../lib/items.js';
import { dateTimeLabels } from '../i18n/date-time.js';
import { itemCopy } from '../i18n/items.js';
import { site } from '../config/site.js';
import { key, fromKey, localDate, difference } from '../lib/dates.js';
import { escapeHTML as e, formatDate } from './views.js';

const statuses = ['allowed', 'gray', 'notAllowed'];
const itemAliases = new Map([
  ['fireworks-decor', 'fireworks-imagery'],
  ['new-year-gift-sets', 'gift-sets'],
  ['happy-new-year-decor', 'new-year-greetings'],
  ['spring-flowers-decor', 'floral-decor'],
  ['summer-floral-decor', 'floral-decor'],
]);
const symbols = { allowed: '✓', gray: '≈', notAllowed: '×' };
const icon = status => `<span class="item-icon" data-status="${status}" aria-hidden="true">${symbols[status]}</span>`;
const supported = date => date && date.getFullYear() >= site.minYear && date.getFullYear() <= site.maxYear;

function annualView(overview, year, date, m, copy) {
  const { segments, totals, days } = overview;
  const startOfYear = localDate(year, 1, 1);
  const applicable = statuses.filter(status => totals[status] > 0);
  const percentage = new Intl.NumberFormat(m.locale, {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
  const monthLabel = new Intl.DateTimeFormat(m.locale, { month: 'short' });
  const localMonths = m.locale.startsWith('ga') ? dateTimeLabels.ga.months : null;
  const range = ({ start, end }) => key(start) === key(end)
    ? formatDate(start, m)
    : copy.period(formatDate(start, m), formatDate(end, m));

  const bar = segments.map(segment =>
    `<span data-status="${segment.status}" style="flex-grow:${segment.days}" title="${e(copy.segment(copy[segment.status], range(segment)))}"></span>`
  ).join('');
  const marker = date.getFullYear() === year
    ? `<span class="item-date-marker" style="left:${100 * (difference(date, startOfYear) + 0.5) / days}%"></span>`
    : '';
  const ticks = [1, 4, 7, 10].map(month => {
    const first = localDate(year, month, 1);
    return `<span style="left:${100 * difference(first, startOfYear) / days}%">${e(localMonths?.[month - 1] ?? monthLabel.format(first))}</span>`;
  }).join('');
  const legend = applicable.map(status => `<li>
    <strong>${icon(status)}${e(copy[status])}</strong>
    <span>${e(copy.days(totals[status], percentage.format(totals[status] / days)))}</span>
  </li>`).join('');

  const rules = applicable.map(status => {
    const dates = segments.filter(segment => segment.status === status).map(range);
    const useComplement = status === 'notAllowed' && totals[status] < days;
    const visibleDates = totals[status] === days ? [copy.allYear] : useComplement ? [copy.otherDates] : dates;
    return `<div class="item-rule">
      <dt>${icon(status)}${e(copy[status])}</dt>
      <dd>${visibleDates.map(text => `<span${useComplement ? ' aria-hidden="true"' : ''}>${e(text)}</span>`).join('')}
        ${useComplement ? `<span class="sr-only">${e(dates.join(' · '))}</span>` : ''}
        ${status === 'gray' ? `<small>${e(copy.grayNote)}</small>` : ''}
      </dd>
    </div>`;
  }).join('');

  return `<div class="item-axis" aria-hidden="true">${ticks}</div>
    <div class="item-bar-wrap" aria-hidden="true"><div class="item-bar">${bar}</div>${marker}</div>
    <ul class="item-legend">${legend}</ul>
    <dl class="item-rules">${rules}</dl>
    <p class="item-inclusive">${e(copy.inclusive)}</p>`;
}

export function createItemPages(rows, annual, catalog) {
  return function renderItem(page, requestedId, language, m, today) {
    const id = itemAliases.get(requestedId) ?? requestedId;
    const copy = itemCopy[language];
    const item = catalog.get(id);
    if (!item) {
      page.innerHTML = `<a class="back" href="#home">← ${e(m.back)}</a><section class="card information"><h1>${e(m.notFound)}</h1></section>`;
      return;
    }

    const supplied = new URLSearchParams(location.hash.split('?')[1] || '').get('date');
    const parsed = fromKey(supplied || '');
    const date = supported(parsed) ? parsed : today;
    const initialYear = Math.min(site.maxYear, Math.max(site.minYear, date.getFullYear()));
    const available = supported(date);
    const status = available ? itemStatus(dateItems(rows, annual, date).get(id)) : null;
    const back = supported(parsed) ? `#home?date=${key(date)}` : '#home';
    document.title = `${item.labels[language]} · ${site.productName[language]}`;

    page.innerHTML = `<article class="item-page">
      <div class="item-toolbar">
        <a class="back" href="${e(back)}">← ${e(m.back)}</a>
        <details class="item-share">
          <summary>${e(copy.share)}</summary>
          <div class="item-share-options">
            <button type="button" id="copy-item">${e(copy.copy)}</button>
            <button type="button" id="copy-dated-item">${e(copy.dated)}</button>
          </div>
        </details>
      </div>
      <div class="card item-details">
        <h1>${e(item.labels[language])}</h1>
        <p class="item-verdict">${available ? icon(status) + e(copy.verdict(copy[status], formatDate(date, m, true))) : e(copy.unavailable)}</p>
        ${supplied && !supported(parsed) ? `<p class="item-note" role="status">${e(copy.invalid)}</p>` : ''}
        ${id === 'holiday-music' ? `<p class="item-note">${e(copy.holiday)}</p>
          ${status === 'notAllowed' && date.getMonth() >= 1 && date.getMonth() <= 10 ? `<p class="item-note">${e(copy.early)}</p>` : ''}` : ''}
        <p class="item-share-status" role="status"></p>
        <section class="item-annual" aria-labelledby="item-annual-title">
          <div class="item-annual-header">
            <h2 id="item-annual-title">${e(copy.annual)}</h2>
            <label class="item-year">${e(copy.year)}
              <select id="item-year">${Array.from({ length: site.maxYear - site.minYear + 1 }, (_, index) => {
                const year = site.minYear + index;
                return `<option value="${year}" ${year === initialYear ? 'selected' : ''}>${year}</option>`;
              }).join('')}</select>
            </label>
          </div>
          <div class="item-overview"></div>
        </section>
      </div>
    </article>`;

    const select = page.querySelector('#item-year');
    const overview = page.querySelector('.item-overview');
    function drawYear() {
      const year = Number(select.value);
      overview.innerHTML = annualView(itemYearOverview(rows, annual, id, year), year, date, m, copy);
    }
    select.onchange = drawYear;
    drawYear();

    const share = page.querySelector('.item-share');
    const summary = share.querySelector('summary');
    const feedback = page.querySelector('.item-share-status');
    share.onkeydown = event => {
      if (event.key === 'Escape' && share.open) {
        share.open = false;
        summary.focus();
      }
    };
    async function copyLink(dated) {
      const url = new URL(location.href);
      url.hash = `item/${id}${dated ? `?date=${key(date)}` : ''}`;
      feedback.replaceChildren();
      try {
        await navigator.clipboard.writeText(url.href);
        if (share.contains(document.activeElement)) summary.focus();
        share.open = false;
        feedback.textContent = copy.copied;
      } catch {
        const input = document.createElement('input');
        input.readOnly = true;
        input.value = url.href;
        input.setAttribute('aria-label', dated ? copy.dated : copy.copy);
        feedback.append(copy.failed + ' ', input);
        input.focus();
        input.select();
      }
    }
    page.querySelector('#copy-item').onclick = () => copyLink(false);
    page.querySelector('#copy-dated-item').onclick = () => copyLink(true);
  };
}
