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

const remoteByName = new Map(remoteAugments.map((augment) => [augment.name, augment]));
const missingNames = localAugmentNames.filter((name) => !remoteByName.has(name));
if (missingNames.length) throw new Error(`Hexdata 缺少本地强化：${missingNames.join("、")}`);

const localNameById = new Map(localAugmentNames.map((name) => [String(remoteByName.get(name).id), name]));
const shards = await mapLimit(poolIndex.heroIds, 12, async (heroId) => fetchJson(`/data/hero-augment-items/${heroId}.json`));

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

const augmentPoolByKey = {};
const heroAugmentStatsByKey = {};
for (const shard of shards) {
  const pool = [];
  const stats = {};
  for (const entry of shard.augments) {
    const name = localNameById.get(String(entry.augmentId));
    if (!name) continue;
    pool.push(name);
    stats[name] = {
      games: entry.games,
      winRate: entry.games ? Number(((entry.wins / entry.games) * 100).toFixed(2)) : null,
    };
  }
  augmentPoolByKey[Number(shard.heroId)] = pool;
  heroAugmentStatsByKey[Number(shard.heroId)] = stats;
}

const augmentSourceByName = Object.fromEntries(localAugmentNames.map((name) => {
  const remote = remoteByName.get(name);
  return [name, {
    id: String(remote.id),
    icon: `${BASE_URL}${remote.iconUrl}`,
    winRate: Number((remote.winRate * 100).toFixed(2)),
    pickRate: Number((remote.pickRate * 100).toFixed(2)),
    games: remote.games,
  }];
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
  `export const augmentPoolByKey = ${JSON.stringify(augmentPoolByKey, null, 2)} as const;\n\n` +
  `export const heroAugmentStatsByKey = ${JSON.stringify(heroAugmentStatsByKey, null, 2)} as const;\n\n` +
  `export const augmentSourceByName = ${JSON.stringify(augmentSourceByName, null, 2)} as const;\n`;

await writeFile(OUTPUT_PATH, generated);
console.log(`写入 ${OUTPUT_PATH.pathname}`);
console.log(`国服英雄 ${Object.keys(cnStatsByKey).length}；英雄池 ${Object.keys(augmentPoolByKey).length}；强化 ${localAugmentNames.length}`);
