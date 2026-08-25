import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/roguelite-data.ts", import.meta.url), "utf8");
const heroesSource = source.slice(source.indexOf("export const gameHeroes"), source.indexOf("export const gameCards"));
const cardsSource = source.slice(source.indexOf("export const gameCards"), source.indexOf("export const gameEnemies"));
const enemiesSource = source.slice(source.indexOf("export const gameEnemies"));
const ids = [...source.matchAll(/\bid: "([^"]+)"/g)].map((match) => match[1]);

test("构筑乱斗MVP内容量完整且ID不重复", () => {
  assert.equal([...heroesSource.matchAll(/\bid: "/g)].length, 6);
  assert.equal([...cardsSource.matchAll(/\bid: "/g)].length, 24);
  assert.equal([...enemiesSource.matchAll(/\bname: "/g)].length, 6);
  assert.equal(new Set(ids).size, ids.length);
});

test("原创强化覆盖三个稀有度", () => {
  assert.match(cardsSource, /rarity: "白银"/);
  assert.match(cardsSource, /rarity: "黄金"/);
  assert.match(cardsSource, /rarity: "棱彩"/);
});

