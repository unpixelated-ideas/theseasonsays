import { parseCSV } from './csv.js';
import { localDate, addDays, easter, weekday, difference, fromKey } from './dates.js';

const events = new Set([
  'spring', 'summer', 'autumn', 'winter', 'lunar-new-year', 'chuseok',
  'easter', 'memorial', 'labor', 'thanksgiving',
]);
const rulePattern = /^([a-z-]+|\d{2}-\d{2})([+-]\d+)?$/;

export function validRule(rule) {
  const match = rulePattern.exec(rule || '');
  if (!match) return false;
  if (events.has(match[1])) return true;
  if (!/^\d{2}-\d{2}$/.test(match[1])) return false;
  const [month, day] = match[1].split('-').map(Number);
  return month >= 1 && month <= 12 && day >= 1 &&
    day <= new Date(2024, month, 0).getDate();
}

export function parseCalendar(text, warn = console.warn) {
  const seen = new Set();
  return parseCSV(text, warn).filter(row => {
    const error = !row.id ? 'missing id'
      : seen.has(row.id) ? 'duplicate id'
      : !row.name_en ? 'missing name_en'
      : !validRule(row.start_rule) || !validRule(row.end_rule) ? 'invalid date rule'
      : null;
    if (error) {
      warn(`calendar.csv line ${row._line}: ${error} (${row.id})`);
      return false;
    }
    seen.add(row.id);
    if (row.impermissible_end_rule && !validRule(row.impermissible_end_rule)) {
      warn(`calendar.csv line ${row._line}: invalid impermissible_end_rule; ignoring cutoff`);
      row.impermissible_end_rule = '';
    }
    if (row.impermissible_override_start_rule && !validRule(row.impermissible_override_start_rule)) {
      warn(`calendar.csv line ${row._line}: invalid impermissible_override_start_rule; ignoring override`);
      row.impermissible_override_start_rule = '';
    }
    for (const field of ['impermissible_interim_start_rule', 'impermissible_interim_end_rule']) {
      if (row[field] && !validRule(row[field])) {
        warn(`calendar.csv line ${row._line}: invalid ${field}; ignoring interim window`);
        row.impermissible_interim_source = '';
      }
    }
    if (!Number.isFinite(Number(row.priority))) {
      warn(`calendar.csv line ${row._line}: invalid priority; using 0`);
      row.priority = '0';
    }
    return true;
  });
}

export function parseAnnual(text, warn = console.warn) {
  const result = new Map();
  for (const row of parseCSV(text, warn)) {
    const id = `${row.year}:${row.event}`;
    const validDate = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:00Z)?$/.test(row.date)
      && fromKey(row.date.slice(0, 10))
      && row.date.startsWith(`${row.year}-`)
      && !isNaN(Date.parse(row.date));
    if (!/^\d{4}$/.test(row.year) || !events.has(row.event) || !validDate || result.has(id)) {
      warn(`annual-dates.csv line ${row._line}: invalid or duplicate event`);
      continue;
    }
    result.set(id, row.date);
  }
  return result;
}

export function resolve(rule, year, annual) {
  const [, base, offset] = rulePattern.exec(rule);
  let date;
  if (/^\d/.test(base)) {
    const [month, day] = base.split('-').map(Number);
    date = localDate(year, month, day);
    // A leap-day-only rule does not silently move to March in ordinary years.
    if (date.getMonth() + 1 !== month || date.getDate() !== day) return null;
  } else if (base === 'easter') {
    date = easter(year);
  } else if (base === 'memorial') {
    date = weekday(year, 5, 1, -1);
  } else if (base === 'labor') {
    date = weekday(year, 9, 1, 1);
  } else if (base === 'thanksgiving') {
    date = weekday(year, 11, 4, 4);
  } else {
    const stored = annual.get(`${year}:${base}`);
    if (!stored) return null;
    // Only astronomical instants convert to the visitor's time zone.
    date = stored.includes('T') ? new Date(stored) : localDate(...stored.split('-').map(Number));
  }
  return addDays(date, Number(offset || 0));
}

export function periodsForYear(rows, annual, year) {
  return rows.flatMap(row => {
    const start = resolve(row.start_rule, year, annual);
    let end = resolve(row.end_rule, year, annual);
    if (!start || !end) return [];
    if (difference(end, start) < 0) end = resolve(row.end_rule, year + 1, annual);
    return end ? [{ ...row, start, end }] : [];
  }).sort((a, b) => difference(a.start, b.start) || Number(b.priority) - Number(a.priority));
}

