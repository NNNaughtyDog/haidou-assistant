import { readFile } from "node:fs/promises";
import process from "node:process";

const SNAPSHOT_PATH = new URL("../app/hexdata-snapshot.ts", import.meta.url);
const MIN_HEROES = 170;
const MIN_HERO_POOLS = 170;
const MIN_AUGMENTS = 200;

const parseSnapshot = async (path) => {
  const source = await readFile(path, "utf8");
  const readConst = (name) => {
    const marker = `export const ${name} = `;
    const start = source.indexOf(marker);
    if (start < 0) throw new Error(`缺少 ${name}`);
    const valueStart = start + marker.length;
    const end = source.indexOf(" as const;", valueStart);
    if (end < 0) throw new Error(`${name} 结尾不完整`);
    return JSON.parse(source.slice(valueStart, end));
  };

  return {
    meta: readConst("hexdataSnapshot"),
    heroes: readConst("cnStatsByKey"),
    heroPools: readConst("heroAugmentStatsByKey"),
    augments: readConst("augmentCatalogSnapshot"),
  };
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const summarize = (snapshot) => ({
  patch: snapshot.meta.patch,
  date: snapshot.meta.date,
  heroes: Object.keys(snapshot.heroes).length,
  heroPools: Object.keys(snapshot.heroPools).length,
  augments: snapshot.augments.length,
  heroGames: Object.values(snapshot.heroes).reduce((total, hero) => total + hero.games, 0),
});

const validate = (snapshot) => {
  const summary = summarize(snapshot);

  assert(/^\d+\.\d+(?:\.\d+)?$/.test(summary.patch), `补丁号格式异常：${summary.patch}`);
  assert(!Number.isNaN(Date.parse(snapshot.meta.date)), `数据日期无效：${snapshot.meta.date}`);
  assert(!Number.isNaN(Date.parse(snapshot.meta.generatedAt)), `生成时间无效：${snapshot.meta.generatedAt}`);
  assert(summary.heroes >= MIN_HEROES, `英雄数仅 ${summary.heroes}，低于 ${MIN_HEROES}`);
  assert(summary.heroPools >= MIN_HERO_POOLS, `英雄强化池仅 ${summary.heroPools}，低于 ${MIN_HERO_POOLS}`);
  assert(summary.augments >= MIN_AUGMENTS, `强化数仅 ${summary.augments}，低于 ${MIN_AUGMENTS}`);
  assert(snapshot.meta.observedHeroCount === summary.heroes,
    `observedHeroCount=${snapshot.meta.observedHeroCount}，实际英雄数=${summary.heroes}`);

  for (const [heroId, hero] of Object.entries(snapshot.heroes)) {
    assert(Number.isFinite(hero.rank) && hero.rank > 0, `英雄 ${heroId} 排名无效`);
    assert(hero.winRate >= 0 && hero.winRate <= 100, `英雄 ${heroId} 胜率越界`);
    assert(hero.pickRate >= 0 && hero.pickRate <= 100, `英雄 ${heroId} 选取率越界`);
    assert(Number.isFinite(hero.games) && hero.games > 0, `英雄 ${heroId} 样本无效`);
  }

  const augmentIds = new Set();
  const augmentNames = new Set();
  for (const augment of snapshot.augments) {
    assert(augment.id && !augmentIds.has(augment.id), `强化 ID 重复：${augment.id}`);
    assert(augment.name && !augmentNames.has(augment.name), `强化名称重复：${augment.name}`);
    assert(augment.winRate >= 0 && augment.winRate <= 100, `强化 ${augment.name} 胜率越界`);
    assert(augment.pickRate >= 0 && augment.pickRate <= 100, `强化 ${augment.name} 选取率越界`);
    assert(Number.isFinite(augment.games) && augment.games > 0, `强化 ${augment.name} 样本无效`);
    augmentIds.add(augment.id);
    augmentNames.add(augment.name);
  }

  for (const [heroId, pool] of Object.entries(snapshot.heroPools)) {
    assert(pool && typeof pool === "object", `英雄 ${heroId} 强化池无效`);
    for (const [name, stats] of Object.entries(pool)) {
      assert(augmentNames.has(name), `英雄 ${heroId} 强化池包含目录外条目：${name}`);
      assert(Number.isFinite(stats.games) && stats.games >= 0, `英雄 ${heroId}/${name} 样本无效`);
      assert(stats.winRate === null || (stats.winRate >= 0 && stats.winRate <= 100),
        `英雄 ${heroId}/${name} 胜率越界`);
    }
  }

  return summary;
};

const baselineArg = process.argv.indexOf("--baseline");
const current = await parseSnapshot(SNAPSHOT_PATH);
const summary = validate(current);

if (baselineArg >= 0) {
  const baselinePath = process.argv[baselineArg + 1];
  assert(baselinePath, "--baseline 后缺少路径");
  try {
    const baseline = summarize(await parseSnapshot(baselinePath));
    assert(summary.heroes >= baseline.heroes - 2,
      `英雄数从 ${baseline.heroes} 降至 ${summary.heroes}`);
    assert(summary.heroPools >= baseline.heroPools - 2,
      `英雄强化池从 ${baseline.heroPools} 降至 ${summary.heroPools}`);
    assert(summary.augments >= baseline.augments - 5,
      `强化数从 ${baseline.augments} 降至 ${summary.augments}`);
    assert(summary.heroGames >= baseline.heroGames * 0.25,
      `英雄总样本从 ${baseline.heroGames} 降至 ${summary.heroGames}`);
  } catch (error) {
    if (String(error.message).includes("从 ")) throw error;
    console.warn(`上一份快照无法解析；允许以已通过完整校验的新快照修复：${error.message}`);
  }
}

const report = [
  `Hexdata 校验通过：${summary.patch} / ${summary.date}`,
  `英雄 ${summary.heroes}；英雄强化池 ${summary.heroPools}；强化 ${summary.augments}`,
  `英雄总样本 ${summary.heroGames}`,
].join("\n");

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `## 数据校验\n\n${report.replaceAll("\n", "  \n")}\n`);
}
