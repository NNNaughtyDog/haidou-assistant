import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/item-snapshot.ts", import.meta.url), "utf8");
const readConst = (name) => {
  const marker = `export const ${name} = `;
  const start = source.indexOf(marker) + marker.length;
  const end = source.indexOf(" as const;", start);
  return JSON.parse(source.slice(start, end));
};

const items = readConst("itemCatalogSnapshot");
const pools = readConst("heroItemPoolByKey");
const cores = readConst("heroCoreItemsByKey");

test("当前模式成装目录完整且没有重复", () => {
  assert.equal(items.length, 122);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  assert.equal(new Set(items.map((item) => item.name)).size, items.length);
});

test("英雄核心路线严格属于英雄专属候选池", () => {
  assert.equal(Object.keys(pools).length, 172);
  for (const [heroId, core] of Object.entries(cores)) {
    assert.ok(core.length >= 3, `${heroId} 核心路线不足`);
    assert.ok(core.every((itemId) => pools[heroId].includes(itemId)), `${heroId} 存在池外核心装备`);
  }
});
