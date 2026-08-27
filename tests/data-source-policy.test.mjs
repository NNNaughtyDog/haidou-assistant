import assert from "node:assert/strict";
import test from "node:test";

import {
  DATA_SYNC_RETRY_ATTEMPTS,
  getDdragonItemById,
  getDdragonItemUrl,
} from "../scripts/data-source-policy.mjs";

test("Data Dragon 装备地址跟随 Hexdata 声明版本", () => {
  assert.equal(
    getDdragonItemUrl("16.16.1"),
    "https://ddragon.leagueoflegends.com/cdn/16.16.1/data/zh_CN/item.json",
  );
  assert.equal(DATA_SYNC_RETRY_ATTEMPTS, 3);
});

test("拒绝无效的 Hexdata 素材版本", () => {
  assert.throws(() => getDdragonItemUrl("latest"), /素材版本无效/);
  assert.throws(() => getDdragonItemUrl("16.17"), /素材版本无效/);
});

test("装备以稳定 ID 关联并允许中文名称别名", () => {
  const item = getDdragonItemById({ "1001": { name: "鞋子", gold: { total: 500 } } }, 1001);
  assert.equal(item.name, "鞋子");
  assert.throws(() => getDdragonItemById({}, 1001), /缺少装备 1001/);
});
