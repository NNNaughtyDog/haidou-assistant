import { readFile } from "node:fs/promises";
import process from "node:process";

const ARAMGG_PATH = new URL("../app/aramgg-snapshot.ts", import.meta.url);
const HEXDATA_PATH = new URL("../app/hexdata-snapshot.ts", import.meta.url);
const ITEM_PATH = new URL("../app/item-snapshot.ts", import.meta.url);
const MIN_HEROES = 170;
const MIN_AUGMENTS = 200;
const MIN_ITEMS = 100;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const readConsts = async (path, names) => {
  const source = await readFile(path, "utf8");
  return Object.fromEntries(names.map((name) => {
    const marker = `export const ${name} = `;
    const start = source.indexOf(marker);
    assert(start >= 0, `${path.pathname} 缺少 ${name}`);
    const valueStart = start + marker.length;
    const end = source.indexOf(" as const;", valueStart);
    assert(end >= 0, `${name} 结尾不完整`);
    return [name, JSON.parse(source.slice(valueStart, end))];
  }));
};

const readSnapshot = async () => {
  const aramgg = await readConsts(ARAMGG_PATH, ["aramggSnapshot", "cnStatsByKey", "aramggAugmentTierByName"]);
  const hexdata = await readConsts(HEXDATA_PATH, ["hexdataSnapshot", "cnStatsByKey", "heroAugmentStatsByKey", "augmentCatalogSnapshot"]);
  const items = await readConsts(ITEM_PATH, ["itemSnapshot", "itemCatalogSnapshot", "heroItemPoolByKey", "heroCoreItemsByKey"]);
  return { ...aramgg, hexdataCnStatsByKey: hexdata.cnStatsByKey, ...hexdata, cnStatsByKey: aramgg.cnStatsByKey, ...items };
};

const summarize = (snapshot) => ({
  patch: snapshot.hexdataSnapshot.patch,
  date: snapshot.hexdataSnapshot.date,
  cnPatch: snapshot.aramggSnapshot.patch,
  cnDate: snapshot.aramggSnapshot.date,
  heroes: Object.keys(snapshot.hexdataCnStatsByKey).length,
  cnHeroes: Object.keys(snapshot.cnStatsByKey).length,
  cnAugmentTiers: Object.keys(snapshot.aramggAugmentTierByName).length,
  heroAugmentPools: Object.keys(snapshot.heroAugmentStatsByKey).length,
  augments: snapshot.augmentCatalogSnapshot.length,
  items: snapshot.itemCatalogSnapshot.length,
  heroItemPools: Object.keys(snapshot.heroItemPoolByKey).length,
});

