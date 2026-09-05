const assert = (ok, message) => { if (!ok) throw new Error(message); };
const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
const clean = s => decode(s).replace(/<[^>]*>/g, '').trim();
export function parseCatalog(html) {
  const catalog = [];
  for (const section of html.split('<section data-augment-tier>').slice(1)) {
    const tier = section.match(/>T([1-5])<\/span>/)?.[1];
    for (const [article] of section.matchAll(/<article\b[\s\S]*?<\/article>/g)) {
      const id = article.match(/href="\/zh-CN\/augments\/(\d+)"/)?.[1];
      const name = article.match(/<p class="mb-2 truncate text-center text-sm font-medium text-card-foreground">([^<]+)<\/p>/)?.[1];
      const rarity = article.match(/>(棱彩|黄金|白银)<\/span>/)?.[1];
      const icon = article.match(/<img src="([^"]+)"/)?.[1];
      const description = article.match(/<a href="\/zh-CN\/augments\/\d+"[^>]* title="([^"]*)"/)?.[1];
      assert(id && name && rarity && icon && description && tier, '国服强化目录结构不完整');
      catalog.push({ id, name: clean(name), rarity, icon, description: clean(description), tier: ({1:'S+',2:'S',3:'A',4:'B',5:'B'})[tier] });
    }
  }
  assert(catalog.length >= 200 && new Set(catalog.map(a=>a.id)).size === catalog.length, '国服强化目录覆盖不足或重复');
  return catalog;
}
export function parsePools(id, html) {
  assert(html.includes('国服'), `英雄 ${id} 无国服来源标识`);
  const names = [];
  for (const [row] of html.matchAll(/<tr\b[^>]*data-row\b[^>]*>[\s\S]*?<\/tr>/g)) {
    const augmentId = row.match(/href="\/zh-CN\/augments\/(\d+)"/)?.[1];
    const name = row.match(/<img[^>]* alt="([^"]+)"/)?.[1];
    if (augmentId && name) names.push({ id: augmentId, name: clean(name) });
  }
  assert(names.length >= 10, `英雄 ${id} 国服观察强化不足`);
  const section = html.match(/<section id="item-builds"[\s\S]*?<\/section>/)?.[0];
  assert(section, `英雄 ${id} 缺少出装区块`);
  const patch = section.match(/>\s*(\d+\.\d+)\s*<\/span>/)?.[1];
  const coreStart = section.indexOf('>核心装备');
  const situationalStart = section.indexOf('情境装备');
  const end = section.indexOf('出门装');
  assert(coreStart >= 0 && situationalStart > coreStart && end > situationalStart && patch, `英雄 ${id} 出装结构不完整`);
  const ids = text => [...text.matchAll(/<img[^>]*src="[^"]*\/item-icons\/(\d+)\.png"/g)].map(m=>m[1]);
  const core = [...new Set(ids(section.slice(coreStart, situationalStart)))];
  const items = [...new Set([...core, ...ids(section.slice(situationalStart, end))])];
  assert(core.length >= 3 && items.length >= 6, `英雄 ${id} 装备候选覆盖不足`);
  return { augments: names, core, items, patch };
}
export function parseTencentAugmentPool(id, payload) {
  assert(String(payload.championId) === String(id), `英雄 ${id} 返回错误英雄数据`);
  const raw = payload.championAugments?.find(entry => String(entry[0]) === String(id))?.[1];
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  assert(data?.source === 'tencent' && data?.region === 'CN', `英雄 ${id} 缺少腾讯国服来源`);
  const rows = Object.entries(data.augments ?? {}).map(([id, value]) => ({id, tier: value.tier, rank: Number(value.rank)}));
  assert(rows.length >= 10, `英雄 ${id} 国服强化池覆盖不足`);
  return rows.sort((a,b)=>a.rank-b.rank);
}
export function parseOfficialBuild(response) {
  let data=response?.data?._fieldValues;
  data=data ? Object.values(data)[0] : (response?.data?.result ?? response?.result ?? response?.data ?? response);
  data=typeof data==='string'?JSON.parse(data):data;
  assert(data?.dtstatdate, '腾讯出装缺少数据日期');
  const parse=value=>!value||value==='-1'?[]:value.split('#').filter(Boolean).map(row=>row.split('_')[0].split(',').filter(id=>/^\d+$/.test(id)&&Number(id)>0));
  const core=parse(data.core_details).flat();
  const items=[...core,...['shoes_details','forth_details','fifth_details','sixth_details'].flatMap(k=>parse(data[k]).flat())];
  assert(core.length>=3 && new Set(items).size>=6,'腾讯出装候选覆盖不足');
  return {date:data.dtstatdate,core:[...new Set(core)],items:[...new Set(items)]};
}
