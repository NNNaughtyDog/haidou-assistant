import { readFile, writeFile } from "node:fs/promises";
import { DATA_SYNC_RETRY_ATTEMPTS, getDdragonItemUrl } from "./data-source-policy.mjs";

const BASE_URL = "https://hexdata.com.cn";
const HEXDATA_OUTPUT_PATH = new URL("../app/hexdata-snapshot.ts", import.meta.url);
const ITEM_OUTPUT_PATH = new URL("../app/item-snapshot.ts", import.meta.url);
const GAME_DATA_PATH = new URL("../app/game-data.ts", import.meta.url);

const fetchJsonUrl = async (url, attempts = DATA_SYNC_RETRY_ATTEMPTS) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "user-agent": "haidou-assistant-data-sync/0.3.2" } });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1000 * (2 ** (attempt - 1))));
    }
  }
  throw lastError;
};

const fetchJson = (path) => fetchJsonUrl(`${BASE_URL}${path}`);

const mapLimit = async (values, limit, mapper) => {
  const results = new Array(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      results[index] = await mapper(values[index], index);
    }
  }));
  return results;
};

const unique = (values) => [...new Set(values)];
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const gameData = await readFile(GAME_DATA_PATH, "utf8");
const augmentSection = gameData.slice(gameData.indexOf("const augmentCatalog"), gameData.indexOf("export const items"));
const localAugmentNames = [...augmentSection.matchAll(/\n    "name": "([^"]+)"/g)].map((match) => match[1]);

const meta = await fetchJson("/data/meta.json");
const ddragonItemUrl = getDdragonItemUrl(meta.assetVersion);
const [heroes, remoteAugments, poolIndex, remoteItems, formulaItems, ddragonPayload] = await Promise.all([
  fetchJson("/data/heroes.json"),
  fetchJson("/data/augments.json"),
  fetchJson("/data/hero-augment-items/index.json"),
  fetchJson("/data/items.json"),
  fetchJson("/data/hero_formula_items.json"),
  fetchJsonUrl(ddragonItemUrl),
]);
assert(ddragonPayload?.data, `Data Dragon ${meta.assetVersion} 装备数据为空`);
const ddragonItems = ddragonPayload.data;
const shards = await mapLimit(poolIndex.heroIds, 12, async (heroId) => fetchJson(`/data/hero-augment-items/${heroId}.json`));

const remoteNameById = new Map(remoteAugments.map((augment) => [String(augment.id), augment.name]));

const classifyAugmentTags = (augment) => {
  const text = `${augment.name}${augment.description}`;
  const rules = [
    ["暴击", /暴击/], ["攻速", /攻速|攻击速度/], ["普攻", /普攻|攻击特效|每次攻击|攻击会/],
    ["法强", /法术强度|法强|法术伤害/], ["技能", /技能|终极技能|基础技能/], ["急速", /急速|冷却/],
    ["坦克", /护甲|魔抗|减伤|格挡|防御/], ["续航", /治疗|回复|生命偷取|吸血|护盾/],
    ["近战", /近战|贴身|冲向/], ["射程", /射程|远距离/], ["机动", /移速|移动速度|冲刺|位移|闪现/],
    ["控制", /控制|眩晕|定身|减速|击飞|沉默|魅惑|恐惧/], ["爆发", /爆炸|额外伤害|斩杀|处决/],
    ["持续伤害", /持续伤害|灼烧|每秒|伤害持续/],
  ];
  const tags = rules.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag);
  return tags.length ? tags.slice(0, 4) : ["通用"];
};

const itemTagRules = [
  ["暴击", ["CriticalStrike"]], ["攻速", ["AttackSpeed"]], ["特效", ["OnHit"]],
  ["攻击", ["Damage"]], ["法强", ["SpellDamage"]], ["急速", ["CooldownReduction", "AbilityHaste"]],
  ["坦克", ["Health", "Armor", "SpellBlock", "MagicResist"]], ["续航", ["LifeSteal", "SpellVamp", "HealthRegen"]],
  ["穿透", ["ArmorPenetration", "MagicPenetration"]], ["机动", ["NonbootsMovement", "Boots"]],
  ["容错", ["Tenacity", "Active"]], ["辅助", ["ManaRegen", "Aura"]],
];