export function activeOn(rows, annual, date) {
  return [date.getFullYear() - 1, date.getFullYear()]
    .flatMap(year => periodsForYear(rows, annual, year))
    .filter(period => difference(date, period.start) >= 0 && difference(period.end, date) >= 0)
    .map(period => {
      if (period.id === 'autumn' && difference(date, resolve('thanksgiving+1', date.getFullYear(), annual)) >= 0) {
        const result = { ...period, autumnGrayArea: date.getMonth() === 10 };
        for (const field of Object.keys(result)) {
          if (/^impermissible_(decor|food|activities|media)_/.test(field)) result[field] = '';
          if (date.getMonth() === 11 && /^permissible_(decor|food|activities|media)_/.test(field)) result[field] = '';
        }
        if (date.getMonth() === 11) {
          const winterAutumn = {
            en: ['Sweater-weather themes', 'Warm cider'],
            ko: ['스웨터가 어울리는 날씨 테마', '따뜻한 사과 사이다'],
            ga: ['Téamaí aimsire geansaí', 'Leann úll te'],
          };
          for (const [language, [sweater, cider]] of Object.entries(winterAutumn)) {
            result[`permissible_decor_${language}`] = sweater;
            result[`permissible_food_${language}`] = cider;
          }
        }
        return result;
      }
      // Holiday Season has no restrictions during November.
      if (period.id === 'holiday' && date.getMonth() === 10) {
        return Object.fromEntries(Object.entries(period).map(([field, value]) =>
          [field, /^impermissible_(decor|food|activities|media)_/.test(field) ? '' : value]));
      }
      // An explicitly dated override reuses another row's maintained content.
      if (period.impermissible_override_start_rule && period.impermissible_override_source) {
        const start = resolve(period.impermissible_override_start_rule, date.getFullYear(), annual);
        const source = rows.find(row => row.id === period.impermissible_override_source);
        if (source && start && difference(date, start) >= 0) {
          const result = { ...period };
          for (const field of Object.keys(result)) {
            if (/^impermissible_(decor|food|activities|media)_/.test(field)) result[field] = source[field] || '';
          }
          return result;
        }
      }
      if (period.impermissible_interim_source && period.impermissible_interim_start_rule && period.impermissible_interim_end_rule) {
        const start = resolve(period.impermissible_interim_start_rule, date.getFullYear(), annual);
        const end = resolve(period.impermissible_interim_end_rule, date.getFullYear(), annual);
        const source = rows.find(row => row.id === period.impermissible_interim_source);
        if (source && start && end && difference(date, start) >= 0 && difference(end, date) >= 0) {
          const result = { ...period };
          for (const field of Object.keys(result)) {
            if (/^impermissible_(decor|food|activities|media)_/.test(field)) result[field] = source[period.impermissible_interim_source_prefix === 'permissible' ? field.replace(/^impermissible_/, 'permissible_') : field] || '';
          }
          return result;
        }
      }
      if (!period.impermissible_end_rule) return period;
      let cutoff = resolve(period.impermissible_end_rule, period.start.getFullYear(), annual);
      // Winter starts in December; its January cutoff belongs to the next year.
      if (cutoff && difference(cutoff, period.start) < 0) {
        cutoff = resolve(period.impermissible_end_rule, period.start.getFullYear() + 1, annual);
      }
      if (!cutoff || difference(date, cutoff) <= 0) return period;
      // Clear only this resolved instance; the editable CSV record stays intact.
      return Object.fromEntries(Object.entries(period).map(([field, value]) =>
        [field, /^impermissible_(decor|food|activities|media)_/.test(field) ? '' : value]));
    })
    .sort((a, b) => Number(b.priority) - Number(a.priority));
}

export function nextChange(rows, annual, date) {
  const current = activeOn(rows, annual, date);
  // Endings matter too: January 7 is a meaningful change without a new row.
  const candidates = [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1]
    .flatMap(year => periodsForYear(rows, annual, year))
    .flatMap(period => [period.start, addDays(period.end, 1)])
    .filter(candidate => difference(candidate, date) > 0)
    .sort(difference);
  for (const candidate of candidates) {
    const active = activeOn(rows, annual, candidate);
    if (active.map(period => period.id).join() !== current.map(period => period.id).join()) {
      return {
        date: candidate, active,
        added: active.filter(period => !current.some(old => old.id === period.id)),
        ended: current.filter(period => !active.some(next => next.id === period.id)),
        days: difference(candidate, date),
      };
    }
  }
  return null;
}
