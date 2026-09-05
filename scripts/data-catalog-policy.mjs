const unique = values => [...new Set(values)];
export const classifyAugmentTags = (augment) => {
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

const itemTagRules = [
  ["暴击", ["CriticalStrike"]], ["攻速", ["AttackSpeed"]], ["特效", ["OnHit"]],
  ["攻击", ["Damage"]], ["法强", ["SpellDamage"]], ["急速", ["CooldownReduction", "AbilityHaste"]],
  ["坦克", ["Health", "Armor", "SpellBlock", "MagicResist"]], ["续航", ["LifeSteal", "SpellVamp", "HealthRegen"]],
  ["穿透", ["ArmorPenetration", "MagicPenetration"]], ["机动", ["NonbootsMovement", "Boots"]],
  ["容错", ["Tenacity", "Active"]], ["辅助", ["ManaRegen", "Aura"]],
];

export const classifyItemTags = (sourceTags) => {
  const tagSet = new Set(sourceTags);
  const tags = itemTagRules.filter(([, inputs]) => inputs.some((input) => tagSet.has(input))).map(([tag]) => tag);
  return tags.length ? tags.slice(0, 5) : ["通用"];
};

export const classifyItemCategories = (source) => {
  const tags = new Set(source.tags ?? []);
  const categories = [];
  if (tags.has("Boots")) categories.push("鞋子");
  if (["Damage", "CriticalStrike", "AttackSpeed", "OnHit", "ArmorPenetration"].some((tag) => tags.has(tag))) categories.push("攻击");
  if (["SpellDamage", "Mana", "MagicPenetration"].some((tag) => tags.has(tag))) categories.push("法术");
  if (["Health", "Armor", "SpellBlock", "MagicResist"].some((tag) => tags.has(tag))) categories.push("坦克");
  if (["ManaRegen", "Aura"].some((tag) => tags.has(tag)) || (source.gold?.total ?? 9999) <= 2400) categories.push("辅助");
  if (source.maps?.["11"] !== true) categories.push("模式专属");
  return unique(categories.length ? categories : ["其他"]);
};

