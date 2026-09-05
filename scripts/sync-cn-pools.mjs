import {readFile,writeFile} from 'node:fs/promises';
import {fetchPublic,fetchPublicFallback,mapLimit,readConst} from './public-data-fetch.mjs';
import {parseCatalog,parseTencentAugmentPool} from './cn-source-parser.mjs';
import {classifyAugmentTags,classifyItemTags,classifyItemCategories} from './data-catalog-policy.mjs';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const root=new URL('../app/',import.meta.url);
const aram=await readFile(new URL('aramgg-snapshot.ts',root),'utf8');
const meta=readConst(aram,'aramggSnapshot');
const cnStats=readConst(aram,'cnStatsByKey');
const ids=Object.keys(cnStats);
const [html,versions]=await Promise.all([fetchPublic('https://aramgg.com/zh-CN/augments','text'),fetchPublic('https://ddragon.leagueoflegends.com/api/versions.json')]);
const htmlPatch=html.match(/当前数据：版本\s*([\d.]+)，腾讯国服公开统计覆盖/)?.[1];
assert(htmlPatch===meta.patch,'国服强化目录与英雄榜版本不一致');
// ARAMGG uses Riot's public 26.x patch label; Data Dragon uses 16.x.
const parts=meta.patch.split('.');
const assetPrefix=`${Number(parts[0])-10}.${parts[1]}.`;
const assetVersion=versions.find(v=>v.startsWith(assetPrefix));
assert(assetVersion,`找不到与国服 ${meta.patch} 对应的官方素材版本`);
const itemUrl=`https://ddragon.leagueoflegends.com/cdn/${assetVersion}/data/zh_CN/item.json`;
const payload=await fetchPublic(itemUrl);
assert(payload.version===assetVersion && payload.data,'官方装备版本不一致');
const catalog=parseCatalog(html);
const byId=new Map(catalog.map(a=>[a.id,a]));
const pools=await mapLimit(ids,6,async id=>{
  const detail=await fetchPublicFallback([`https://aramgg.com/data/champion-details/${id}.json`,`https://cdn.dtodo.cn/hextech/champion-details/${id}.json`]);
  // Only the Tencent/CN candidate IDs are retained. WORLD match-history and
  // augment win-rate additions are intentionally never persisted.
  const entries=parseTencentAugmentPool(id,detail).filter(a=>byId.has(a.id));
  assert(entries.length>=10,`英雄 ${id} 与当前目录交集不足`);
  return [id,Object.fromEntries(entries.map(a=>[byId.get(a.id).name,{games:0,winRate:null}]))];
});
const itemsByName=new Map();
for(const [id,source] of Object.entries(payload.data).sort(([a],[b])=>Number(a)-Number(b))){
  const maps=source.maps??{};
  const upgrades=(source.into??[]).filter(next=>payload.data[next]?.maps?.['12']);
  if(!maps['12']||!source.gold?.purchasable||source.inStore===false||source.hideFromAll||source.gold.total<1000)continue;
  if(upgrades.length&&!source.tags?.includes('Boots'))continue;
  if(itemsByName.has(source.name))continue;
  itemsByName.set(source.name,{id,name:source.name,tags:classifyItemTags(source.tags??[]),categories:classifyItemCategories(source),cost:source.gold.total});
}
const items=[...itemsByName.values()];
assert(items.length>=100,`官方装备目录覆盖不足：${items.length}`);
const game=await readFile(new URL('game-data.ts',root),'utf8');
const start=game.indexOf('const championCatalog = ')+ 'const championCatalog = '.length;
const champions=JSON.parse(game.slice(start,game.indexOf(' as ChampionCatalogEntry[];',start)));
const heroItemPoolByKey={},heroCoreItemsByKey={};
for(const hero of champions.filter(h=>cnStats[h.key])){
  // Mechanism-based recommendations, never represented as CN match statistics.
  const seeds=hero.items.map(name=>itemsByName.get(name)).filter(Boolean);
  const tags=new Set([...hero.tags,...seeds.flatMap(item=>item.tags)]);
  if(tags.has('普攻')){tags.add('攻击');tags.add('攻速');}
  const preferred=new Set(seeds.map(item=>item.id));
  const scored=items.map(item=>({item,score:(preferred.has(item.id)?100:0)+item.tags.filter(t=>tags.has(t)).length*3})).sort((a,b)=>b.score-a.score||Number(a.item.id)-Number(b.item.id));
  const pool=scored.slice(0,28).map(({item})=>item.id);
  heroItemPoolByKey[hero.key]=pool;
  heroCoreItemsByKey[hero.key]=pool.slice(0,6);
}
const buildId=`cn-${meta.patch}-${meta.date}`;
const writeConsts=(values)=>'// 自动生成：国服公开候选 / 官方客户端目录。不保存外服统计。\n'+Object.entries(values).map(([name,value])=>`export const ${name} = ${JSON.stringify(value,null,2)} as const;\n`).join('\n');
const previous=readConst(await readFile(new URL('hexdata-snapshot.ts',root),'utf8'),'hexdataSnapshot');
assert(meta.date>=previous.date,'候选数据日期倒退');
const poolSource={buildId,patch:meta.patch,date:meta.date,generatedAt:meta.date,observedHeroCount:ids.length,source:'ARAMGG / Tencent CN',region:'CN',scope:'公开国服候选，非完整可选范围'};
const poolText=writeConsts({hexdataSnapshot:poolSource,cnStatsByKey:cnStats,heroAugmentStatsByKey:Object.fromEntries(pools),augmentCatalogSnapshot:catalog.map((a,index)=>({id:a.id,name:a.name,rarity:a.rarity,tier:a.tier,tags:classifyAugmentTags(a),summary:a.description,rank:index+1,icon:a.icon,winRate:0,pickRate:0,games:0}))});
const itemText=writeConsts({itemSnapshot:{buildId,patch:meta.patch,assetVersion,date:meta.date,generatedAt:meta.date,itemCount:items.length,heroPoolCount:Object.keys(heroItemPoolByKey).length,source:itemUrl,recommendationSource:'英雄机制规则',scope:'官方嚎哭深渊客户端成装目录；出装为机制建议'},itemCatalogSnapshot:items,heroItemPoolByKey,heroCoreItemsByKey});
// Both complete outputs are built before either existing snapshot is replaced.
await writeFile(new URL('hexdata-snapshot.ts',root),poolText);
await writeFile(new URL('item-snapshot.ts',root),itemText);
console.log(`国服候选 ${meta.patch}/${meta.date}: ${ids.length} 英雄，${catalog.length} 强化；官方 ${assetVersion} 装备 ${items.length} 件；机制出装 ${Object.keys(heroItemPoolByKey).length} 英雄`);
