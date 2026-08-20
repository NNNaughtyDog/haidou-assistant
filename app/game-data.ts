import { augmentPoolByKey, augmentSourceByName, cnStatsByKey, heroAugmentStatsByKey, hexdataSnapshot } from "./hexdata-snapshot";

export type Tier = "T1" | "T2" | "T3" | "T4" | "T5";
export type Rarity = "白银" | "黄金" | "棱彩";
export type Strategy = "稳健" | "高上限" | "娱乐";
export type Region = "cn" | "global";
export type HeroStats = { tier: Tier; rank: number | null; winRate: number; pickRate: number | null; trend: number | null; games?: number };
export type Champion = { key: number; riotId: string; name: string; title: string; image: string; tags: string[]; cn: HeroStats | null; global: HeroStats | null; augments: string[]; augmentPool: string[]; items: string[] };
export type Augment = { name: string; rarity: Rarity; tier: "S+" | "S" | "A" | "B"; tags: string[]; summary: string; rank: number; icon: string | null; iconSource: "client-extracted"; winRate: number; pickRate: number; games: number };
export type HeroAugmentStat = { games: number; winRate: number | null };
type ChampionCatalogEntry = Omit<Champion, "augmentPool">;
type LocalAugment = Omit<Augment, "iconSource" | "winRate" | "pickRate" | "games">;
export type Item = { id: string; name: string; tags: string[] };

const DDRAGON_VERSION = "16.16.1";
const DDRAGON_CDN = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;
const CDRAGON_CDN = "https://raw.communitydragon.org/16.16/game/assets/ux/cherry/augments/icons";

