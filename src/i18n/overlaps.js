export const overlapCopy = {
  en: {alsoIn: name => `Also in ${name}`, label: (item, count) => `${item}: allowed in ${count} other events`},
  ko: {alsoIn: name => `${name}에도 해당`, label: (item, count) => `${item}: 다른 행사 ${count}개에서도 허용됨`},
  ga: {alsoIn: name => `Le linn ${name} freisin`, label: (item, count) => `${item}: ceadaithe le linn ${count} imeacht eile`},
};
export const grayAreaCopy = {
  en: 'These items are in a gray area: not prohibited, but not encouraged.',
  ko: '이 항목들은 애매한 영역에 있습니다. 금지되지는 않지만 권장되지도 않습니다.',
  ga: 'Tá na nithe seo i limistéar éiginnte: níl cosc orthu, ach ní mholtar iad.',
};
