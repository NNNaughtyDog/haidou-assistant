export type GameRarity = "白银" | "黄金" | "棱彩";

export type GameHero = {
  id: string;
  name: string;
  title: string;
  glyph: string;
  accent: string;
  hp: number;
  attack: number;
  guard: number;
  tags: string[];
  trait: string;
};

export type GameCard = {
  id: string;
  name: string;
  glyph: string;
  rarity: GameRarity;
  description: string;
  tags: string[];
  attack?: number;
  guard?: number;
  hp?: number;
  crit?: number;
  heal?: number;
  multiplier?: number;
};

export type GameEnemy = {
  name: string;
  title: string;
  glyph: string;
  power: number;
  guard: number;
  hp: number;
  accent: string;
};

export const gameHeroes: GameHero[] = [
  { id: "star-ranger", name: "逐星游侠", title: "远距连击 · 暴击成长", glyph: "➹", accent: "#69d8ff", hp: 104, attack: 29, guard: 11, tags: ["远程", "连击", "暴击"], trait: "每拥有2个连击或暴击标签，战力额外提高8%。" },
  { id: "ember-mage", name: "余烬术士", title: "技能回响 · 爆发灼烧", glyph: "✹", accent: "#ff8f66", hp: 96, attack: 34, guard: 8, tags: ["技能", "回响", "爆发"], trait: "棱彩强化首次加入构筑时，回复18点生命。" },
  { id: "aegis", name: "曜铁壁垒", title: "护盾反击 · 越打越硬", glyph: "⬡", accent: "#e4bf63", hp: 132, attack: 20, guard: 19, tags: ["护盾", "反击", "续航"], trait: "护盾标签会同时提供攻击与防御收益。" },
  { id: "shade", name: "影跃者", title: "残血收割 · 高风险爆发", glyph: "◈", accent: "#c68aff", hp: 92, attack: 37, guard: 7, tags: ["位移", "斩杀", "暴击"], trait: "生命低于45%时，本轮战力提高20%。" },
  { id: "storm", name: "铸雷斗士", title: "近战过载 · 高频触发", glyph: "ϟ", accent: "#78a5ff", hp: 118, attack: 27, guard: 14, tags: ["近战", "连击", "护盾"], trait: "每次战斗获胜后永久获得2点攻击。" },
  { id: "caller", name: "秘仪唤师", title: "召唤协同 · 后期成型", glyph: "✦", accent: "#7ce8bd", hp: 101, attack: 25, guard: 10, tags: ["召唤", "技能", "成长"], trait: "重复标签达到3层时，协同奖励翻倍。" },
];