const classifyItemTags = (sourceTags) => {
  const tagSet = new Set(sourceTags);
  const tags = itemTagRules.filter(([, inputs]) => inputs.some((input) => tagSet.has(input))).map(([tag]) => tag);
  return tags.length ? tags.slice(0, 5) : ["通用"];
};

const classifyItemCategories = (source) => {
  const tags = new Set(source.tags ?? []);
  const categories = [];
  if (tags.has("Boots")) categories.push("鞋子");
  if (["Damage", "CriticalStrike", "AttackSpeed", "OnHit", "ArmorPenetration"].some((tag) => tags.has(tag))) categories.push("攻击");
  if (["SpellDamage", "Mana", "MagicPenetration"].some((tag) => tags.has(tag))) categories.push("法术");
  if (["Health", "Armor", "SpellBlock", "MagicResist"].some((tag) => tags.has(tag))) categories.push("坦克");
  if (["ManaRegen", "Aura"].some((tag) => tags.has(tag)) || (source.gold?.total ?? 9999) <= 2400) categories.push("辅助");
  if (source.maps?.["11"] !== true) categories.push("模式专属");
  return unique(categories.length ? categories : ["其他"]);
};

const cnStatsByKey = Object.fromEntries(heroes
  .filter((hero) => hero.dataAvailability === "observed")
  .sort((a, b) => b.winRate - a.winRate)
  .map((hero, index) => [Number(hero.id), {
    tier: `T${hero.tier}`,
    rank: index + 1,
    winRate: Number((hero.winRate * 100).toFixed(2)),
    pickRate: Number((hero.pickRate * 100).toFixed(2)),
    trend: null,
    games: hero.games,
  }]));

const heroAugmentStatsByKey = {};
for (const shard of shards) {
  const stats = {};
  for (const entry of shard.augments) {
    const name = remoteNameById.get(String(entry.augmentId));
    if (!name) continue;
    stats[name] = {
      games: entry.games,
      winRate: entry.games ? Number(((entry.wins / entry.games) * 100).toFixed(2)) : null,
    };
  }
  heroAugmentStatsByKey[Number(shard.heroId)] = stats;
}

const tierLabel = { 1: "S+", 2: "S", 3: "A", 4: "B", 5: "B" };
const sortedAugments = [...remoteAugments].sort((a, b) => b.globalHexScore - a.globalHexScore || b.games - a.games);
const augmentCatalogSnapshot = sortedAugments.map((remote, index) => ({
  id: String(remote.id),
  name: remote.name,
  rarity: remote.rarity,
  tier: tierLabel[remote.tier] ?? "B",
  tags: classifyAugmentTags(remote),
  summary: remote.description,
  rank: index + 1,
  icon: `${BASE_URL}${remote.iconUrl}`,
  winRate: Number((remote.winRate * 100).toFixed(2)),
  pickRate: Number((remote.pickRate * 100).toFixed(2)),
  games: remote.games,
}));

const itemCatalogSnapshot = remoteItems.map((remote) => {
  const source = ddragonItems[String(remote.id)];
  assert(source, `Data Dragon 缺少装备 ${remote.id}/${remote.name}`);
  assert(source.name === remote.name, `装备名称不一致：${remote.id} Hexdata=${remote.name} Data Dragon=${source.name}`);
  return {
    id: String(remote.id),
    name: remote.name,
    tags: classifyItemTags(source.tags ?? []),
    categories: classifyItemCategories(source),
    cost: source.gold?.total ?? 0,
  };
});

const itemIds = new Set(itemCatalogSnapshot.map((item) => item.id));
const formulaByHero = formulaItems.byHeroId ?? {};
const heroItemPoolByKey = {};
const heroCoreItemsByKey = {};
for (const shard of shards) {
  const heroId = Number(shard.heroId);
  const formulaCore = (formulaByHero[String(heroId)]?.coreItems ?? [])
    .map((item) => String(item.id))
    .filter((itemId) => itemIds.has(itemId));
  const observedEntries = [...shard.itemStats]
    .filter((entry) => itemIds.has(String(entry.itemId)))
    .sort((a, b) => b.games - a.games);
  const observed = observedEntries.map((entry) => String(entry.itemId));
  const stableMinimum = Math.max(250, Math.floor(shard.heroGames * 0.0005));
  const stableObserved = observedEntries
    .filter((entry) => entry.games >= stableMinimum)
    .map((entry) => String(entry.itemId));
  const pool = unique([...formulaCore, ...stableObserved, ...observed.slice(0, 16)]).slice(0, 36);
  heroItemPoolByKey[heroId] = pool;
  heroCoreItemsByKey[heroId] = unique([...formulaCore, ...observed]).slice(0, 6);
}