const validate = (snapshot) => {
  const summary = summarize(snapshot);
  assert(/^\d+\.\d+(?:\.\d+)?$/.test(summary.patch), `补丁号异常：${summary.patch}`);
  assert(/^\d+\.\d+$/.test(summary.cnPatch), `国服补丁号异常：${summary.cnPatch}`);
  assert(summary.patch.split(".").at(-1) === summary.cnPatch.split(".").at(-1), `ARAMGG ${summary.cnPatch} 与 Hexdata ${summary.patch} 小版本不一致`);
  assert(snapshot.itemSnapshot.patch === summary.patch, "英雄与装备快照补丁不一致");
  assert(snapshot.itemSnapshot.assetVersion, "缺少装备素材版本");
  assert(summary.heroes >= MIN_HEROES, `Hexdata 英雄仅 ${summary.heroes}`);
  assert(summary.cnHeroes >= MIN_HEROES, `国服英雄仅 ${summary.cnHeroes}`);
  assert(summary.cnAugmentTiers >= MIN_AUGMENTS, `国服强化梯度仅 ${summary.cnAugmentTiers}`);
  assert(summary.heroAugmentPools >= MIN_HEROES, `英雄强化池仅 ${summary.heroAugmentPools}`);
  assert(summary.augments >= MIN_AUGMENTS, `强化目录仅 ${summary.augments}`);
  assert(summary.items >= MIN_ITEMS, `当前模式成装仅 ${summary.items}`);
  assert(summary.heroItemPools >= MIN_HEROES, `英雄装备池仅 ${summary.heroItemPools}`);
  assert(snapshot.aramggSnapshot.heroCount === summary.cnHeroes, "国服英雄元数据数量与榜单不一致");
  assert(snapshot.aramggSnapshot.augmentTierCount === summary.cnAugmentTiers, "强化梯度元数据数量与目录不一致");
  assert(snapshot.itemSnapshot.itemCount === summary.items, "装备元数据数量与目录不一致");
  assert(snapshot.itemSnapshot.heroPoolCount === summary.heroItemPools, "英雄装备池元数据数量不一致");

  const ranks = new Set();
  for (const [heroId, hero] of Object.entries(snapshot.cnStatsByKey)) {
    assert(["T1", "T2", "T3", "T4", "T5"].includes(hero.tier), `英雄 ${heroId} 层级异常`);
    assert(Number.isInteger(hero.rank) && hero.rank >= 1 && hero.rank <= summary.cnHeroes, `英雄 ${heroId} 排名异常`);
    assert(!ranks.has(hero.rank), `国服排名重复：${hero.rank}`);
    assert(Number.isFinite(hero.winRate) && hero.winRate >= 0 && hero.winRate <= 100, `英雄 ${heroId} 胜率异常`);
    assert(Number.isFinite(hero.pickRate) && hero.pickRate >= 0 && hero.pickRate <= 100, `英雄 ${heroId} 选取率异常`);
    ranks.add(hero.rank);
  }
  assert(ranks.size === summary.cnHeroes, "国服排名覆盖不完整");
  for (const [name, tier] of Object.entries(snapshot.aramggAugmentTierByName)) {
    assert(name, "强化梯度含空名称");
    assert(["S+", "S", "A", "B"].includes(tier), `强化 ${name} 梯度异常：${tier}`);
  }

  const itemIds = new Set();
  const itemNames = new Set();
  for (const item of snapshot.itemCatalogSnapshot) {
    assert(item.id && !itemIds.has(item.id), `装备 ID 重复：${item.id}`);
    assert(item.name && !itemNames.has(item.name), `装备名称重复：${item.name}`);
    assert(Array.isArray(item.tags) && item.tags.length > 0, `装备 ${item.name} 缺少标签`);
    assert(Array.isArray(item.categories) && item.categories.length > 0, `装备 ${item.name} 缺少分类`);
    assert(Number.isFinite(item.cost) && item.cost > 0, `装备 ${item.name} 价格无效`);
    itemIds.add(item.id);
    itemNames.add(item.name);
  }
  for (const [heroId, pool] of Object.entries(snapshot.heroItemPoolByKey)) {
    assert(Array.isArray(pool) && pool.length >= 6, `英雄 ${heroId} 装备池不足 6 件`);
    assert(pool.length === new Set(pool).size, `英雄 ${heroId} 装备池有重复项`);
    for (const itemId of pool) assert(itemIds.has(itemId), `英雄 ${heroId} 装备池含目录外 ID：${itemId}`);
    const core = snapshot.heroCoreItemsByKey[heroId] ?? [];
    assert(core.length >= 3, `英雄 ${heroId} 核心路线不足 3 件`);
    for (const itemId of core) assert(pool.includes(itemId), `英雄 ${heroId} 核心装备 ${itemId} 不在专属池`);
  }
  return summary;
};

const summary = validate(await readSnapshot());
const baselineAramggIndex = process.argv.indexOf("--baseline-aramgg");
if (baselineAramggIndex >= 0) {
  const baselinePath = process.argv[baselineAramggIndex + 1];
  assert(baselinePath, "--baseline-aramgg 后缺少路径");
  const baseline = await readConsts(new URL(`file://${baselinePath}`), ["aramggSnapshot", "cnStatsByKey", "aramggAugmentTierByName"]);
  assert(summary.cnDate >= baseline.aramggSnapshot.date, `ARAMGG 数据日期从 ${baseline.aramggSnapshot.date} 回退至 ${summary.cnDate}`);
  assert(summary.cnHeroes >= Object.keys(baseline.cnStatsByKey).length - 2, `国服英雄覆盖从 ${Object.keys(baseline.cnStatsByKey).length} 降至 ${summary.cnHeroes}`);
  assert(summary.cnAugmentTiers >= Object.keys(baseline.aramggAugmentTierByName).length - 5, `强化梯度从 ${Object.keys(baseline.aramggAugmentTierByName).length} 降至 ${summary.cnAugmentTiers}`);
}
const baselineItemsIndex = process.argv.indexOf("--baseline-items");
if (baselineItemsIndex >= 0) {
  const baselinePath = process.argv[baselineItemsIndex + 1];
  assert(baselinePath, "--baseline-items 后缺少路径");
  const baselineItems = await readConsts(new URL(`file://${baselinePath}`), ["itemCatalogSnapshot", "heroItemPoolByKey"]);
  assert(summary.items >= baselineItems.itemCatalogSnapshot.length - 5, `装备目录从 ${baselineItems.itemCatalogSnapshot.length} 降至 ${summary.items}`);
  assert(summary.heroItemPools >= Object.keys(baselineItems.heroItemPoolByKey).length - 2, `英雄装备池覆盖从 ${Object.keys(baselineItems.heroItemPoolByKey).length} 降至 ${summary.heroItemPools}`);
}

const report = `数据校验通过：ARAMGG ${summary.cnPatch} / ${summary.cnDate}；Hexdata ${summary.patch} / ${summary.date}\n国服英雄 ${summary.cnHeroes}；强化梯度 ${summary.cnAugmentTiers}；当前模式成装 ${summary.items}；英雄装备池 ${summary.heroItemPools}`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 数据校验\n\n${report.replaceAll("\n", "  \n")}\n`);
}
