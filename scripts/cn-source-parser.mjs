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
export function parseTencentAugmentPool(id, payload) {
  assert(String(payload.championId) === String(id), `英雄 ${id} 返回错误英雄数据`);
  const raw = payload.championAugments?.find(entry => String(entry[0]) === String(id))?.[1];
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  assert(data?.source === 'tencent' && data?.region === 'CN', `英雄 ${id} 缺少腾讯国服来源`);
  const rows = Object.entries(data.augments ?? {}).map(([id, value]) => ({id, tier: value.tier, rank: Number(value.rank)}));
  assert(rows.length >= 10, `英雄 ${id} 国服强化池覆盖不足`);
  return rows.sort((a,b)=>a.rank-b.rank);
}
