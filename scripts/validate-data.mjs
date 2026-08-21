import { readFile } from "node:fs/promises";
import process from "node:process";

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

const readSnapshot = async (hexPath = HEXDATA_PATH, itemPath = ITEM_PATH) => ({
  ...(await readConsts(hexPath, ["hexdataSnapshot", "cnStatsByKey", "heroAugmentStatsByKey", "augmentCatalogSnapshot"])),
  ...(await readConsts(itemPath, ["itemSnapshot", "itemCatalogSnapshot", "heroItemPoolByKey", "heroCoreItemsByKey"])),
});

const summarize = (snapshot) => ({
  patch: snapshot.hexdataSnapshot.patch,
  date: snapshot.hexdataSnapshot.date,
  heroes: Object.keys(snapshot.cnStatsByKey).length,
  heroAugmentPools: Object.keys(snapshot.heroAugmentStatsByKey).length,
  augments: snapshot.augmentCatalogSnapshot.length,
  items: snapshot.itemCatalogSnapshot.length,
  heroItemPools: Object.keys(snapshot.heroItemPoolByKey).length,
  heroGames: Object.values(snapshot.cnStatsByKey).reduce((total, hero) => total + hero.games, 0),
});

const validate = (snapshot) => {
  const summary = summarize(snapshot);
  assert(/^\d+\.\d+(?:\.\d+)?$/.test(summary.patch), `补丁号异常：${summary.patch}`);
  assert(snapshot.itemSnapshot.patch === summary.patch, "英雄与装备快照补丁不一致");
  assert(snapshot.itemSnapshot.assetVersion, "缺少装备素材版本");
  assert(summary.heroes >= MIN_HEROES, `英雄仅 ${summary.heroes}`);
  assert(summary.heroAugmentPools >= MIN_HEROES, `英雄强化池仅 ${summary.heroAugmentPools}`);
  assert(summary.augments >= MIN_AUGMENTS, `强化仅 ${summary.augments}`);
  assert(summary.items >= MIN_ITEMS, `当前模式成装仅 ${summary.items}`);
  assert(summary.heroItemPools >= MIN_HEROES, `英雄装备池仅 ${summary.heroItemPools}`);
  assert(snapshot.itemSnapshot.itemCount === summary.items, "装备元数据数量与目录不一致");
  assert(snapshot.itemSnapshot.heroPoolCount === summary.heroItemPools, "英雄装备池元数据数量不一致");

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

const current = await readSnapshot();
const summary = validate(current);
const baselineIndex = process.argv.indexOf("--baseline-items");
if (baselineIndex >= 0) {
  const baselinePath = process.argv[baselineIndex + 1];
  assert(baselinePath, "--baseline-items 后缺少路径");
  const baselineItems = await readConsts(new URL(`file://${baselinePath}`), ["itemSnapshot", "itemCatalogSnapshot", "heroItemPoolByKey", "heroCoreItemsByKey"]);
  assert(summary.items >= baselineItems.itemCatalogSnapshot.length - 5,
    `装备目录从 ${baselineItems.itemCatalogSnapshot.length} 降至 ${summary.items}`);
  assert(summary.heroItemPools >= Object.keys(baselineItems.heroItemPoolByKey).length - 2,
    `英雄装备池覆盖从 ${Object.keys(baselineItems.heroItemPoolByKey).length} 降至 ${summary.heroItemPools}`);
}

const report = `数据校验通过：${summary.patch} / ${summary.date}\n英雄 ${summary.heroes}；强化 ${summary.augments}；当前模式成装 ${summary.items}；英雄装备池 ${summary.heroItemPools}`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 数据校验\n\n${report.replaceAll("\n", "  \n")}\n`);
}
