import { dateTimeLabels, zoneNames } from '../i18n/date-time.js';

export function formatDate(date, messages, full = false, includeYear = false) {
  const language = messages.locale.split('-')[0];
  if (language === 'ga') {
    const labels = dateTimeLabels.ga;
    const monthDay = `${date.getDate()} ${labels.months[date.getMonth()]}`;
    return full
      ? `${labels.weekdays[date.getDay()]} ${monthDay} ${date.getFullYear()}`
      : `${monthDay}${includeYear ? ` ${date.getFullYear()}` : ''}`;
  }
  return new Intl.DateTimeFormat(messages.locale, full
    ? { dateStyle: 'full' }
    : { month: 'long', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}) }).format(date);
}

export function formatTimeZone(date, locale, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const language = locale.split('-')[0];
  const part = (languageTag, style) => new Intl.DateTimeFormat(languageTag, {
    timeZone, timeZoneName: style,
  }).formatToParts(date).find(value => value.type === 'timeZoneName')?.value || '';
  const english = part('en-US', 'long');
  const localized = part(locale, 'long');
  const offset = part('en-US', 'longOffset').replace('GMT', 'UTC').replace('-', '−');
  if (language === 'en') {
    const short = part(locale, 'short');
    return `${english}${short && short !== english ? ` (${short})` : ''} · ${offset}`;
  }
  const known = zoneNames[english]?.[language === 'ko' ? 0 : 1];
  // Unknown zones retain their accurate offset without leaking an English name
  // or an untranslated IANA identifier when locale data are unavailable.
  const name = known || (localized && localized !== english && !/^(GMT|UTC)/.test(localized)
    ? localized : dateTimeLabels[language].localZone);
  return `${name} · ${offset}`;
}
