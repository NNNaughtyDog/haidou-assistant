export type Tier = "T1" | "T2" | "T3" | "T4" | "T5";
export type Rarity = "白银" | "黄金" | "棱彩";
export type Strategy = "稳健" | "高上限" | "娱乐";

export type Champion = {
  id: number;
  name: string;
  title: string;
  tier: Tier | null;
  rank: number | null;
  winRate: number | null;
  pickRate: number | null;
  trend: number | null;
  tags: string[];
  augments: string[];
  items: string[];
  source?: string;
};

export type Augment = {
  name: string;
  rarity: Rarity;
  tier: "S+" | "S" | "A" | "B";
  tags: string[];
  summary: string;
};

export type Item = {
  name: string;
  tags: string[];
  tone: string;
};

const knownChampions: Champion[] = [
  { id: 67, name: "薇恩", title: "暗夜猎手", tier: "T1", rank: 1, winRate: 57.73, pickRate: 13.19, trend: 0.15, tags: ["普攻", "攻速", "特效", "暴击"], augments: ["双发快射", "连拨击锤", "双刀流"], items: ["狂战士胫甲", "破败王者之刃", "鬼索的狂暴之刃"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 104, name: "格雷福斯", title: "法外狂徒", tier: "T1", rank: 2, winRate: 57.32, pickRate: 12.26, trend: 0.16, tags: ["暴击", "爆发", "近战", "吸血"], augments: ["亮出你的剑", "升级：无尽之刃", "灵魂虹吸"], items: ["收集者", "水银之靴", "无尽之刃"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 51, name: "凯特琳", title: "皮城女警", tier: "T1", rank: 3, winRate: 55.62, pickRate: 13.17, trend: 0.36, tags: ["暴击", "射程", "普攻", "爆发"], augments: ["暴击飞弹", "升级：无尽之刃", "更万用的瞄准镜"], items: ["收集者", "狂战士胫甲", "无尽之刃"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 223, name: "塔姆肯奇", title: "河流之王", tier: "T1", rank: 4, winRate: 53.9, pickRate: 14.4, trend: null, tags: ["坦克", "近战", "控制", "续航"], augments: ["坦克引擎", "歌利亚巨人", "重量级打击手"], items: ["心之钢", "水银之靴", "振奋盔甲"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 17, name: "提莫", title: "迅捷斥候", tier: "T1", rank: 6, winRate: 53.73, pickRate: 13.42, trend: -0.39, tags: ["法强", "持续伤害", "技能", "攻击特效"], augments: ["虚幻武器", "尤里卡", "大法师"], items: ["残疫", "法师之靴", "兰德里的折磨"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 804, name: "芸阿娜", title: "不破之誓", tier: "T2", rank: 13, winRate: 56.29, pickRate: 8.1, trend: 0.04, tags: ["暴击", "攻速", "普攻", "特效"], augments: ["暴击飞弹", "双刀流", "升级：无尽之刃"], items: ["海妖杀手", "狂战士胫甲", "猎魔人弩箭"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 157, name: "亚索", title: "疾风剑豪", tier: "T2", rank: 8, winRate: 55.73, pickRate: 10.27, trend: -0.02, tags: ["暴击", "攻速", "近战", "机动"], augments: ["秘术冲拳", "狂徒豪气", "升级：无尽之刃"], items: ["狂战士胫甲", "破败王者之刃", "不朽盾弓"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 222, name: "金克丝", title: "暴走萝莉", tier: "T2", rank: null, winRate: 54.73, pickRate: 10.56, trend: 0.31, tags: ["暴击", "攻速", "射程", "普攻"], augments: ["暴击飞弹", "升级：无尽之刃", "双刀流"], items: ["育恩塔尔荒野箭", "狂战士胫甲", "卢安娜的飓风"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 236, name: "卢锡安", title: "圣枪游侠", tier: "T2", rank: 15, winRate: 51.42, pickRate: 13.35, trend: -0.34, tags: ["暴击", "技能", "普攻", "机动"], augments: ["暴击飞弹", "升级：无尽之刃", "珠光护手"], items: ["夺萃之镰", "狂战士胫甲", "纳沃利烁刃"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 18, name: "崔丝塔娜", title: "麦林炮手", tier: "T3", rank: 27, winRate: 51.36, pickRate: 9.01, trend: 0.09, tags: ["暴击", "攻速", "爆发", "普攻"], augments: ["暴击飞弹", "升级：无尽之刃", "双发快射"], items: ["育恩塔尔荒野箭", "狂战士胫甲", "纳沃利烁刃"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 523, name: "厄斐琉斯", title: "残月之肃", tier: "T3", rank: null, winRate: 53.55, pickRate: 4.53, trend: 0, tags: ["暴击", "攻速", "吸血", "普攻"], augments: ["暴击飞弹", "升级：无尽之刃", "灵魂虹吸"], items: ["收集者", "狂战士胫甲", "无尽之刃"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 29, name: "图奇", title: "瘟疫之源", tier: "T3", rank: null, winRate: 49.11, pickRate: 10.05, trend: 0.6, tags: ["攻速", "特效", "暴击", "持续伤害"], augments: ["升级：无尽之刃", "双刀流", "暴击律动"], items: ["狂战士胫甲", "育恩塔尔荒野箭", "卢安娜的飓风"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 875, name: "瑟提", title: "腕豪", tier: "T1", rank: null, winRate: 55.38, pickRate: 12.33, trend: null, tags: ["坦克", "近战", "控制", "爆发"], augments: ["坦克引擎", "飞身踢", "重量级打击手"], items: ["心之钢", "水银之靴", "振奋盔甲"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 517, name: "塞拉斯", title: "解脱者", tier: "T5", rank: 90, winRate: 47, pickRate: 7.6, trend: null, tags: ["法强", "近战", "技能", "续航"], augments: ["神射法师", "术士果汁盒", "旋转至胜"], items: ["海克斯科技火箭腰带", "法师之靴", "裂隙制造者"], source: "ARAMGG / 腾讯国服公开统计" },
  { id: 360, name: "莎弥拉", title: "沙漠玫瑰", tier: "T4", rank: null, winRate: 50.9, pickRate: 5.67, trend: -0.38, tags: ["暴击", "近战", "吸血", "爆发"], augments: ["升级：无尽之刃", "灵魂虹吸", "亮出你的剑"], items: ["收集者", "水银之靴", "不朽盾弓"], source: "ARAMGG / 腾讯国服公开统计" },
];

const roster = `阿狸 阿卡丽 阿克尚 阿利斯塔 阿木木 艾克 艾莉丝 艾翁 艾希 安妮 厄加特 奥恩 奥拉夫 奥莉安娜 奥瑞利安索尔 奥罗拉 巴德 百裂冥犬 宝石骑士 卑尔维斯 布兰德 布里茨 布隆 卡蜜尔 卡尔萨斯 卡萨丁 卡莎 卡特琳娜 卡兹克 凯隐 凯尔 凯南 克烈 克格莫 克隆 克桑特 库奇 德莱厄斯 德莱文 黛安娜 菲奥娜 菲兹 费德提克 盖伦 俄洛伊 加里奥 嘉文四世 贾克斯 杰斯 烬 卡尔玛 卡西奥佩娅 卡牌大师 卡莉丝塔 卡蜜尔 卡特琳娜 卡兹克 凯南 科加斯 克烈 克格莫 兰博 乐芙兰 雷克塞 雷克顿 雷恩加尔 蕾欧娜 莉莉娅 丽桑卓 璐璐 拉克丝 洛 玛尔扎哈 玛卡 亚托克斯 茂凯 梅尔 米利欧 莫德凯撒 莫甘娜 娜美 奈德丽 纳尔 内瑟斯 尼菈 妮蔻 努努和威朗普 诺提勒斯 诺克萨斯之手 派克 潘森 波比 奇亚娜 千珏 奎因 拉莫斯 芮尔 烈娜塔 锐雯 瑞兹 萨科 瑟庄妮 赛恩 萨勒芬妮 塞拉斯 赛娜 瑟提 希维尔 辛吉德 辛德拉 斯卡纳 斯莫德 索拉卡 索娜 斯维因 塔莉垭 塔姆肯奇 泰隆 特朗德尔 泰达米尔 泰隆 提莫 图奇 乌迪尔 乌尔加特 维迦 维克托 维克兹 蔚 弗拉基米尔 沃里克 悟空 霞 辛赵 亚索 永恩 悠米 扎克 劫 泽丽 吉格斯 基兰 佐伊 婕拉 伊泽瑞尔 伊芙琳 伊莉丝 易 雪原双子 俄洛伊 费德提克 赫卡里姆 黑默丁格 慧 迦娜 烬 卡尔玛 卡萨丁 凯隐 克烈 李青 洛克 洛 莉莉娅 米利欧 纳亚菲利 诺克提斯 奥拉夫 奎桑提 雷克顿 萨勒芬妮 萨弥拉 塔里克 亚托克斯 约里克 云顶猫咪 泽拉斯`.split(" ");

const aliases: Record<string, string> = { "烬": "戏命师", "劫": "影流之主", "盖伦": "德玛西亚之力", "亚索": "疾风剑豪", "永恩": "封魔剑魂", "易": "无极剑圣", "拉克丝": "光辉女郎", "伊泽瑞尔": "探险家", "莫甘娜": "堕落天使", "布兰德": "复仇焰魂", "瑟提": "腕豪", "塔姆肯奇": "河流之王" };

const knownNames = new Set(knownChampions.map((c) => c.name));
export const champions: Champion[] = [
  ...knownChampions,
  ...Array.from(new Set(roster)).filter((name) => !knownNames.has(name)).map((name, index) => ({
    id: 9000 + index,
    name,
    title: aliases[name] ?? "英雄数据同步中",
    tier: null,
    rank: null,
    winRate: null,
    pickRate: null,
    trend: null,
    tags: ["待同步"],
    augments: [],
    items: [],
  })),
];

export const augments: Augment[] = [
  { name: "暴击飞弹", rarity: "黄金", tier: "S+", tags: ["暴击", "技能", "爆发"], summary: "技能暴击路线的核心启动器。" },
  { name: "升级：无尽之刃", rarity: "黄金", tier: "S+", tags: ["暴击", "爆发"], summary: "直接放大暴击体系的成型收益。" },
  { name: "双刀流", rarity: "棱彩", tier: "S+", tags: ["普攻", "攻速", "特效"], summary: "追加攻击并强化攻击特效。" },
  { name: "双发快射", rarity: "棱彩", tier: "S+", tags: ["普攻", "攻速", "特效"], summary: "高频普攻英雄的质变强化。" },
  { name: "连拨击锤", rarity: "黄金", tier: "S+", tags: ["普攻", "攻速", "特效"], summary: "持续作战时快速叠出优势。" },
  { name: "亮出你的剑", rarity: "棱彩", tier: "S", tags: ["近战", "暴击", "爆发"], summary: "用射程换取近身爆发上限。" },
  { name: "灵魂虹吸", rarity: "黄金", tier: "S+", tags: ["暴击", "吸血", "续航"], summary: "暴击与续航同时成长。" },
  { name: "更万用的瞄准镜", rarity: "黄金", tier: "S+", tags: ["射程", "普攻"], summary: "拉开输出位置，提高持续输出空间。" },
  { name: "最万用的瞄准镜", rarity: "棱彩", tier: "S+", tags: ["射程", "普攻"], summary: "远程核心的顶级安全距离。" },
  { name: "暴击律动", rarity: "黄金", tier: "S+", tags: ["暴击", "攻速", "普攻"], summary: "暴击节奏与攻速联动。" },
  { name: "踢踏舞", rarity: "棱彩", tier: "S+", tags: ["攻速", "移速", "普攻"], summary: "持续攻击累积攻速和机动。" },
  { name: "珠光护手", rarity: "棱彩", tier: "S", tags: ["技能", "暴击", "法强"], summary: "让高倍率技能获得暴击上限。" },
  { name: "虚幻武器", rarity: "棱彩", tier: "S+", tags: ["技能", "攻击特效", "法强"], summary: "技能触发攻击特效，开启混合玩法。" },
  { name: "尤里卡", rarity: "黄金", tier: "S+", tags: ["技能", "急速", "法强"], summary: "法强成长同时压缩技能窗口。" },
  { name: "大法师", rarity: "棱彩", tier: "S+", tags: ["技能", "急速", "法强"], summary: "技能循环路线的核心强化。" },
  { name: "战争交响乐", rarity: "棱彩", tier: "S", tags: ["攻速", "普攻", "续航"], summary: "兼顾攻速与持续战斗能力。" },
  { name: "巨人杀手", rarity: "棱彩", tier: "S", tags: ["爆发", "坦克克制"], summary: "对高生命值阵容提高斩杀效率。" },
  { name: "炼狱导管", rarity: "黄金", tier: "S", tags: ["持续伤害", "技能", "急速"], summary: "持续伤害不断压缩技能冷却。" },
  { name: "全能龙魂", rarity: "棱彩", tier: "A", tags: ["通用", "续航", "爆发"], summary: "获得多个随机龙魂，通用但波动较大。" },
  { name: "坚韧不屈", rarity: "白银", tier: "A", tags: ["坦克", "续航"], summary: "低血量时显著提高恢复能力。" },
  { name: "扇巴掌", rarity: "黄金", tier: "A", tags: ["近战", "控制", "坦克"], summary: "控制与近身缠斗时持续成长。" },
  { name: "重量级打击", rarity: "棱彩", tier: "S", tags: ["坦克", "爆发", "近战"], summary: "把防御属性转化为处决和爆发。" },
  { name: "灵巧", rarity: "白银", tier: "S+", tags: ["攻速", "普攻"], summary: "简单直接的攻速增强。" },
  { name: "台风", rarity: "白银", tier: "S+", tags: ["普攻", "特效"], summary: "普攻路线的稳定额外收益。" },
  { name: "坦克引擎", rarity: "黄金", tier: "S+", tags: ["坦克", "续航", "近战"], summary: "持续承伤转化为前排成长。" },
  { name: "歌利亚巨人", rarity: "棱彩", tier: "S+", tags: ["坦克", "续航", "近战"], summary: "大幅强化生命与体型收益。" },
  { name: "重量级打击手", rarity: "黄金", tier: "S", tags: ["坦克", "爆发", "近战"], summary: "生命值路线获得额外打击能力。" },
  { name: "飞身踢", rarity: "黄金", tier: "S", tags: ["近战", "控制", "机动"], summary: "进场与控制型英雄的高价值启动器。" },
  { name: "秘术冲拳", rarity: "棱彩", tier: "S+", tags: ["近战", "普攻", "技能"], summary: "攻击与技能穿插时显著缩短循环。" },
  { name: "狂徒豪气", rarity: "黄金", tier: "S", tags: ["近战", "续航", "爆发"], summary: "近身作战越久，战斗收益越高。" },
  { name: "神射法师", rarity: "黄金", tier: "S", tags: ["法强", "技能", "普攻"], summary: "法术与普攻混合输出的关键桥梁。" },
  { name: "术士果汁盒", rarity: "白银", tier: "A", tags: ["法强", "续航", "技能"], summary: "提高法系英雄的持续作战容错。" },
  { name: "旋转至胜", rarity: "黄金", tier: "S", tags: ["技能", "近战", "持续伤害"], summary: "适合贴身多段与持续伤害玩法。" },
];

export const items: Item[] = [
  { name: "无尽之刃", tags: ["暴击", "爆发"], tone: "#f5c96a" },
  { name: "育恩塔尔荒野箭", tags: ["暴击", "普攻"], tone: "#e97171" },
  { name: "卢安娜的飓风", tags: ["攻速", "普攻", "特效"], tone: "#52c7b8" },
  { name: "破败王者之刃", tags: ["攻速", "特效", "续航"], tone: "#8f7be8" },
  { name: "鬼索的狂暴之刃", tags: ["攻速", "特效"], tone: "#cf745c" },
  { name: "收集者", tags: ["暴击", "爆发"], tone: "#c4d3e5" },
  { name: "海妖杀手", tags: ["攻速", "普攻", "特效"], tone: "#6ec5d8" },
  { name: "纳沃利烁刃", tags: ["暴击", "技能", "急速"], tone: "#8db6ff" },
  { name: "夺萃之镰", tags: ["暴击", "技能", "急速"], tone: "#d6d7e8" },
  { name: "不朽盾弓", tags: ["暴击", "续航"], tone: "#d6a46d" },
  { name: "兰德里的折磨", tags: ["法强", "持续伤害"], tone: "#d06a6a" },
  { name: "残疫", tags: ["法强", "持续伤害", "技能"], tone: "#5ecb8b" },
  { name: "灭世者的死亡之帽", tags: ["法强", "爆发"], tone: "#a97af4" },
  { name: "中娅沙漏", tags: ["法强", "容错"], tone: "#f1d360" },
  { name: "狂战士胫甲", tags: ["攻速", "普攻"], tone: "#c79a72" },
  { name: "法师之靴", tags: ["法强", "爆发"], tone: "#a087f6" },
  { name: "水银之靴", tags: ["容错", "坦克"], tone: "#7da8a7" },
  { name: "兰顿之兆", tags: ["坦克", "暴击克制"], tone: "#6f8fa5" },
  { name: "心之钢", tags: ["坦克", "续航", "近战"], tone: "#c65e65" },
  { name: "振奋盔甲", tags: ["坦克", "续航"], tone: "#63a98d" },
  { name: "海克斯科技火箭腰带", tags: ["法强", "爆发", "机动"], tone: "#7d8bd9" },
  { name: "裂隙制造者", tags: ["法强", "续航", "持续伤害"], tone: "#a14f7e" },
];

export const patchInfo = {
  patch: "16.16",
  updatedAt: "2026-08-18 06:00",
  heroSample: "国服公开统计",
};
