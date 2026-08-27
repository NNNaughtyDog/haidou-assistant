import assert from "node:assert/strict";
import test from "node:test";

import { DATA_SYNC_RETRY_ATTEMPTS, getDdragonItemUrl } from "../scripts/data-source-policy.mjs";

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

