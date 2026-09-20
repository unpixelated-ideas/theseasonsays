// RFC-style quoted cells, escaped quotes, CRLF, and embedded newlines.
export function parseCSV(text,warn=console.warn){
 const rows=[];let row=[],cell='',quoted=false,line=1,start=1;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<=text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else if(c===undefined){warn(`CSV line ${start}: unclosed quote`);return [];}else{cell+=c;if(c==='\n')line++;}}else if(c==='"'&&cell==='')quoted=true;else if(c===',' ){row.push(cell);cell='';}else if(c==='\n'||c===undefined){row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push({cells:row,line:start});row=[];cell='';line++;start=line;}else cell+=c;}
 if(!rows.length)return [];const headers=rows.shift().cells.map(x=>x.trim());if(new Set(headers).size!==headers.length){warn('CSV: duplicate headers');return [];}
 return rows.flatMap(({cells,line})=>{if(cells.length!==headers.length){warn(`CSV line ${line}: expected ${headers.length} cells, got ${cells.length}`);return [];}return [{...Object.fromEntries(headers.map((h,i)=>[h,cells[i].trim()])),_line:line}];});
}
export function parseColors(text,warn=console.warn){const map=new Map();for(const r of parseCSV(text,warn)){const [month,day]=r.date_mm_dd?.split('-')||[r.month,r.day];const m=Number(month),d=Number(day);if(!Number.isInteger(m)||!Number.isInteger(d)||m<1||m>12||d<1||d>new Date(2024,m,0).getDate()){warn(`daily-colors.csv line ${r._line}: invalid date`);continue;}const id=`${m}-${d}`;if(map.has(id)){warn(`daily-colors.csv line ${r._line}: duplicate date ${id}`);continue;}for(const field of ['light_mode_color','dark_mode_color','base_seasonal_color','light_background','light_text','light_slider_accent','dark_background','dark_text','dark_slider_accent'])if(r[field]&&!/^#[0-9a-f]{6}$/i.test(r[field])){warn(`daily-colors.csv line ${r._line}: invalid ${field}`);r[field]='';}map.set(id,r);}if(map.size!==366)warn(`daily-colors.csv: expected 366 dates, found ${map.size}`);return map;}
export function backgroundFor(map,date,mode,fallback){const row=map.get(`${date.getMonth()+1}-${date.getDate()}`);return row?.[`${mode}_background`]||row?.[`${mode}_mode_color`]||fallback[mode];}

export function paletteFor(map,date,mode,fallback) {
 const row=map.get(`${date.getMonth()+1}-${date.getDate()}`);
 return {background:backgroundFor(map,date,mode,{[mode]:fallback[mode].background}),
  text:row?.[`${mode}_text`]||fallback[mode].text,
  slider:row?.[`${mode}_slider_accent`]||fallback[mode].slider};
}
