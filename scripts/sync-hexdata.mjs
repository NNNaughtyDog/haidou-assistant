import { readFile, writeFile } from "node:fs/promises";

const BASE_URL = "https://hexdata.com.cn";
const OUTPUT_PATH = new URL("../app/hexdata-snapshot.ts", import.meta.url);
const GAME_DATA_PATH = new URL("../app/game-data.ts", import.meta.url);

const fetchJson = async (path) => {
  const response = await fetch(`${BASE_URL}${path}`, { headers: { "user-agent": "haidou-assistant-data-sync/0.2" } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
};

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

const gameData = await readFile(GAME_DATA_PATH, "utf8");
const augmentSection = gameData.slice(gameData.indexOf("const augmentCatalog"), gameData.indexOf("export const items"));
const localAugmentNames = [...augmentSection.matchAll(/\n    "name": "([^"]+)"/g)].map((match) => match[1]);

const [meta, heroes, remoteAugments, poolIndex] = await Promise.all([
  fetchJson("/data/meta.json"),
  fetchJson("/data/heroes.json"),
  fetchJson("/data/augments.json"),
  fetchJson("/data/hero-augment-items/index.json"),
]);

const remoteNameById = new Map(remoteAugments.map((augment) => [String(augment.id), augment.name]));
const shards = await mapLimit(poolIndex.heroIds, 12, async (heroId) => fetchJson(`/data/hero-augment-items/${heroId}.json`));

const classifyTags = (augment) => {
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
  tags: classifyTags(remote),
  summary: remote.description,
  rank: index + 1,
  icon: `${BASE_URL}${remote.iconUrl}`,
  winRate: Number((remote.winRate * 100).toFixed(2)),
  pickRate: Number((remote.pickRate * 100).toFixed(2)),
  games: remote.games,
}));

const generated = `// 此文件由 scripts/sync-hexdata.mjs 生成，请勿手改。\n` +
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

await writeFile(OUTPUT_PATH, generated);
console.log(`写入 ${OUTPUT_PATH.pathname}`);
console.log(`国服英雄 ${Object.keys(cnStatsByKey).length}；英雄池 ${Object.keys(heroAugmentStatsByKey).length}；强化 ${augmentCatalogSnapshot.length}（本地人工覆盖 ${localAugmentNames.length}）`);