export const gameCards: GameCard[] = [
  { id: "echo", name: "双重回响", glyph: "◉", rarity: "黄金", description: "技能有概率再次释放，重复的技能会继续触发构筑效果。", tags: ["技能", "回响"], attack: 13, multiplier: 1.08 },
  { id: "prism", name: "珠光裂变", glyph: "✧", rarity: "棱彩", description: "技能可以暴击；溢出的暴击转化为爆发伤害。", tags: ["技能", "暴击", "爆发"], attack: 20, crit: 18 },
  { id: "last-stand", name: "残星狂热", glyph: "☄", rarity: "黄金", description: "生命越低伤害越高，低于一半生命时效果翻倍。", tags: ["斩杀", "成长"], attack: 11, multiplier: 1.12 },
  { id: "shield-burst", name: "护盾反冲", glyph: "⬢", rarity: "黄金", description: "护盾破裂时爆炸，防御也会转化为攻击。", tags: ["护盾", "反击"], attack: 8, guard: 14 },
  { id: "overclock", name: "过载核心", glyph: "ϟ", rarity: "棱彩", description: "每次连续触发都会加速，第三次触发造成巨额伤害。", tags: ["连击", "技能", "成长"], attack: 18, multiplier: 1.1 },
  { id: "hunt", name: "追猎协议", glyph: "➤", rarity: "白银", description: "面对生命较低的目标时获得斩杀与移速。", tags: ["位移", "斩杀"], attack: 9, crit: 6 },
  { id: "second-heart", name: "第二心跳", glyph: "♥", rarity: "黄金", description: "每轮结束恢复生命；濒死时获得一次额外治疗。", tags: ["续航", "成长"], hp: 14, heal: 13 },
  { id: "iron-song", name: "钢铁回声", glyph: "◫", rarity: "白银", description: "受到伤害时叠加护甲，达到三层后强化下一次攻击。", tags: ["护盾", "反击"], guard: 12, attack: 5 },
  { id: "afterimage", name: "折跃残像", glyph: "◇", rarity: "黄金", description: "位移后留下残像并复制下一次攻击。", tags: ["位移", "连击"], attack: 12, crit: 7 },
  { id: "pack", name: "群星伙伴", glyph: "✣", rarity: "黄金", description: "召唤一个持续作战的伙伴；召唤物继承部分暴击。", tags: ["召唤", "暴击"], attack: 13, hp: 7 },
  { id: "legion", name: "秘仪军团", glyph: "✥", rarity: "棱彩", description: "每个不同标签都会生成一个幻影，协同越杂伤害越高。", tags: ["召唤", "技能", "成长"], attack: 19, multiplier: 1.08 },
  { id: "execution", name: "终幕宣告", glyph: "†", rarity: "棱彩", description: "对受伤目标造成巨额追加伤害，但自身防御降低。", tags: ["斩杀", "爆发"], attack: 25, guard: -5, multiplier: 1.06 },
  { id: "longshot", name: "超距校准", glyph: "◎", rarity: "白银", description: "距离越远伤害越高，并获得稳定暴击。", tags: ["远程", "暴击"], attack: 9, crit: 9 },
  { id: "close-combat", name: "贴身震荡", glyph: "✺", rarity: "白银", description: "近距离命中会叠加攻击并获得少量护盾。", tags: ["近战", "护盾"], attack: 8, guard: 7 },
  { id: "blood-price", name: "猩红契约", glyph: "◆", rarity: "棱彩", description: "牺牲最大生命换取成倍力量。选它，就是选择豪赌。", tags: ["爆发", "斩杀"], attack: 30, hp: -22, multiplier: 1.12 },
  { id: "renewal", name: "不灭循环", glyph: "∞", rarity: "黄金", description: "治疗会转化为临时攻击，攻击又会返还生命。", tags: ["续航", "技能"], attack: 7, heal: 18 },
  { id: "barrage", name: "星雨齐射", glyph: "⋰", rarity: "黄金", description: "每次远程攻击额外发射两枚弱化弹体。", tags: ["远程", "连击"], attack: 14 },
  { id: "colossus", name: "巨像协议", glyph: "▰", rarity: "棱彩", description: "最大生命和防御大幅提高，反击伤害随生命成长。", tags: ["护盾", "续航", "反击"], hp: 28, guard: 20, attack: 8 },
  { id: "focus", name: "弱点聚焦", glyph: "⌾", rarity: "白银", description: "重复命中同一目标时，暴击率逐步提升。", tags: ["连击", "暴击"], attack: 8, crit: 8 },
  { id: "singularity", name: "奇点引擎", glyph: "⊛", rarity: "棱彩", description: "拥有三个不同流派标签时，所有数值全面提升。", tags: ["技能", "召唤", "成长"], attack: 15, guard: 10, hp: 12, multiplier: 1.07 },
  { id: "counter-step", name: "逆步反制", glyph: "↯", rarity: "白银", description: "闪避后立刻反击，位移和防御产生联动。", tags: ["位移", "反击"], attack: 7, guard: 9 },
  { id: "feast", name: "胜者盛宴", glyph: "♨", rarity: "黄金", description: "每次获胜都恢复生命，并永久积累少量力量。", tags: ["续航", "成长"], attack: 6, heal: 16 },
  { id: "meteor", name: "陨星施法", glyph: "✷", rarity: "黄金", description: "每第四次技能召来陨星，造成爆发范围伤害。", tags: ["技能", "爆发"], attack: 15 },
  { id: "mirror", name: "镜像弹仓", glyph: "▱", rarity: "棱彩", description: "远程攻击会被镜像一次，连击触发门槛降低。", tags: ["远程", "连击", "回响"], attack: 19, multiplier: 1.09 },
];

export const gameEnemies: GameEnemy[] = [
  { name: "巡桥械兵", title: "训练目标", glyph: "♟", power: 38, guard: 8, hp: 74, accent: "#8ea3bf" },
  { name: "棘甲兽", title: "反伤考验", glyph: "♜", power: 57, guard: 14, hp: 96, accent: "#c69463" },
  { name: "镜刃猎手", title: "爆发考验", glyph: "♞", power: 78, guard: 12, hp: 104, accent: "#c27dff" },
  { name: "噬光巨像", title: "生存考验", glyph: "♝", power: 101, guard: 21, hp: 132, accent: "#7dd9c5" },
  { name: "王庭执行者", title: "成型检验", glyph: "♛", power: 128, guard: 23, hp: 148, accent: "#ff7d84" },
  { name: "终焉观测者", title: "最终首领", glyph: "♚", power: 158, guard: 28, hp: 180, accent: "#e5bd59" },
];
