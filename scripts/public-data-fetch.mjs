import { setTimeout } from 'node:timers/promises';
export async function fetchPublic(url, kind = 'json') {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {signal:AbortSignal.timeout(20000),headers:{'user-agent':'haidou-assistant-data-sync/0.4.0'}});
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return kind === 'json' ? await response.json() : await response.text();
    } catch(error) {
      lastError=error;
      if(attempt<2) await setTimeout(1000 * (2 ** attempt));
    }
  }
  throw lastError;
}
export async function fetchPublicFallback(urls, kind='json') {
  const errors=[];
  for(const url of urls) {
    try{return await fetchPublic(url,kind)}catch(error){errors.push(error.message)}
  }
  throw new Error(errors.join('; '));
}
export async function mapLimit(values, limit, fn) {
  const result = new Array(values.length); let cursor=0;
  await Promise.all(Array.from({length:Math.min(limit,values.length)},async()=>{
    while(cursor<values.length){const index=cursor++;result[index]=await fn(values[index]);}
  }));
  return result;
}
export function readConst(source,name) {
  const marker=`export const ${name} = `;
  const start=source.indexOf(marker);
  const end=source.indexOf(' as const;',start+marker.length);
  if(start<0||end<0) throw new Error(`Missing snapshot ${name}`);
  return JSON.parse(source.slice(start+marker.length,end));
}
