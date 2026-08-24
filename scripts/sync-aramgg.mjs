import { readFile, writeFile } from "node:fs/promises";

const BASE_URL = "https://aramgg.com/zh-CN";
const OUTPUT_PATH = new URL("../app/aramgg-snapshot.ts", import.meta.url);
const MIN_HEROES = 170;
const MIN_AUGMENTS = 200;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: { "user-agent": "haidou-assistant-data-sync/0.3" },
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
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

const parseHomepage = (html) => {
  const patch = html.match(/当前数据：版本\s*([\d.]+)，腾讯国服公开统计覆盖/)?.[1];
  assert(patch, "ARAMGG 首页缺少版本号");
  const rows = [...html.matchAll(
    /<tr[^>]*data-ranking-row[\s\S]*?<a href="\/zh-CN\/champion-stats\/(\d+)"[\s\S]*?<span class="stat-value[^>]*>([\d.]+)%<\/span>[\s\S]*?>T([1-5])<\/span>[\s\S]*?<\/tr>/g,
  )].map((match, index) => ({
    id: match[1],
    rank: index + 1,
    winRate: Number(match[2]),
    tier: `T${match[3]}`,
  }));
  assert(rows.length >= MIN_HEROES, `ARAMGG 首页仅解析到 ${rows.length} 位英雄`);
  assert(new Set(rows.map((row) => row.id)).size === rows.length, "ARAMGG 首页英雄 ID 重复");
  return { patch, rows };
};

const parseAugmentTiers = (html) => {
  const patch = html.match(/当前数据：版本\s*([\d.]+)，腾讯国服公开统计覆盖/)?.[1];
  assert(patch, "ARAMGG 强化页缺少版本号");
  const tierLabel = { 1: "S+", 2: "S", 3: "A", 4: "B", 5: "B" };
  const tiers = {};
  const tierCounts = {};
  for (const section of html.split("<section data-augment-tier>").slice(1)) {
    const tier = section.match(/>T([1-5])<\/span>/)?.[1];
    if (!tier) continue;
    const names = [...section.matchAll(
      /<p class="mb-2 truncate text-center text-sm font-medium text-card-foreground">([^<]+)<\/p>/g,
    )].map((match) => match[1].trim());
    tierCounts[tier] = names.length;
    for (const name of names) {
      assert(!tiers[name], `ARAMGG 强化名称重复：${name}`);
      tiers[name] = tierLabel[tier];
    }
  }
  assert(Object.keys(tiers).length >= MIN_AUGMENTS, `ARAMGG 强化仅解析到 ${Object.keys(tiers).length} 个`);
  return { patch, tiers, tierCounts };
};

const parseHeroDetail = (id, html) => {
  const stats = html.match(/"stats":\{"tier":"([1-5])","winRate":([\d.]+),"pickRate":([\d.]+),"version":"([^"]+)"\}/);
  assert(stats, `ARAMGG 英雄 ${id} 缺少统计字段`);
  const rank = html.match(/"rank":\{"current":(\d+),"total":(\d+)\}/);
  assert(rank, `ARAMGG 英雄 ${id} 缺少排名字段`);
  const date = html.match(/更新于\s*(\d{4})年(\d{1,2})月(\d{1,2})日/);
  assert(date, `ARAMGG 英雄 ${id} 缺少数据日期`);
  return {
    id,
    tier: `T${stats[1]}`,
    winRate: Number((Number(stats[2]) * 100).toFixed(2)),
    pickRate: Number((Number(stats[3]) * 100).toFixed(2)),
    patch: stats[4],
    rank: Number(rank[1]),
    total: Number(rank[2]),
    date: `${date[1]}-${date[2].padStart(2, "0")}-${date[3].padStart(2, "0")}`,
  };
};

const previousSource = await readFile(OUTPUT_PATH, "utf8");
const previousMetaMarker = "export const aramggSnapshot = ";
const previousMetaStart = previousSource.indexOf(previousMetaMarker) + previousMetaMarker.length;
const previousMetaEnd = previousSource.indexOf(" as const;", previousMetaStart);
assert(previousMetaStart >= previousMetaMarker.length && previousMetaEnd > previousMetaStart,
  "现有 ARAMGG 快照元数据无法读取");
const previousMeta = JSON.parse(previousSource.slice(previousMetaStart, previousMetaEnd));

const [homepageHtml, augmentHtml] = await Promise.all([
  fetchText(BASE_URL),
  fetchText(`${BASE_URL}/augments`),
]);
const homepage = parseHomepage(homepageHtml);
const augments = parseAugmentTiers(augmentHtml);
assert(homepage.patch === augments.patch,
  `ARAMGG 首页版本 ${homepage.patch} 与强化页版本 ${augments.patch} 不一致`);

const details = await mapLimit(homepage.rows, 12, async (row) => {
  const detail = parseHeroDetail(row.id, await fetchText(`${BASE_URL}/champion-stats/${row.id}`));
  assert(detail.patch === homepage.patch, `英雄 ${row.id} 版本 ${detail.patch} 与首页 ${homepage.patch} 不一致`);
  assert(detail.rank === row.rank, `英雄 ${row.id} 详情排名 ${detail.rank} 与首页 ${row.rank} 不一致`);
  assert(detail.tier === row.tier, `英雄 ${row.id} 详情层级 ${detail.tier} 与首页 ${row.tier} 不一致`);
  assert(detail.winRate === row.winRate, `英雄 ${row.id} 详情胜率 ${detail.winRate} 与首页 ${row.winRate} 不一致`);
  assert(detail.total === homepage.rows.length, `英雄 ${row.id} 排名总数 ${detail.total} 异常`);
  assert(detail.winRate >= 0 && detail.winRate <= 100, `英雄 ${row.id} 胜率越界`);
  assert(detail.pickRate >= 0 && detail.pickRate <= 100, `英雄 ${row.id} 选取率越界`);
  return detail;
});

const dates = [...new Set(details.map((detail) => detail.date))];
assert(dates.length === 1, `ARAMGG 英雄详情数据日期不一致：${dates.join(", ")}`);
const date = dates[0];
assert(date >= previousMeta.date, `ARAMGG 数据日期从 ${previousMeta.date} 回退到 ${date}`);

const cnStatsByKey = Object.fromEntries(details.map((detail) => [detail.id, {
  tier: detail.tier,
  rank: detail.rank,
  winRate: detail.winRate,
  pickRate: detail.pickRate,
  trend: null,
}]));

const output = "// 此文件由 scripts/sync-aramgg.mjs 从 ARAMGG 当前公开页面生成。\n" +
  "// 仅保存 Riot 政策允许公开展示的英雄统计与强化梯度；不保存或展示强化胜率。\n\n" +
  `export const aramggSnapshot = ${JSON.stringify({
    patch: homepage.patch,
    date,
    updatedAt: date,
    heroCount: details.length,
    augmentTierCount: Object.keys(augments.tiers).length,
    source: BASE_URL,
  }, null, 2)} as const;\n\n` +
  `export const cnStatsByKey = ${JSON.stringify(cnStatsByKey, null, 2)} as const;\n\n` +
  `export const aramggAugmentTierByName = ${JSON.stringify(augments.tiers, null, 2)} as const;\n`;

await writeFile(OUTPUT_PATH, output);
console.log(`写入 ${OUTPUT_PATH.pathname}`);
console.log(`ARAMGG ${homepage.patch} / ${date}：英雄 ${details.length}；强化梯度 ${Object.keys(augments.tiers).length}`);
console.log(`强化分层：${Object.entries(augments.tierCounts).map(([tier, count]) => `T${tier}=${count}`).join("，")}`);
