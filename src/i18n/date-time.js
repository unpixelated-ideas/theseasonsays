// Explicit labels keep the UI localized even on browsers without Irish ICU data.
export const dateTimeLabels = {
  en: { localZone: 'Local time zone' },
  ko: { localZone: '현지 시간대' },
  ga: {
    localZone: 'Crios ama áitiúil',
    months: ['Eanáir', 'Feabhra', 'Márta', 'Aibreán', 'Bealtaine', 'Meitheamh',
      'Iúil', 'Lúnasa', 'Meán Fómhair', 'Deireadh Fómhair', 'Samhain', 'Nollaig'],
    weekdays: ['Dé Domhnaigh', 'Dé Luain', 'Dé Máirt', 'Dé Céadaoin',
      'Déardaoin', 'Dé hAoine', 'Dé Sathairn'],
  },
};

// Keys are the browser's English metazone names, not inferred UTC offsets.
// This preserves its actual standard/daylight-saving determination.
export const zoneNames = {
  'Eastern Standard Time': ['북미 동부 표준시', 'Am Caighdeánach Oirthear Mheiriceá Thuaidh'],
  'Eastern Daylight Time': ['북미 동부 하계 표준시', 'Am Samhraidh Oirthear Mheiriceá Thuaidh'],
  'Central Standard Time': ['북미 중부 표준시', 'Am Caighdeánach Lár Mheiriceá Thuaidh'],
  'Central Daylight Time': ['북미 중부 하계 표준시', 'Am Samhraidh Lár Mheiriceá Thuaidh'],
  'Mountain Standard Time': ['북미 산악 표준시', 'Am Caighdeánach Sléibhte Mheiriceá Thuaidh'],
  'Mountain Daylight Time': ['북미 산악 하계 표준시', 'Am Samhraidh Sléibhte Mheiriceá Thuaidh'],
  'Pacific Standard Time': ['북미 태평양 표준시', 'Am Caighdeánach an Aigéin Chiúin'],
  'Pacific Daylight Time': ['북미 태평양 하계 표준시', 'Am Samhraidh an Aigéin Chiúin'],
  'Korean Standard Time': ['대한민국 표준시', 'Am Caighdeánach na Cóiré'],
  'Japan Standard Time': ['일본 표준시', 'Am Caighdeánach na Seapáine'],
  'Irish Standard Time': ['아일랜드 표준시', 'Am Caighdeánach na hÉireann'],
  'Greenwich Mean Time': ['그리니치 표준시', 'Meán-Am Greenwich'],
  'British Summer Time': ['영국 하계 표준시', 'Am Samhraidh na Breataine'],
  'Coordinated Universal Time': ['협정 세계시', 'Am Uilíoch Lárnach'],
};
