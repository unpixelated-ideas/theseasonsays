import test from 'node:test';
import assert from 'node:assert/strict';
import {formatDate, formatTimeZone} from '../src/lib/formatting.js';
import {messages} from '../src/i18n/messages.js';
import {localDate} from '../src/lib/dates.js';

test('Irish full dates, ranges, and month labels use Irish names', () => {
  assert.equal(formatDate(localDate(2026,9,8),messages.ga,true),'Dé Máirt 8 Meán Fómhair 2026');
  assert.equal(formatDate(localDate(2026,1,1),messages.ga),'1 Eanáir');
  assert.equal(formatDate(localDate(2026,12,31),messages.ga),'31 Nollaig');
  assert.equal(formatDate(localDate(2024,2,29),messages.ga,true),'Déardaoin 29 Feabhra 2024');
});

test('Korean and Irish timezone labels preserve New York DST and offsets', () => {
  const summer=new Date('2026-09-08T12:00:00Z'),winter=new Date('2026-01-08T12:00:00Z');
  assert.equal(formatTimeZone(summer,'ko-KR','America/New_York'),'북미 동부 하계 표준시 · UTC−04:00');
  assert.equal(formatTimeZone(winter,'ko-KR','America/New_York'),'북미 동부 표준시 · UTC−05:00');
  assert.match(formatTimeZone(summer,'ga-IE','America/New_York'),/^Am Samhraidh.*UTC−04:00$/);
  assert.match(formatTimeZone(winter,'ga-IE','America/New_York'),/^Am Caighdeánach.*UTC−05:00$/);
  assert.match(formatTimeZone(summer,'ko-KR','Asia/Seoul'),/대한민국 표준시 · UTC\+09:00/);
});

test('English formatting remains English', () => {
  assert.match(formatDate(localDate(2026,9,8),messages.en,true),/Tuesday, September 8, 2026/);
  assert.match(formatTimeZone(new Date('2026-09-08T12:00:00Z'),'en-US','America/New_York'),/Eastern Daylight Time/);
});

test('cross-year ranges put the year alongside each endpoint',async()=>{
 const {range,currentCard}=await import('../src/components/views.js');
 const period={start:localDate(2025,12,21),end:localDate(2026,3,19),name_en:'Winter',emoji:'❄️'};
 assert.equal(range(period,messages.en),'December 21, 2025 – March 19, 2026');
 assert.equal(range(period,messages.ko),'2025년 12월 21일 – 2026년 3월 19일');
 assert.equal(range(period,messages.ga),'21 Nollaig 2025 – 19 Márta 2026');
 assert.match(currentCard([period,period],'en',messages.en),/class="overlap-emoji" aria-hidden="true">❄️/);
});
