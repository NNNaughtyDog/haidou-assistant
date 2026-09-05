import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTencentAugmentPool } from '../scripts/cn-source-parser.mjs';

test('国服候选保留腾讯条目，剔除外服附加胜率和样本字段', () => {
  const payload = { championId:'1', championAugments:[['1',JSON.stringify({source:'tencent',region:'CN',augments:Object.fromEntries(Array.from({length:12},(_,i)=>[String(1000+i),{tier:'2',rank:String(i+1),win_rate_region:'WORLD',num_games:'999',win_rate:'0.99'}]))})]] };
  const result = parseTencentAugmentPool('1',payload);
  assert.equal(result.length,12);
  assert.deepEqual(Object.keys(result[0]).sort(),['id','rank','tier']);
  payload.championId='2';
  assert.throws(()=>parseTencentAugmentPool('1',payload),/英雄/);
});
test('拒绝非国服来源作为英雄池', () => {
  assert.throws(()=>parseTencentAugmentPool('1',{championId:'1',championAugments:[['1',JSON.stringify({source:'client',region:'WORLD',augments:{}})]]}),/国服/);
});