const championCatalog = [
  {
    "key": 67,
    "riotId": "Vayne",
    "name": "薇恩",
    "title": "暗夜猎手",
    "image": "Vayne.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": {
      "tier": "T1",
      "rank": 1,
      "winRate": 57.73,
      "pickRate": 13.19,
      "trend": 0.15
    },
    "global": {
      "tier": "T1",
      "rank": 1,
      "winRate": 57.63,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "双发快射",
      "连拨击锤",
      "双刀流"
    ],
    "items": [
      "狂战士胫甲",
      "破败王者之刃",
      "鬼索的狂暴之刃"
    ]
  },
  {
    "key": 104,
    "riotId": "Graves",
    "name": "格雷福斯",
    "title": "法外狂徒",
    "image": "Graves.png",
    "tags": [
      "普攻"
    ],
    "cn": {
      "tier": "T1",
      "rank": 2,
      "winRate": 57.32,
      "pickRate": 12.26,
      "trend": 0.16
    },
    "global": {
      "tier": "T1",
      "rank": 2,
      "winRate": 57.14,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "亮出你的剑",
      "升级：无尽之刃",
      "灵魂虹吸"
    ],
    "items": [
      "收集者",
      "水银之靴",
      "无尽之刃"
    ]
  },
  {
    "key": 51,
    "riotId": "Caitlyn",
    "name": "凯特琳",
    "title": "皮城女警",
    "image": "Caitlyn.png",
    "tags": [
      "普攻"
    ],
    "cn": {
      "tier": "T1",
      "rank": 3,
      "winRate": 55.62,
      "pickRate": 13.17,
      "trend": 0.36
    },
    "global": {
      "tier": "T1",
      "rank": 3,
      "winRate": 55.59,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "暴击飞弹",
      "升级：无尽之刃",
      "更万用的瞄准镜"
    ],
    "items": [
      "收集者",
      "狂战士胫甲",
      "无尽之刃"
    ]
  },
  {
    "key": 223,
    "riotId": "TahmKench",
    "name": "塔姆肯奇",
    "title": "河流之王",
    "image": "TahmKench.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": {
      "tier": "T1",
      "rank": 4,
      "winRate": 53.9,
      "pickRate": 14.4,
      "trend": null
    },
    "global": {
      "tier": "T1",
      "rank": 4,
      "winRate": 53.8,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "坦克引擎",
      "歌利亚巨人",
      "重量级打击手"
    ],
    "items": [
      "心之钢",
      "水银之靴",
      "振奋盔甲"
    ]
  },
  {
    "key": 875,
    "riotId": "Sett",
    "name": "瑟提",
    "title": "腕豪",
    "image": "Sett.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": {
      "tier": "T1",
      "rank": null,
      "winRate": 55.38,
      "pickRate": 12.33,
      "trend": null
    },
    "global": {
      "tier": "T1",
      "rank": 5,
      "winRate": 55.38,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "坦克引擎",
      "飞身踢",
      "重量级打击手"
    ],
    "items": [
      "心之钢",
      "水银之靴",
      "振奋盔甲"
    ]
  },
  {
    "key": 63,
    "riotId": "Brand",
    "name": "布兰德",
    "title": "复仇焰魂",
    "image": "Brand.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T1",
      "rank": 6,
      "winRate": 53.51,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 17,
    "riotId": "Teemo",
    "name": "提莫",
    "title": "迅捷斥候",
    "image": "Teemo.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": {
      "tier": "T1",
      "rank": 6,
      "winRate": 53.73,
      "pickRate": 13.42,
      "trend": -0.39
    },
    "global": {
      "tier": "T1",
      "rank": 7,
      "winRate": 53.78,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "虚幻武器",
      "尤里卡",
      "大法师"
    ],
    "items": [
      "残疫",
      "法师之靴",
      "兰德里的折磨"
    ]
  },
  {
    "key": 222,
    "riotId": "Jinx",
    "name": "金克丝",
    "title": "暴走萝莉",
    "image": "Jinx.png",
    "tags": [
      "普攻"
    ],
    "cn": {
      "tier": "T2",
      "rank": null,
      "winRate": 54.73,
      "pickRate": 10.56,
      "trend": 0.31
    },
    "global": {
      "tier": "T2",
      "rank": 8,
      "winRate": 54.75,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "暴击飞弹",
      "升级：无尽之刃",
      "双刀流"
    ],
    "items": [
      "育恩塔尔荒野箭",
      "狂战士胫甲",
      "卢安娜的飓风"
    ]
  },
  {
    "key": 157,
    "riotId": "Yasuo",
    "name": "亚索",
    "title": "疾风剑豪",
    "image": "Yasuo.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": {
      "tier": "T2",
      "rank": 8,
      "winRate": 55.73,
      "pickRate": 10.27,
      "trend": -0.02
    },
    "global": {
      "tier": "T2",
      "rank": 9,
      "winRate": 55.51,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "秘术冲拳",
      "狂徒豪气",
      "升级：无尽之刃"
    ],
    "items": [
      "狂战士胫甲",
      "破败王者之刃",
      "不朽盾弓"
    ]
  },
  {
    "key": 25,
    "riotId": "Morgana",
    "name": "莫甘娜",
    "title": "堕落天使",
    "image": "Morgana.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 10,
      "winRate": 54.45,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 21,
    "riotId": "MissFortune",
    "name": "厄运小姐",
    "title": "赏金猎人",
    "image": "MissFortune.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 11,
      "winRate": 52,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 876,
    "riotId": "Lillia",
    "name": "莉莉娅",
    "title": "含羞蓓蕾",
    "image": "Lillia.png",
    "tags": [
      "战士",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 12,
      "winRate": 55.66,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 136,
    "riotId": "AurelionSol",
    "name": "奥瑞利安·索尔",
    "title": "铸星龙王",
    "image": "AurelionSol.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 13,
      "winRate": 52.83,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 804,
    "riotId": "Yunara",
    "name": "芸阿娜",
    "title": "不破之誓",
    "image": "Yunara.png",
    "tags": [
      "普攻"
    ],
    "cn": {
      "tier": "T2",
      "rank": 13,
      "winRate": 56.29,
      "pickRate": 8.1,
      "trend": 0.04
    },
    "global": {
      "tier": "T2",
      "rank": 14,
      "winRate": 56.2,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "暴击飞弹",
      "双刀流",
      "升级：无尽之刃"
    ],
    "items": [
      "海妖杀手",
      "狂战士胫甲",
      "收集者"
    ]
  },
  {
    "key": 14,
    "riotId": "Sion",
    "name": "赛恩",
    "title": "亡灵战神",
    "image": "Sion.png",
    "tags": [
      "坦克",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 15,
      "winRate": 53.39,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 4,
    "riotId": "TwistedFate",
    "name": "崔斯特",
    "title": "卡牌大师",
    "image": "TwistedFate.png",
    "tags": [
      "法强",
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 16,
      "winRate": 54.42,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 141,
    "riotId": "Kayn",
    "name": "凯隐",
    "title": "影流之镰",
    "image": "Kayn.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 17,
      "winRate": 54.8,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 236,
    "riotId": "Lucian",
    "name": "卢锡安",
    "title": "圣枪游侠",
    "image": "Lucian.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": {
      "tier": "T2",
      "rank": 15,
      "winRate": 51.42,
      "pickRate": 13.35,
      "trend": -0.34
    },
    "global": {
      "tier": "T2",
      "rank": 18,
      "winRate": 51.3,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "暴击飞弹",
      "升级：无尽之刃",
      "珠光护手"
    ],
    "items": [
      "夺萃之镰",
      "狂战士胫甲",
      "纳沃利烁刃"
    ]
  },
  {
    "key": 10,
    "riotId": "Kayle",
    "name": "凯尔",
    "title": "正义天使",
    "image": "Kayle.png",
    "tags": [
      "法强",
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 19,
      "winRate": 54.49,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 13,
    "riotId": "Ryze",
    "name": "瑞兹",
    "title": "符文法师",
    "image": "Ryze.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 20,
      "winRate": 51.79,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 901,
    "riotId": "Smolder",
    "name": "斯莫德",
    "title": "炽炎雏龙",
    "image": "Smolder.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 21,
      "winRate": 51.32,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 36,
    "riotId": "DrMundo",
    "name": "蒙多医生",
    "title": "祖安狂人",
    "image": "DrMundo.png",
    "tags": [
      "坦克",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 22,
      "winRate": 51.08,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 893,
    "riotId": "Aurora",
    "name": "阿萝拉",
    "title": "双界灵兔",
    "image": "Aurora.png",
    "tags": [
      "法强",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 23,
      "winRate": 54.65,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 147,
    "riotId": "Seraphine",
    "name": "萨勒芬妮",
    "title": "星籁歌姬",
    "image": "Seraphine.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 24,
      "winRate": 56.22,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 526,
    "riotId": "Rell",
    "name": "芮尔",
    "title": "镕铁少女",
    "image": "Rell.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T2",
      "rank": 25,
      "winRate": 53.22,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 18,
    "riotId": "Tristana",
    "name": "崔丝塔娜",
    "title": "麦林炮手",
    "image": "Tristana.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": {
      "tier": "T3",
      "rank": 27,
      "winRate": 51.36,
      "pickRate": 9.01,
      "trend": 0.09
    },
    "global": {
      "tier": "T2",
      "rank": 26,
      "winRate": 51.3,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "暴击飞弹",
      "升级：无尽之刃",
      "双发快射"
    ],
    "items": [
      "育恩塔尔荒野箭",
      "狂战士胫甲",
      "纳沃利烁刃"
    ]
  },
  {
    "key": 777,
    "riotId": "Yone",
    "name": "永恩",
    "title": "封魔剑魂",
    "image": "Yone.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 27,
      "winRate": 54.25,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 12,
    "riotId": "Alistar",
    "name": "阿利斯塔",
    "title": "牛头酋长",
    "image": "Alistar.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 28,
      "winRate": 52.93,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 90,
    "riotId": "Malzahar",
    "name": "玛尔扎哈",
    "title": "虚空先知",
    "image": "Malzahar.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 29,
      "winRate": 50.72,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 245,
    "riotId": "Ekko",
    "name": "艾克",
    "title": "时间刺客",
    "image": "Ekko.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 30,
      "winRate": 51.93,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 11,
    "riotId": "MasterYi",
    "name": "易",
    "title": "无极剑圣",
    "image": "MasterYi.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 31,
      "winRate": 49.72,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 98,
    "riotId": "Shen",
    "name": "慎",
    "title": "暮光之眼",
    "image": "Shen.png",
    "tags": [
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 32,
      "winRate": 53.01,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 202,
    "riotId": "Jhin",
    "name": "烬",
    "title": "戏命师",
    "image": "Jhin.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 33,
      "winRate": 49.29,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 498,
    "riotId": "Xayah",
    "name": "霞",
    "title": "逆羽",
    "image": "Xayah.png",
    "tags": [
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 34,
      "winRate": 51.36,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 111,
    "riotId": "Nautilus",
    "name": "诺提勒斯",
    "title": "深海泰坦",
    "image": "Nautilus.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 35,
      "winRate": 49.66,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 120,
    "riotId": "Hecarim",
    "name": "赫卡里姆",
    "title": "战争之影",
    "image": "Hecarim.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 36,
      "winRate": 50.25,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 57,
    "riotId": "Maokai",
    "name": "茂凯",
    "title": "扭曲树精",
    "image": "Maokai.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 37,
      "winRate": 49.48,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 910,
    "riotId": "Hwei",
    "name": "彗",
    "title": "异画师",
    "image": "Hwei.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 38,
      "winRate": 54.47,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 145,
    "riotId": "Kaisa",
    "name": "卡莎",
    "title": "虚空之女",
    "image": "Kaisa.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 39,
      "winRate": 47.94,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 5,
    "riotId": "XinZhao",
    "name": "赵信",
    "title": "德邦总管",
    "image": "XinZhao.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 40,
      "winRate": 50.34,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 45,
    "riotId": "Veigar",
    "name": "维迦",
    "title": "邪恶小法师",
    "image": "Veigar.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 41,
      "winRate": 50.58,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 103,
    "riotId": "Ahri",
    "name": "阿狸",
    "title": "九尾妖狐",
    "image": "Ahri.png",
    "tags": [
      "法强",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 42,
      "winRate": 53.21,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 29,
    "riotId": "Twitch",
    "name": "图奇",
    "title": "瘟疫之源",
    "image": "Twitch.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": {
      "tier": "T3",
      "rank": null,
      "winRate": 49.11,
      "pickRate": 10.05,
      "trend": 0.6
    },
    "global": {
      "tier": "T3",
      "rank": 43,
      "winRate": 49.02,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "升级：无尽之刃",
      "双刀流",
      "暴击律动"
    ],
    "items": [
      "狂战士胫甲",
      "育恩塔尔荒野箭",
      "卢安娜的飓风"
    ]
  },
  {
    "key": 110,
    "riotId": "Varus",
    "name": "韦鲁斯",
    "title": "惩戒之箭",
    "image": "Varus.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 44,
      "winRate": 49.4,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 42,
    "riotId": "Corki",
    "name": "库奇",
    "title": "英勇投弹手",
    "image": "Corki.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 45,
      "winRate": 50.46,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 420,
    "riotId": "Illaoi",
    "name": "俄洛伊",
    "title": "海兽祭司",
    "image": "Illaoi.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 46,
      "winRate": 51.35,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 81,
    "riotId": "Ezreal",
    "name": "伊泽瑞尔",
    "title": "探险家",
    "image": "Ezreal.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 47,
      "winRate": 47.88,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 112,
    "riotId": "Viktor",
    "name": "维克托",
    "title": "奥术先驱",
    "image": "Viktor.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 48,
      "winRate": 52.66,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 26,
    "riotId": "Zilean",
    "name": "基兰",
    "title": "时光守护者",
    "image": "Zilean.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 49,
      "winRate": 52.98,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 523,
    "riotId": "Aphelios",
    "name": "厄斐琉斯",
    "title": "残月之肃",
    "image": "Aphelios.png",
    "tags": [
      "普攻"
    ],
    "cn": {
      "tier": "T3",
      "rank": null,
      "winRate": 53.55,
      "pickRate": 4.53,
      "trend": 0
    },
    "global": {
      "tier": "T3",
      "rank": 50,
      "winRate": 53.62,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "暴击飞弹",
      "升级：无尽之刃",
      "灵魂虹吸"
    ],
    "items": [
      "收集者",
      "狂战士胫甲",
      "无尽之刃"
    ]
  },
  {
    "key": 30,
    "riotId": "Karthus",
    "name": "卡尔萨斯",
    "title": "死亡颂唱者",
    "image": "Karthus.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 51,
      "winRate": 47.57,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 134,
    "riotId": "Syndra",
    "name": "辛德拉",
    "title": "暗黑元首",
    "image": "Syndra.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T3",
      "rank": 52,
      "winRate": 52.27,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 48,
    "riotId": "Trundle",
    "name": "特朗德尔",
    "title": "巨魔之王",
    "image": "Trundle.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 53,
      "winRate": 47.85,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 887,
    "riotId": "Gwen",
    "name": "格温",
    "title": "灵罗娃娃",
    "image": "Gwen.png",
    "tags": [
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 54,
      "winRate": 55.83,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 161,
    "riotId": "Velkoz",
    "name": "维克兹",
    "title": "虚空之眼",
    "image": "Velkoz.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 55,
      "winRate": 51.45,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 113,
    "riotId": "Sejuani",
    "name": "瑟庄妮",
    "title": "北地之怒",
    "image": "Sejuani.png",
    "tags": [
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 56,
      "winRate": 50.64,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 114,
    "riotId": "Fiora",
    "name": "菲奥娜",
    "title": "无双剑姬",
    "image": "Fiora.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 57,
      "winRate": 52.08,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 54,
    "riotId": "Malphite",
    "name": "墨菲特",
    "title": "熔岩巨兽",
    "image": "Malphite.png",
    "tags": [
      "坦克",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 58,
      "winRate": 47.35,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 360,
    "riotId": "Samira",
    "name": "莎弥拉",
    "title": "沙漠玫瑰",
    "image": "Samira.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": {
      "tier": "T4",
      "rank": null,
      "winRate": 50.9,
      "pickRate": 5.67,
      "trend": -0.38
    },
    "global": {
      "tier": "T4",
      "rank": 59,
      "winRate": 50.78,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "升级：无尽之刃",
      "灵魂虹吸",
      "亮出你的剑"
    ],
    "items": [
      "收集者",
      "水银之靴",
      "不朽盾弓"
    ]
  },
  {
    "key": 235,
    "riotId": "Senna",
    "name": "赛娜",
    "title": "涤魂圣枪",
    "image": "Senna.png",
    "tags": [
      "续航",
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 60,
      "winRate": 47.98,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 105,
    "riotId": "Fizz",
    "name": "菲兹",
    "title": "潮汐海灵",
    "image": "Fizz.png",
    "tags": [
      "爆发",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 61,
      "winRate": 49.13,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 27,
    "riotId": "Singed",
    "name": "辛吉德",
    "title": "炼金术士",
    "image": "Singed.png",
    "tags": [
      "坦克",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 62,
      "winRate": 50.2,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 59,
    "riotId": "JarvanIV",
    "name": "嘉文四世",
    "title": "德玛西亚皇子",
    "image": "JarvanIV.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 63,
      "winRate": 47.34,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 101,
    "riotId": "Xerath",
    "name": "泽拉斯",
    "title": "远古巫灵",
    "image": "Xerath.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 64,
      "winRate": 49.17,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 68,
    "riotId": "Rumble",
    "name": "兰博",
    "title": "机械公敌",
    "image": "Rumble.png",
    "tags": [
      "战士",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 65,
      "winRate": 50.34,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 3,
    "riotId": "Galio",
    "name": "加里奥",
    "title": "正义巨像",
    "image": "Galio.png",
    "tags": [
      "坦克",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 66,
      "winRate": 49.32,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 24,
    "riotId": "Jax",
    "name": "贾克斯",
    "title": "武器大师",
    "image": "Jax.png",
    "tags": [
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 67,
      "winRate": 50.36,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 78,
    "riotId": "Poppy",
    "name": "波比",
    "title": "圣锤之毅",
    "image": "Poppy.png",
    "tags": [
      "坦克",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 68,
      "winRate": 51.54,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 55,
    "riotId": "Katarina",
    "name": "卡特琳娜",
    "title": "不祥之刃",
    "image": "Katarina.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T4",
      "rank": 69,
      "winRate": 48.64,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 89,
    "riotId": "Leona",
    "name": "蕾欧娜",
    "title": "曙光女神",
    "image": "Leona.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 70,
      "winRate": 49.41,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 99,
    "riotId": "Lux",
    "name": "拉克丝",
    "title": "光辉女郎",
    "image": "Lux.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 71,
      "winRate": 49.51,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 16,
    "riotId": "Soraka",
    "name": "索拉卡",
    "title": "众星之子",
    "image": "Soraka.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 72,
      "winRate": 51.72,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 37,
    "riotId": "Sona",
    "name": "娑娜",
    "title": "琴瑟仙女",
    "image": "Sona.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 73,
      "winRate": 52.67,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 800,
    "riotId": "Mel",
    "name": "梅尔",
    "title": "流光镜影",
    "image": "Mel.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 74,
      "winRate": 48.3,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 41,
    "riotId": "Gangplank",
    "name": "普朗克",
    "title": "海洋之灾",
    "image": "Gangplank.png",
    "tags": [
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 75,
      "winRate": 48.3,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 31,
    "riotId": "Chogath",
    "name": "科加斯",
    "title": "虚空恐惧",
    "image": "Chogath.png",
    "tags": [
      "坦克",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 76,
      "winRate": 46.49,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 50,
    "riotId": "Swain",
    "name": "斯维因",
    "title": "诺克萨斯统领",
    "image": "Swain.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 77,
      "winRate": 46.92,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 350,
    "riotId": "Yuumi",
    "name": "悠米",
    "title": "魔法猫咪",
    "image": "Yuumi.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 78,
      "winRate": 52.42,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 102,
    "riotId": "Shyvana",
    "name": "希瓦娜",
    "title": "龙血武姬",
    "image": "Shyvana.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 79,
      "winRate": 50.4,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 15,
    "riotId": "Sivir",
    "name": "希维尔",
    "title": "战争女神",
    "image": "Sivir.png",
    "tags": [
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 80,
      "winRate": 49.27,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 96,
    "riotId": "KogMaw",
    "name": "克格莫",
    "title": "深渊巨口",
    "image": "KogMaw.png",
    "tags": [
      "普攻",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 81,
      "winRate": 49.36,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 115,
    "riotId": "Ziggs",
    "name": "吉格斯",
    "title": "爆破鬼才",
    "image": "Ziggs.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 82,
      "winRate": 48.84,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 119,
    "riotId": "Draven",
    "name": "德莱文",
    "title": "荣耀行刑官",
    "image": "Draven.png",
    "tags": [
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 83,
      "winRate": 50.22,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 517,
    "riotId": "Sylas",
    "name": "塞拉斯",
    "title": "解脱者",
    "image": "Sylas.png",
    "tags": [
      "法强",
      "爆发"
    ],
    "cn": {
      "tier": "T5",
      "rank": 90,
      "winRate": 47,
      "pickRate": 7.6,
      "trend": null
    },
    "global": {
      "tier": "T5",
      "rank": 84,
      "winRate": 46.67,
      "pickRate": null,
      "trend": null
    },
    "augments": [
      "神射法师",
      "术士果汁盒",
      "旋转至胜"
    ],
    "items": [
      "海克斯科技火箭腰带",
      "法师之靴",
      "裂隙制造者"
    ]
  },
  {
    "key": 82,
    "riotId": "Mordekaiser",
    "name": "莫德凯撒",
    "title": "铁铠冥魂",
    "image": "Mordekaiser.png",
    "tags": [
      "战士",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 85,
      "winRate": 47.1,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 516,
    "riotId": "Ornn",
    "name": "奥恩",
    "title": "山隐之焰",
    "image": "Ornn.png",
    "tags": [
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 86,
      "winRate": 48.43,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 86,
    "riotId": "Garen",
    "name": "盖伦",
    "title": "德玛西亚之力",
    "image": "Garen.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 87,
      "winRate": 46.07,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 799,
    "riotId": "Ambessa",
    "name": "安蓓萨",
    "title": "铁血狼母",
    "image": "Ambessa.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 88,
      "winRate": 51.13,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 75,
    "riotId": "Nasus",
    "name": "内瑟斯",
    "title": "沙漠死神",
    "image": "Nasus.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 89,
      "winRate": 48.69,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 143,
    "riotId": "Zyra",
    "name": "婕拉",
    "title": "荆棘之兴",
    "image": "Zyra.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 90,
      "winRate": 49.96,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 40,
    "riotId": "Janna",
    "name": "迦娜",
    "title": "风暴之怒",
    "image": "Janna.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 91,
      "winRate": 52.82,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 8,
    "riotId": "Vladimir",
    "name": "弗拉基米尔",
    "title": "猩红收割者",
    "image": "Vladimir.png",
    "tags": [
      "法强",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 92,
      "winRate": 48.09,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 35,
    "riotId": "Shaco",
    "name": "萨科",
    "title": "恶魔小丑",
    "image": "Shaco.png",
    "tags": [
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 93,
      "winRate": 44.69,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 32,
    "riotId": "Amumu",
    "name": "阿木木",
    "title": "殇之木乃伊",
    "image": "Amumu.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 94,
      "winRate": 48.78,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 74,
    "riotId": "Heimerdinger",
    "name": "黑默丁格",
    "title": "大发明家",
    "image": "Heimerdinger.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 95,
      "winRate": 50.21,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 238,
    "riotId": "Zed",
    "name": "劫",
    "title": "影流之主",
    "image": "Zed.png",
    "tags": [
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 96,
      "winRate": 46.47,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 9,
    "riotId": "Fiddlesticks",
    "name": "费德提克",
    "title": "远古恐惧",
    "image": "Fiddlesticks.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 97,
      "winRate": 49.48,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 904,
    "riotId": "Zaahen",
    "name": "亚恒",
    "title": "不落魔锋",
    "image": "Zaahen.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 98,
      "winRate": 50.9,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 200,
    "riotId": "Belveth",
    "name": "卑尔维斯",
    "title": "虚空女皇",
    "image": "Belveth.png",
    "tags": [
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 99,
      "winRate": 50.98,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 166,
    "riotId": "Akshan",
    "name": "阿克尚",
    "title": "影哨",
    "image": "Akshan.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 100,
      "winRate": 49.45,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 888,
    "riotId": "Renata",
    "name": "烈娜塔 · 戈拉斯克",
    "title": "炼金男爵",
    "image": "Renata.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 101,
      "winRate": 52.45,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 106,
    "riotId": "Volibear",
    "name": "沃利贝尔",
    "title": "不灭狂雷",
    "image": "Volibear.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 102,
      "winRate": 48.22,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 126,
    "riotId": "Jayce",
    "name": "杰斯",
    "title": "未来守护者",
    "image": "Jayce.png",
    "tags": [
      "战士",
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 103,
      "winRate": 44.36,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 77,
    "riotId": "Udyr",
    "name": "乌迪尔",
    "title": "兽灵行者",
    "image": "Udyr.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 104,
      "winRate": 47.13,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 902,
    "riotId": "Milio",
    "name": "米利欧",
    "title": "明烛",
    "image": "Milio.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 105,
      "winRate": 51.77,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 23,
    "riotId": "Tryndamere",
    "name": "泰达米尔",
    "title": "蛮族之王",
    "image": "Tryndamere.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 106,
      "winRate": 47.07,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 38,
    "riotId": "Kassadin",
    "name": "卡萨丁",
    "title": "虚空行者",
    "image": "Kassadin.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 107,
      "winRate": 49.74,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 43,
    "riotId": "Karma",
    "name": "卡尔玛",
    "title": "天启者",
    "image": "Karma.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 108,
      "winRate": 49.29,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 53,
    "riotId": "Blitzcrank",
    "name": "布里茨",
    "title": "蒸汽机器人",
    "image": "Blitzcrank.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 109,
      "winRate": 44.88,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 76,
    "riotId": "Nidalee",
    "name": "奈德丽",
    "title": "狂野女猎手",
    "image": "Nidalee.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 110,
      "winRate": 45.47,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 267,
    "riotId": "Nami",
    "name": "娜美",
    "title": "唤潮鲛姬",
    "image": "Nami.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 111,
      "winRate": 51.15,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 429,
    "riotId": "Kalista",
    "name": "卡莉丝塔",
    "title": "复仇之矛",
    "image": "Kalista.png",
    "tags": [
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 112,
      "winRate": 49.57,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 203,
    "riotId": "Kindred",
    "name": "千珏",
    "title": "永猎双子",
    "image": "Kindred.png",
    "tags": [
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 113,
      "winRate": 47.63,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 122,
    "riotId": "Darius",
    "name": "德莱厄斯",
    "title": "诺克萨斯之手",
    "image": "Darius.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 114,
      "winRate": 44.66,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 711,
    "riotId": "Vex",
    "name": "薇古丝",
    "title": "愁云使者",
    "image": "Vex.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 115,
      "winRate": 50.35,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 221,
    "riotId": "Zeri",
    "name": "泽丽",
    "title": "祖安花火",
    "image": "Zeri.png",
    "tags": [
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 116,
      "winRate": 49.83,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 150,
    "riotId": "Gnar",
    "name": "纳尔",
    "title": "迷失之牙",
    "image": "Gnar.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 117,
      "winRate": 49.18,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 61,
    "riotId": "Orianna",
    "name": "奥莉安娜",
    "title": "发条魔灵",
    "image": "Orianna.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 118,
      "winRate": 49.3,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 412,
    "riotId": "Thresh",
    "name": "锤石",
    "title": "魂锁典狱长",
    "image": "Thresh.png",
    "tags": [
      "续航",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 119,
      "winRate": 43.42,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 233,
    "riotId": "Briar",
    "name": "贝蕾亚",
    "title": "狂厄蔷薇",
    "image": "Briar.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 120,
      "winRate": 49.93,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 234,
    "riotId": "Viego",
    "name": "佛耶戈",
    "title": "破败之王",
    "image": "Viego.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 121,
      "winRate": 47.53,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 117,
    "riotId": "Lulu",
    "name": "璐璐",
    "title": "仙灵女巫",
    "image": "Lulu.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 122,
      "winRate": 50.36,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 62,
    "riotId": "MonkeyKing",
    "name": "孙悟空",
    "title": "齐天大圣",
    "image": "MonkeyKing.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 123,
      "winRate": 46.02,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 1,
    "riotId": "Annie",
    "name": "安妮",
    "title": "黑暗之女",
    "image": "Annie.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 124,
      "winRate": 49.59,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 555,
    "riotId": "Pyke",
    "name": "派克",
    "title": "血港鬼影",
    "image": "Pyke.png",
    "tags": [
      "续航",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 125,
      "winRate": 45.66,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 79,
    "riotId": "Gragas",
    "name": "古拉加斯",
    "title": "酒桶",
    "image": "Gragas.png",
    "tags": [
      "战士",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 126,
      "winRate": 46.5,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 133,
    "riotId": "Quinn",
    "name": "奎因",
    "title": "德玛西亚之翼",
    "image": "Quinn.png",
    "tags": [
      "普攻",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 127,
      "winRate": 47.73,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 72,
    "riotId": "Skarner",
    "name": "斯卡纳",
    "title": "上古领主",
    "image": "Skarner.png",
    "tags": [
      "坦克",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 128,
      "winRate": 48.07,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 268,
    "riotId": "Azir",
    "name": "阿兹尔",
    "title": "沙漠皇帝",
    "image": "Azir.png",
    "tags": [
      "法强",
      "普攻"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 129,
      "winRate": 49.25,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 266,
    "riotId": "Aatrox",
    "name": "亚托克斯",
    "title": "暗裔剑魔",
    "image": "Aatrox.png",
    "tags": [
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 130,
      "winRate": 44.27,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 80,
    "riotId": "Pantheon",
    "name": "潘森",
    "title": "不屈之枪",
    "image": "Pantheon.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 131,
      "winRate": 45.32,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 427,
    "riotId": "Ivern",
    "name": "艾翁",
    "title": "翠神",
    "image": "Ivern.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 132,
      "winRate": 49.87,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 254,
    "riotId": "Vi",
    "name": "蔚",
    "title": "皮城执法官",
    "image": "Vi.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 133,
      "winRate": 46.6,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 91,
    "riotId": "Talon",
    "name": "泰隆",
    "title": "刀锋之影",
    "image": "Talon.png",
    "tags": [
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 134,
      "winRate": 46.08,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 34,
    "riotId": "Anivia",
    "name": "艾尼维亚",
    "title": "冰晶凤凰",
    "image": "Anivia.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 135,
      "winRate": 46.04,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 44,
    "riotId": "Taric",
    "name": "塔里克",
    "title": "瓦洛兰之盾",
    "image": "Taric.png",
    "tags": [
      "续航",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 136,
      "winRate": 49.37,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 56,
    "riotId": "Nocturne",
    "name": "魔腾",
    "title": "永恒梦魇",
    "image": "Nocturne.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 137,
      "winRate": 46.92,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 6,
    "riotId": "Urgot",
    "name": "厄加特",
    "title": "无畏战车",
    "image": "Urgot.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 138,
      "winRate": 45.41,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 121,
    "riotId": "Khazix",
    "name": "卡兹克",
    "title": "虚空掠夺者",
    "image": "Khazix.png",
    "tags": [
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 139,
      "winRate": 44.54,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 163,
    "riotId": "Taliyah",
    "name": "塔莉垭",
    "title": "岩雀",
    "image": "Taliyah.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 140,
      "winRate": 48.54,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 64,
    "riotId": "LeeSin",
    "name": "李青",
    "title": "盲僧",
    "image": "LeeSin.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 141,
      "winRate": 40.27,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 33,
    "riotId": "Rammus",
    "name": "拉莫斯",
    "title": "披甲龙龟",
    "image": "Rammus.png",
    "tags": [
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 142,
      "winRate": 45.71,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 107,
    "riotId": "Rengar",
    "name": "雷恩加尔",
    "title": "傲之追猎者",
    "image": "Rengar.png",
    "tags": [
      "爆发",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 143,
      "winRate": 45.07,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 127,
    "riotId": "Lissandra",
    "name": "丽桑卓",
    "title": "冰霜女巫",
    "image": "Lissandra.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 144,
      "winRate": 45.46,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 69,
    "riotId": "Cassiopeia",
    "name": "卡西奥佩娅",
    "title": "魔蛇之拥",
    "image": "Cassiopeia.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 145,
      "winRate": 46.94,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 201,
    "riotId": "Braum",
    "name": "布隆",
    "title": "弗雷尔卓德之心",
    "image": "Braum.png",
    "tags": [
      "坦克",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 146,
      "winRate": 47.03,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 92,
    "riotId": "Riven",
    "name": "锐雯",
    "title": "放逐之刃",
    "image": "Riven.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 147,
      "winRate": 45.93,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 518,
    "riotId": "Neeko",
    "name": "妮蔻",
    "title": "万花通灵",
    "image": "Neeko.png",
    "tags": [
      "法强",
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 148,
      "winRate": 45.29,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 131,
    "riotId": "Diana",
    "name": "黛安娜",
    "title": "皎月女神",
    "image": "Diana.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 149,
      "winRate": 44.07,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 895,
    "riotId": "Nilah",
    "name": "尼菈",
    "title": "不羁之悦",
    "image": "Nilah.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 150,
      "winRate": 47.12,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 19,
    "riotId": "Warwick",
    "name": "沃里克",
    "title": "祖安怒兽",
    "image": "Warwick.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 151,
      "winRate": 46.04,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 142,
    "riotId": "Zoe",
    "name": "佐伊",
    "title": "暮光星灵",
    "image": "Zoe.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 152,
      "winRate": 46.32,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 950,
    "riotId": "Naafiri",
    "name": "纳亚菲利",
    "title": "百裂冥犬",
    "image": "Naafiri.png",
    "tags": [
      "爆发",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 153,
      "winRate": 43.03,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 154,
    "riotId": "Zac",
    "name": "扎克",
    "title": "生化魔人",
    "image": "Zac.png",
    "tags": [
      "坦克",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 154,
      "winRate": 44.31,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 240,
    "riotId": "Kled",
    "name": "克烈",
    "title": "暴怒骑士",
    "image": "Kled.png",
    "tags": [
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 155,
      "winRate": 46.65,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 246,
    "riotId": "Qiyana",
    "name": "奇亚娜",
    "title": "元素女皇",
    "image": "Qiyana.png",
    "tags": [
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 156,
      "winRate": 44.04,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 20,
    "riotId": "Nunu",
    "name": "努努和威朗普",
    "title": "雪原双子",
    "image": "Nunu.png",
    "tags": [
      "坦克",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 157,
      "winRate": 44.5,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 85,
    "riotId": "Kennen",
    "name": "凯南",
    "title": "狂暴之心",
    "image": "Kennen.png",
    "tags": [
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 158,
      "winRate": 45.04,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 497,
    "riotId": "Rakan",
    "name": "洛",
    "title": "幻翎",
    "image": "Rakan.png",
    "tags": [
      "续航"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 159,
      "winRate": 45.26,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 7,
    "riotId": "Leblanc",
    "name": "乐芙兰",
    "title": "诡术妖姬",
    "image": "Leblanc.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 160,
      "winRate": 42.87,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 897,
    "riotId": "KSante",
    "name": "奎桑提",
    "title": "纳祖芒荣耀",
    "image": "KSante.png",
    "tags": [
      "坦克",
      "战士"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 161,
      "winRate": 41.2,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 60,
    "riotId": "Elise",
    "name": "伊莉丝",
    "title": "蜘蛛女皇",
    "image": "Elise.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 162,
      "winRate": 45.05,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 58,
    "riotId": "Renekton",
    "name": "雷克顿",
    "title": "荒漠屠夫",
    "image": "Renekton.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 163,
      "winRate": 42.94,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 421,
    "riotId": "RekSai",
    "name": "雷克塞",
    "title": "虚空遁地兽",
    "image": "RekSai.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 164,
      "winRate": 45.14,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 2,
    "riotId": "Olaf",
    "name": "奥拉夫",
    "title": "狂战士",
    "image": "Olaf.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 165,
      "winRate": 44.63,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 39,
    "riotId": "Irelia",
    "name": "艾瑞莉娅",
    "title": "刀锋舞者",
    "image": "Irelia.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 166,
      "winRate": 43.29,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 28,
    "riotId": "Evelynn",
    "name": "伊芙琳",
    "title": "痛苦之拥",
    "image": "Evelynn.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 167,
      "winRate": 45,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 84,
    "riotId": "Akali",
    "name": "阿卡丽",
    "title": "离群之刺",
    "image": "Akali.png",
    "tags": [
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 168,
      "winRate": 41.04,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 164,
    "riotId": "Camille",
    "name": "卡蜜尔",
    "title": "青钢影",
    "image": "Camille.png",
    "tags": [
      "战士",
      "爆发"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 169,
      "winRate": 43.13,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 83,
    "riotId": "Yorick",
    "name": "约里克",
    "title": "牧魂人",
    "image": "Yorick.png",
    "tags": [
      "战士",
      "坦克"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 170,
      "winRate": 43.02,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 432,
    "riotId": "Bard",
    "name": "巴德",
    "title": "星界游神",
    "image": "Bard.png",
    "tags": [
      "续航",
      "法强"
    ],
    "cn": null,
    "global": {
      "tier": "T5",
      "rank": 171,
      "winRate": 40.26,
      "pickRate": null,
      "trend": null
    },
    "augments": [],
    "items": []
  },
  {
    "key": 22,
    "riotId": "Ashe",
    "name": "艾希",
    "title": "寒冰射手",
    "image": "Ashe.png",
    "tags": [
      "普攻",
      "续航"
    ],
    "cn": null,
    "global": null,
    "augments": [],
    "items": []
  },
  {
    "key": 805,
    "riotId": "Locke",
    "name": "洛克",
    "title": "灰烬驱魔人",
    "image": "Locke.png",
    "tags": [
      "爆发",
      "法强"
    ],
    "cn": null,
    "global": null,
    "augments": [],
    "items": []
  }
] as ChampionCatalogEntry[];
export const champions: Champion[] = championCatalog.map((champion) => ({
  ...champion,
  cn: (cnStatsByKey as unknown as Record<number, HeroStats>)[champion.key] ?? null,
  augmentPool: [...((augmentPoolByKey as unknown as Record<number, readonly string[]>)[champion.key] ?? [])],
}));
export const championPortrait = (champion: Champion) => `${DDRAGON_CDN}/img/champion/${champion.image}`;
export const championSplash = (champion: Champion) => `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.riotId}_0.jpg`;

const augmentCatalog = [
  {
    "name": "暴击飞弹",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "暴击",
      "技能",
      "爆发"
    ],
    "summary": "技能暴击路线的核心启动器。",
    "rank": 1,
    "icon": null
  },
  {
    "name": "升级：无尽之刃",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "暴击",
      "爆发"
    ],
    "summary": "直接放大暴击体系的成型收益。",
    "rank": 2,
    "icon": null
  },
  {
    "name": "双刀流",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "普攻",
      "攻速",
      "特效"
    ],
    "summary": "追加攻击并强化攻击特效。",
    "rank": 3,
    "icon": "dualwield_large.png"
  },
  {
    "name": "双发快射",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "普攻",
      "攻速",
      "特效"
    ],
    "summary": "高频普攻英雄的质变强化。",
    "rank": 4,
    "icon": null
  },
  {
    "name": "连拨击锤",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "普攻",
      "攻速",
      "特效"
    ],
    "summary": "持续作战时快速叠出优势。",
    "rank": 5,
    "icon": "fanthehammer_large.png"
  },
  {
    "name": "亮出你的剑",
    "rarity": "棱彩",
    "tier": "S",
    "tags": [
      "近战",
      "暴击",
      "爆发"
    ],
    "summary": "用射程换取近身爆发上限。",
    "rank": 6,
    "icon": "drawyoursword_large.png"
  },
  {
    "name": "灵魂虹吸",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "暴击",
      "吸血",
      "续航"
    ],
    "summary": "暴击与续航同时成长。",
    "rank": 7,
    "icon": "soulsiphon_large.png"
  },
  {
    "name": "更万用的瞄准镜",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "射程",
      "普攻"
    ],
    "summary": "拉开输出位置，提高持续输出空间。",
    "rank": 8,
    "icon": null
  },
  {
    "name": "最万用的瞄准镜",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "射程",
      "普攻"
    ],
    "summary": "远程核心的顶级安全距离。",
    "rank": 9,
    "icon": "scopiestweapons_large.png"
  },
  {
    "name": "暴击律动",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "暴击",
      "攻速",
      "普攻"
    ],
    "summary": "暴击节奏与攻速联动。",
    "rank": 10,
    "icon": null
  },
  {
    "name": "踢踏舞",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "攻速",
      "移速",
      "普攻"
    ],
    "summary": "持续攻击累积攻速和机动。",
    "rank": 11,
    "icon": "tapdancer_large.png"
  },
  {
    "name": "珠光护手",
    "rarity": "棱彩",
    "tier": "S",
    "tags": [
      "技能",
      "暴击",
      "法强"
    ],
    "summary": "让高倍率技能获得暴击上限。",
    "rank": 12,
    "icon": "jeweledgauntlet_large.png"
  },
  {
    "name": "虚幻武器",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "技能",
      "攻击特效",
      "法强"
    ],
    "summary": "技能触发攻击特效，开启混合玩法。",
    "rank": 13,
    "icon": "etherealweapon_large.png"
  },
  {
    "name": "尤里卡",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "技能",
      "急速",
      "法强"
    ],
    "summary": "法强成长同时压缩技能窗口。",
    "rank": 14,
    "icon": "eureka_large.png"
  },
  {
    "name": "大法师",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "技能",
      "急速",
      "法强"
    ],
    "summary": "技能循环路线的核心强化。",
    "rank": 15,
    "icon": null
  },
  {
    "name": "战争交响乐",
    "rarity": "棱彩",
    "tier": "S",
    "tags": [
      "攻速",
      "普攻",
      "续航"
    ],
    "summary": "兼顾攻速与持续战斗能力。",
    "rank": 16,
    "icon": "symphonyofwar_large.png"
  },
  {
    "name": "巨人杀手",
    "rarity": "棱彩",
    "tier": "S",
    "tags": [
      "爆发",
      "坦克克制"
    ],
    "summary": "对高生命值阵容提高斩杀效率。",
    "rank": 17,
    "icon": "giantslayer_large.png"
  },
  {
    "name": "炼狱导管",
    "rarity": "黄金",
    "tier": "S",
    "tags": [
      "持续伤害",
      "技能",
      "急速"
    ],
    "summary": "持续伤害不断压缩技能冷却。",
    "rank": 18,
    "icon": "infernalconduit_large.png"
  },
  {
    "name": "全能龙魂",
    "rarity": "棱彩",
    "tier": "A",
    "tags": [
      "通用",
      "续航",
      "爆发"
    ],
    "summary": "获得多个随机龙魂，通用但波动较大。",
    "rank": 19,
    "icon": "omnisoul_large.png"
  },
  {
    "name": "扇巴掌",
    "rarity": "黄金",
    "tier": "A",
    "tags": [
      "近战",
      "控制",
      "坦克"
    ],
    "summary": "控制与近身缠斗时持续成长。",
    "rank": 21,
    "icon": "slaparound_large.png"
  },
  {
    "name": "灵巧",
    "rarity": "白银",
    "tier": "S+",
    "tags": [
      "攻速",
      "普攻"
    ],
    "summary": "简单直接的攻速增强。",
    "rank": 23,
    "icon": "deft_large.png"
  },
  {
    "name": "台风",
    "rarity": "白银",
    "tier": "S+",
    "tags": [
      "普攻",
      "特效"
    ],
    "summary": "普攻路线的稳定额外收益。",
    "rank": 24,
    "icon": "typhoon_large.png"
  },
  {
    "name": "坦克引擎",
    "rarity": "黄金",
    "tier": "S+",
    "tags": [
      "坦克",
      "续航",
      "近战"
    ],
    "summary": "持续承伤转化为前排成长。",
    "rank": 25,
    "icon": "tank_engine_large.png"
  },
  {
    "name": "歌利亚巨人",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "坦克",
      "续航",
      "近战"
    ],
    "summary": "大幅强化生命与体型收益。",
    "rank": 26,
    "icon": "goliath_large.png"
  },
  {
    "name": "重量级打击手",
    "rarity": "黄金",
    "tier": "S",
    "tags": [
      "坦克",
      "爆发",
      "近战"
    ],
    "summary": "生命值路线获得额外打击能力。",
    "rank": 27,
    "icon": "heavyhitter_large.png"
  },
  {
    "name": "飞身踢",
    "rarity": "黄金",
    "tier": "S",
    "tags": [
      "近战",
      "控制",
      "机动"
    ],
    "summary": "进场与控制型英雄的高价值启动器。",
    "rank": 28,
    "icon": null
  },
  {
    "name": "秘术冲拳",
    "rarity": "棱彩",
    "tier": "S+",
    "tags": [
      "近战",
      "普攻",
      "技能"
    ],
    "summary": "攻击与技能穿插时显著缩短循环。",
    "rank": 29,
    "icon": "mysticpunch_large.png"
  },
  {
    "name": "狂徒豪气",
    "rarity": "黄金",
    "tier": "S",
    "tags": [
      "近战",
      "续航",
      "爆发"
    ],
    "summary": "近身作战越久，战斗收益越高。",
    "rank": 30,
    "icon": "outlawsgrit_large.png"
  },
  {
    "name": "神射法师",
    "rarity": "黄金",
    "tier": "S",
    "tags": [
      "法强",
      "技能",
      "普攻"
    ],
    "summary": "法术与普攻混合输出的关键桥梁。",
    "rank": 31,
    "icon": "marksmage_large.png"
  },
  {
    "name": "术士果汁盒",
    "rarity": "白银",
    "tier": "A",
    "tags": [
      "法强",
      "续航",
      "技能"
    ],
    "summary": "提高法系英雄的持续作战容错。",
    "rank": 32,
    "icon": null
  },
  {
    "name": "旋转至胜",
    "rarity": "黄金",
    "tier": "S",
    "tags": [
      "技能",
      "近战",
      "持续伤害"
    ],
    "summary": "适合贴身多段与持续伤害玩法。",
    "rank": 33,
    "icon": "spintowin_large.png"
  }
] as LocalAugment[];
export const augments: Augment[] = augmentCatalog.map((augment) => {
  const source = (augmentSourceByName as unknown as Record<string, { icon: string; winRate: number; pickRate: number; games: number }>)[augment.name];
  return {
    ...augment,
    icon: source?.icon ?? (augment.icon ? `${CDRAGON_CDN}/${augment.icon}` : null),
    iconSource: "client-extracted",
    winRate: source?.winRate ?? 0,
    pickRate: source?.pickRate ?? 0,
    games: source?.games ?? 0,
  };
});
export const items = [
  {
    "id": "223031",
    "name": "无尽之刃",
    "tags": [
      "暴击",
      "爆发"
    ]
  },
  {
    "id": "223032",
    "name": "育恩塔尔荒野箭",
    "tags": [
      "暴击",
      "普攻"
    ]
  },
  {
    "id": "223085",
    "name": "卢安娜的飓风",
    "tags": [
      "攻速",
      "普攻",
      "特效"
    ]
  },
  {
    "id": "223153",
    "name": "破败王者之刃",
    "tags": [
      "攻速",
      "特效",
      "续航"
    ]
  },
  {
    "id": "223124",
    "name": "鬼索的狂暴之刃",
    "tags": [
      "攻速",
      "特效"
    ]
  },
  {
    "id": "226676",
    "name": "收集者",
    "tags": [
      "暴击",
      "爆发"
    ]
  },
  {
    "id": "226672",
    "name": "海妖杀手",
    "tags": [
      "攻速",
      "普攻",
      "特效"
    ]
  },
  {
    "id": "226675",
    "name": "纳沃利烁刃",
    "tags": [
      "暴击",
      "技能",
      "急速"
    ]
  },
  {
    "id": "223508",
    "name": "夺萃之镰",
    "tags": [
      "暴击",
      "技能",
      "急速"
    ]
  },
  {
    "id": "226673",
    "name": "不朽盾弓",
    "tags": [
      "暴击",
      "续航"
    ]
  },
  {
    "id": "6653",
    "name": "兰德里的折磨",
    "tags": [
      "法强",
      "持续伤害"
    ]
  },
  {
    "id": "223118",
    "name": "残疫",
    "tags": [
      "法强",
      "持续伤害",
      "技能"
    ]
  },
  {
    "id": "223089",
    "name": "灭世者的死亡之帽",
    "tags": [
      "法强",
      "爆发"
    ]
  },
  {
    "id": "223157",
    "name": "中娅沙漏",
    "tags": [
      "法强",
      "容错"
    ]
  },
  {
    "id": "223006",
    "name": "狂战士胫甲",
    "tags": [
      "攻速",
      "普攻"
    ]
  },
  {
    "id": "223020",
    "name": "法师之靴",
    "tags": [
      "法强",
      "爆发"
    ]
  },
  {
    "id": "223111",
    "name": "水银之靴",
    "tags": [
      "容错",
      "坦克"
    ]
  },
  {
    "id": "223143",
    "name": "兰顿之兆",
    "tags": [
      "坦克",
      "暴击克制"
    ]
  },
  {
    "id": "223084",
    "name": "心之钢",
    "tags": [
      "坦克",
      "续航",
      "近战"
    ]
  },
  {
    "id": "223065",
    "name": "振奋盔甲",
    "tags": [
      "坦克",
      "续航"
    ]
  },
  {
    "id": "223152",
    "name": "海克斯科技火箭腰带",
    "tags": [
      "法强",
      "爆发",
      "机动"
    ]
  },
  {
    "id": "224633",
    "name": "裂隙制造者",
    "tags": [
      "法强",
      "续航",
      "持续伤害"
    ]
  }
] as Item[];
export const itemIcon = (item: Item) => `${DDRAGON_CDN}/img/item/${item.id}.png`;
export const getStats = (champion: Champion, region: Region) => region === "cn" ? champion.cn : champion.global;
export const getHeroAugmentPool = (champion: Champion) => champion.augmentPool;
export const getHeroAugmentStat = (champion: Champion, augmentName: string): HeroAugmentStat | null =>
  (heroAugmentStatsByKey as unknown as Record<number, Record<string, HeroAugmentStat>>)[champion.key]?.[augmentName] ?? null;

export const getRecommendedAugments = (champion: Champion) => {
  const pool = getHeroAugmentPool(champion);
  const preferred = champion.augments.filter((name) => pool.includes(name));
  return [...preferred, ...pool.filter((name) => !preferred.includes(name))];
};
export const getRecommendedItems = (champion: Champion) => {
  if (champion.items.length) return champion.items;
  if (champion.tags.includes("坦克")) return ["心之钢", "振奋盔甲", "兰顿之兆"];
  if (champion.tags.includes("法强")) return ["兰德里的折磨", "灭世者的死亡之帽", "中娅沙漏"];
  return ["收集者", "无尽之刃", "不朽盾弓"];
};
export const patchInfo = { productVersion: "v0.2.1", riotPatch: DDRAGON_VERSION, displayPatch: hexdataSnapshot.patch, updatedAt: hexdataSnapshot.generatedAt, cnUpdatedAt: hexdataSnapshot.date, globalUpdatedAt: "2026-08-13", officialChampionCount: champions.length, globalStatCount: champions.filter((champion) => champion.global).length, cnStatCount: champions.filter((champion) => champion.cn).length, augmentCount: augments.length };
export const sources = [
  { label: "英雄与装备素材", name: "Riot Data Dragon", scope: `官方 ${DDRAGON_VERSION} 简体中文目录与版本化图片`, url: "https://developer.riotgames.com/docs/lol#data-dragon" },
  { label: "英雄强度（全球）", name: "ARAM Mayhem", scope: "26.16 全球样本；展示胜率与梯度", url: "https://arammayhem.com/zh-cn/tier-list/" },
  { label: "英雄强度与英雄强化池（国服）", name: "Hexdata", scope: `${hexdataSnapshot.patch} 艾欧尼亚活跃玩家冻结样本；${patchInfo.cnStatCount} 位英雄，含胜率、选取率、场次与英雄×强化明细`, url: "https://hexdata.com.cn/methodology" },
  { label: "强化目录与图标", name: "Hexdata / CommunityDragon", scope: `${hexdataSnapshot.patch} 客户端资源提取；当前目录 ${patchInfo.augmentCount} 个，错误或版本外条目不展示`, url: "https://hexdata.com.cn/augments" },
] as const;
