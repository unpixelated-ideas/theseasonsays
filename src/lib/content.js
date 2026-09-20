const categories = ['decor', 'food', 'activities', 'media'];
const split = value => (value || '').split('|').map(item => item.trim()).filter(Boolean);
const normalize = value => value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
export function contentItems(period, prefix, language) {
  return [...new Map(categories.flatMap(category => split(period[`${prefix}_${category}_${language}`]))
    .map(item => [normalize(item), item])).values()];
}

function allowedEntries(period, language) {
  const entries = new Map();
  for (const category of categories) {
    const english = (period[`permissible_${category}_en`] || '').split('|');
    const translated = (period[`permissible_${category}_${language}`] || '').split('|');
    english.forEach((text, index) => {
      const key = normalize(text);
      if (key && !entries.has(key)) entries.set(key, {key, label: (translated[index] || '').trim()});
    });
  }
  return entries;
}

// active must be the selected date's activeOn result, preserving calendar priority.
export function allowedItemsWithOverlaps(period, active, language) {
  const others = new Map();
  for (const event of active) {
    if (event.id !== period.id && !others.has(event.id)) {
      others.set(event.id, {id: event.id, name: event[`name_${language}`] || '', items: allowedEntries(event, 'en')});
    }
  }
  return [...allowedEntries(period, language).values()].filter(item => item.label).map(item => ({
    ...item,
    grayArea: Boolean(period.autumnGrayArea) && !['sweater-weather themes', 'warm or cold cider'].includes(item.key),
    matches: [...others.values()].filter(event => event.items.has(item.key)).map(({id, name}) => ({id, name})),
  }));
}
