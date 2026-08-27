export const DATA_SYNC_RETRY_ATTEMPTS = 3;

export const getDdragonItemUrl = (assetVersion) => {
  if (typeof assetVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(assetVersion)) {
    throw new Error(`Hexdata 素材版本无效：${assetVersion}`);
  }
  return `https://ddragon.leagueoflegends.com/cdn/${assetVersion}/data/zh_CN/item.json`;
};

export const getDdragonItemById = (items, itemId) => {
  const source = items?.[String(itemId)];
  if (!source) throw new Error(`Data Dragon 缺少装备 ${itemId}`);
  return source;
};