assert(meta.itemRankingCount === itemCatalogSnapshot.length,
  `装备目录数量不一致：meta=${meta.itemRankingCount}，实际=${itemCatalogSnapshot.length}`);
assert(itemCatalogSnapshot.length >= 100, `当前模式成装仅 ${itemCatalogSnapshot.length}，拒绝覆盖`);
assert(new Set(itemCatalogSnapshot.map((item) => item.id)).size === itemCatalogSnapshot.length, "装备 ID 重复");
assert(Object.keys(heroItemPoolByKey).length >= 170, `英雄装备池仅 ${Object.keys(heroItemPoolByKey).length}`);
assert(Object.entries(heroItemPoolByKey).every(([, pool]) => pool.length >= 6), "存在少于 6 件装备的英雄专属池");

const hexdataGenerated = `// 此文件由 scripts/sync-hexdata.mjs 生成，请勿手改。\n` +
  `// 数据快照：${meta.reportPatch} / ${meta.reportDate} / ${meta.generatedAt}\n\n` +
  `export const hexdataSnapshot = ${JSON.stringify({
    buildId: meta.buildId ?? `hexdata-${meta.reportDate}`,
    patch: meta.reportPatch,
    date: meta.reportDate,
    generatedAt: meta.generatedAt,
    observedHeroCount: meta.observedHeroCount,
  }, null, 2)} as const;\n\n` +
  `export const cnStatsByKey = ${JSON.stringify(cnStatsByKey, null, 2)} as const;\n\n` +
  `export const heroAugmentStatsByKey = ${JSON.stringify(heroAugmentStatsByKey)} as const;\n\n` +
  `export const augmentCatalogSnapshot = ${JSON.stringify(augmentCatalogSnapshot)} as const;\n`;

const itemGenerated = `// 此文件由 scripts/sync-hexdata.mjs 生成，请勿手改。\n` +
  `// 当前模式完整成装目录：${meta.reportPatch} / ${meta.reportDate} / ${meta.assetVersion}\n\n` +
  `export const itemSnapshot = ${JSON.stringify({
    buildId: meta.buildId ?? `hexdata-${meta.reportDate}`,
    patch: meta.reportPatch,
    assetVersion: meta.assetVersion,
    date: meta.reportDate,
    generatedAt: meta.generatedAt,
    itemCount: itemCatalogSnapshot.length,
    heroPoolCount: Object.keys(heroItemPoolByKey).length,
    source: `${BASE_URL}/data/items.json`,
  }, null, 2)} as const;\n\n` +
  `export const itemCatalogSnapshot = ${JSON.stringify(itemCatalogSnapshot, null, 2)} as const;\n\n` +
  `export const heroItemPoolByKey = ${JSON.stringify(heroItemPoolByKey)} as const;\n\n` +
  `export const heroCoreItemsByKey = ${JSON.stringify(heroCoreItemsByKey)} as const;\n`;

await Promise.all([
  writeFile(HEXDATA_OUTPUT_PATH, hexdataGenerated),
  writeFile(ITEM_OUTPUT_PATH, itemGenerated),
]);
console.log(`写入 ${HEXDATA_OUTPUT_PATH.pathname}`);
console.log(`写入 ${ITEM_OUTPUT_PATH.pathname}`);
console.log(`国服英雄 ${Object.keys(cnStatsByKey).length}；英雄强化池 ${Object.keys(heroAugmentStatsByKey).length}；强化 ${augmentCatalogSnapshot.length}（本地人工覆盖 ${localAugmentNames.length}）`);
console.log(`当前模式成装 ${itemCatalogSnapshot.length}；英雄装备池 ${Object.keys(heroItemPoolByKey).length}；Data Dragon ${meta.assetVersion}`);
