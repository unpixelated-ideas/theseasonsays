export const localDate = (y,m,d) => new Date(y,m-1,d,12);
export const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const dayNumber = d => Math.round(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
export const difference = (a,b) => dayNumber(a)-dayNumber(b);
export const addDays = (d,n) => localDate(d.getFullYear(),d.getMonth()+1,d.getDate()+n);
export const daysInYear = y => difference(localDate(y+1,1,1),localDate(y,1,1));
export function fromKey(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const [y,m,d]=s.split('-').map(Number),date=localDate(y,m,d);return key(date)===s?date:null;}
export function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;return localDate(y,Math.floor(n/31),n%31+1);}
export function weekday(y,month,day,n){let d=localDate(y,month,n===-1?new Date(y,month,0).getDate():1);return addDays(d,n===-1?-((d.getDay()-day+7)%7):(day-d.getDay()+7)%7+7*(n-1));}
