"use client";

import { useEffect, useMemo, useState } from "react";
import {
  augments,
  championPortrait,
  championSplash,
  champions,
  getHeroAugmentPool,
  getHeroItemPool,
  getRecommendedAugments,
  getRecommendedItems,
  getStats,
  itemIcon,
  items,
  patchInfo,
  sources,
  type Augment,
  type Champion,
  type Item,
  type ItemCategory,
  type Region,
  type Strategy,
} from "./game-data";
import RogueliteGame from "./roguelite-game";

type Tab = "玩一局" | "实战助手" | "图鉴" | "我的";
type Picker = "hero" | "augment" | "candidate" | "item" | null;

const tabs: Tab[] = ["玩一局", "实战助手", "图鉴", "我的"];
const defaultHero = champions.find((entry) => entry.name === "薇恩") ?? champions[0];
const navGlyph: Record<Tab, string> = { 玩一局: "✦", 实战助手: "⌁", 图鉴: "⬢", 我的: "♡" };
const strategyCopy: Record<Strategy, string> = {
  稳健: "优先容错与稳定成型",
  高上限: "接受风险，追求联动上限",
  娱乐: "偏好有趣的非常规组合",
};

function AssetImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(!src);
  if (failed || !src) return <span className={`asset-placeholder ${className}`} role="img" aria-label={`${alt}素材缺失`}>素材<br />缺失</span>;
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function AugmentIcon({ augment, size = "medium" }: { augment: Augment; size?: "small" | "medium" | "large" }) {
  return <span className={`augment-icon rarity-${augment.rarity} size-${size}`}><AssetImage src={augment.icon} alt={augment.name} /></span>;
}

function ChampionPortrait({ champion, size = "medium" }: { champion: Champion; size?: "small" | "medium" | "large" }) {
  return <AssetImage src={championPortrait(champion)} alt={champion.name} className={`champion-portrait portrait-${size}`} />;
}

function ItemImage({ item }: { item: Item }) {
  return <AssetImage src={itemIcon(item)} alt={item.name} className="item-image" />;
}

function RegionSwitch({ value, onChange }: { value: Region; onChange: (region: Region) => void }) {
  return <div className="region-switch" aria-label="统计地区">
    <button className={value === "cn" ? "active" : ""} onClick={() => onChange("cn")}>国服</button>
    <button className={value === "global" ? "active" : ""} onClick={() => onChange("global")}>全球</button>
  </div>;
}

function scoreAugment(champion: Champion, augment: Augment, selected: Augment[], strategy: Strategy) {
  const preferred = getRecommendedAugments(champion);
  const heroFit = augment.tags.filter((tag) => champion.tags.includes(tag)).length;
  const selectedTags = selected.flatMap((entry) => entry.tags);
  const synergy = augment.tags.filter((tag) => selectedTags.includes(tag)).length;
  const tierBase = augment.tier === "S+" ? 11 : augment.tier === "S" ? 8 : augment.tier === "A" ? 5 : 2;
  let score = 50 + heroFit * 8 + synergy * 7 + tierBase + (preferred.includes(augment.name) ? 13 : 0);
  if (strategy === "高上限") score += synergy * 4 + (augment.rarity === "棱彩" ? 4 : 0);
  if (strategy === "稳健") score += augment.tags.some((tag) => ["续航", "射程", "坦克"].includes(tag)) ? 5 : 1;
  if (strategy === "娱乐") score += augment.tags.some((tag) => ["通用", "近战", "机动"].includes(tag)) ? 6 : 1;
  return Math.min(99, Math.round(score));
}

const formatGames = (games: number) => games >= 10000 ? `${(games / 10000).toFixed(games >= 100000 ? 1 : 2)}万` : games.toLocaleString("zh-CN");
export default function Home() {
  const [tab, setTab] = useState<Tab>("玩一局");
  const [hero, setHero] = useState<Champion>(() => defaultHero);
  const [region, setRegion] = useState<Region>("cn");
  const [strategy, setStrategy] = useState<Strategy>("稳健");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [candidateNames, setCandidateNames] = useState<string[]>(["双发快射", "双刀流", "连拨击锤"]);
  const [equipped, setEquipped] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(["薇恩", "格雷福斯", "提莫"]);
  const [picker, setPicker] = useState<Picker>(null);
  const [query, setQuery] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let savedState: {
      hero?: string;
      region?: string;
      strategy?: string;
      augments?: unknown;
      items?: unknown;
      favorites?: unknown;
    } | null = null;
    try {
      const saved = window.localStorage.getItem("haidou-v02");
      savedState = saved ? JSON.parse(saved) as typeof savedState : null;
    } catch {
      window.localStorage.removeItem("haidou-v02");
    }
    const state = params.has("h") ? {
      hero: params.get("h"),
      region: params.get("r"),
      strategy: params.get("s"),
      augments: (params.get("a") ?? "").split(",").filter(Boolean),
      items: (params.get("i") ?? "").split(",").filter(Boolean),
    } : savedState;
    if (!state) return;
    const linkedHero = champions.find((entry) => entry.name === state.hero);
    const targetHero = linkedHero ?? defaultHero;
    window.queueMicrotask(() => {
      if (params.has("h")) setTab("实战助手");
      if (linkedHero) setHero(linkedHero);
      if (state.region === "cn" || state.region === "global") setRegion(state.region);
      if (["稳健", "高上限", "娱乐"].includes(state.strategy)) setStrategy(state.strategy);
      if (Array.isArray(state.augments)) setSelectedNames(state.augments.filter((name: string) => targetHero.augmentPool.includes(name)).slice(0, 4));
      setCandidateNames(getRecommendedAugments(targetHero).slice(0, 3));
      if (Array.isArray(state.items)) setEquipped(state.items.filter((name: string) => items.some((entry) => entry.name === name)).slice(0, 6));
      if (Array.isArray(state.favorites)) setFavorites(state.favorites.filter((name): name is string => typeof name === "string"));
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("haidou-v02", JSON.stringify({ hero: hero.name, region, strategy, augments: selectedNames, items: equipped, favorites }));
    } catch {
      // Private browsing and embedded browsers may disable persistent storage.
    }
  }, [hero, region, strategy, selectedNames, equipped, favorites]);

  const stats = getStats(hero, region);
  const selectedAugments = selectedNames.map((name) => augments.find((entry) => entry.name === name)).filter(Boolean) as Augment[];
  const heroPool = getHeroAugmentPool(hero);
  const scored = useMemo(() => augments
    .filter((entry) => heroPool.includes(entry.name) && !selectedNames.includes(entry.name))
    .map((entry) => ({ ...entry, score: scoreAugment(hero, entry, selectedAugments, strategy) }))
    .sort((a, b) => b.score - a.score || a.rank - b.rank), [hero, heroPool, selectedNames, selectedAugments, strategy]);
  const candidates = candidateNames
    .map((name) => augments.find((entry) => entry.name === name))
    .filter((entry): entry is Augment => Boolean(entry && heroPool.includes(entry.name)))
    .map((entry) => ({ ...entry!, score: scoreAugment(hero, entry!, selectedAugments, strategy) }))
    .sort((a, b) => b.score - a.score);
  const activeTags = [...hero.tags, ...selectedAugments.flatMap((entry) => entry.tags)];
  const preferredItems = getRecommendedItems(hero);
  const heroItemPool = getHeroItemPool(hero);
  const itemScores = heroItemPool.map((item) => ({
    ...item,
    score: 55 + item.tags.filter((tag) => activeTags.includes(tag)).length * 10 + (preferredItems.includes(item.name) ? 20 : 0),
  })).sort((a, b) => b.score - a.score);

  const closePicker = () => { setPicker(null); setQuery(""); };
  const chooseHero = (champion: Champion) => {
    setHero(champion);
    setSelectedNames([]);
    setCandidateNames(getRecommendedAugments(champion).slice(0, 3));
    closePicker();
  };
  const addAugment = (name: string) => {
    if (heroPool.includes(name) && !selectedNames.includes(name) && selectedNames.length < 4) setSelectedNames([...selectedNames, name]);
    closePicker();
  };
  const addItem = (name: string) => {
    if (!equipped.includes(name) && equipped.length < 6) setEquipped([...equipped, name]);
    closePicker();
  };
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const shareCurrent = async () => {
    const params = new URLSearchParams({ h: hero.name, r: region, s: strategy });
    if (selectedNames.length) params.set("a", selectedNames.join(","));
    if (equipped.length) params.set("i", equipped.join(","));
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const shareData = { title: `海斗助手 · ${hero.name}`, text: `${hero.name} 海克斯大乱斗搭配`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast("已打开系统分享");
      } else {
        await navigator.clipboard.writeText(url);
        showToast("对局链接已复制");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        try { await navigator.clipboard.writeText(url); showToast("对局链接已复制"); }
        catch { window.prompt("复制对局链接", url); }
      }
    }
  };

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setTab("玩一局")} aria-label="返回玩一局">
        <span className="brand-mark">海</span>
        <span><strong>海斗实验室</strong><small>白天玩一局 · 晚上做助手</small></span>
      </button>
      <button className="patch-button" onClick={() => setSourceOpen(true)}>
        <span className="live-dot" />{patchInfo.displayPatch}<small>数据说明</small>
      </button>
    </header>

    <div className="content-wrap">
      {tab === "玩一局" && <RogueliteGame onToast={showToast} />}
      {tab === "实战助手" && <GameTab
        hero={hero}
        region={region}
        setRegion={setRegion}
        stats={stats}
        strategy={strategy}
        setStrategy={setStrategy}
        selectedAugments={selectedAugments}
        selectedNames={selectedNames}
        setSelectedNames={setSelectedNames}
        candidates={candidates}
        setCandidateNames={setCandidateNames}
        scored={scored}
        itemScores={itemScores}
        equipped={equipped}
        setEquipped={setEquipped}
        favorites={favorites}
        setFavorites={setFavorites}
        onPick={setPicker}
        onAddAugment={addAugment}
        onAddItem={addItem}
        onShare={shareCurrent}
        onSource={() => setSourceOpen(true)}
      />}
      {tab === "图鉴" && <CodexBoard region={region} setRegion={setRegion} onHero={(champion) => { chooseHero(champion); setTab("实战助手"); }} onAugment={(name) => { addAugment(name); setTab("实战助手"); }} onSource={() => setSourceOpen(true)} />}
      {tab === "我的" && <Favorites names={favorites} onChoose={(champion) => { chooseHero(champion); setTab("实战助手"); }} onSource={() => setSourceOpen(true)} />}
    </div>

    <nav className="bottom-nav" aria-label="主导航">
      {tabs.map((entry) => <button key={entry} className={tab === entry ? "active" : ""} onClick={() => setTab(entry)}><i>{navGlyph[entry]}</i><span>{entry}</span></button>)}
    </nav>

    {picker && <PickerSheet
      type={picker}
      hero={hero}
      query={query}
      setQuery={setQuery}
      candidates={candidateNames}
      setCandidates={setCandidateNames}
      onClose={closePicker}
      onHero={chooseHero}
      onAugment={addAugment}
      onItem={addItem}
    />}
    {sourceOpen && <SourceSheet onClose={() => setSourceOpen(false)} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

type ScoredAugment = Augment & { score: number };
type ScoredItem = Item & { score: number };

function GameTab(props: {
  hero: Champion;
  region: Region;
  setRegion: (value: Region) => void;
  stats: ReturnType<typeof getStats>;
  strategy: Strategy;
  setStrategy: (value: Strategy) => void;
  selectedAugments: Augment[];
  selectedNames: string[];
  setSelectedNames: (value: string[]) => void;
  candidates: ScoredAugment[];
  setCandidateNames: (value: string[]) => void;
  scored: ScoredAugment[];
  itemScores: ScoredItem[];
  equipped: string[];
  setEquipped: (value: string[]) => void;
  favorites: string[];
  setFavorites: (value: string[]) => void;
  onPick: (value: Picker) => void;
  onAddAugment: (name: string) => void;
  onAddItem: (name: string) => void;
  onShare: () => void;
  onSource: () => void;
}) {
  const { hero, region, setRegion, stats, strategy, setStrategy, selectedAugments, selectedNames, setSelectedNames, candidates, setCandidateNames, scored, itemScores, equipped, setEquipped, favorites, setFavorites, onPick, onAddAugment, onAddItem, onShare, onSource } = props;
  const favorite = favorites.includes(hero.name);
  return <>
    <section className="hero-card">
      <AssetImage src={championSplash(hero)} alt={`${hero.name}原画`} className="hero-splash" />
      <div className="hero-shade" />
      <div className="hero-card-top">
        <button className="hero-identity" onClick={() => onPick("hero")}>
          <ChampionPortrait champion={hero} size="large" />
          <span><small>当前英雄 · 点击更换</small><strong>{hero.name}</strong><em>{hero.title}</em></span>
        </button>
        <div className="hero-actions">
          <button onClick={() => setFavorites(favorite ? favorites.filter((name) => name !== hero.name) : [...favorites, hero.name])} aria-label={favorite ? "取消收藏" : "收藏"}>{favorite ? "♥" : "♡"}</button>
          <button onClick={onShare} aria-label="分享本局">↗</button>
        </div>
      </div>
      <div className="stats-head"><RegionSwitch value={region} onChange={setRegion} /><button className="source-link" onClick={onSource}>{region === "cn" ? "Hexdata" : "ARAM Mayhem"} · 查看来源</button></div>
      {stats ? <div className="metric-grid">
        <div><span>强度</span><strong className="tier-value">{stats.tier}</strong></div>
        <div><span>胜率</span><strong>{stats.winRate.toFixed(2)}%</strong></div>
        <div><span>选取率</span><strong>{stats.pickRate === null ? "未公开" : `${stats.pickRate.toFixed(2)}%`}</strong></div>
        <div><span>排名</span><strong>{stats.rank ? `#${stats.rank}` : "未公开"}</strong></div>
      </div> : <div className="no-data"><strong>该地区暂无可靠统计</strong><span>英雄素材与机制推荐仍可使用。</span>{region === "cn" && hero.global && <button onClick={() => setRegion("global")}>查看全球样本</button>}</div>}
      {stats?.games && <p className="sample-line">国服冻结样本 {formatGames(stats.games)} 场 · 数据日期 {patchInfo.cnUpdatedAt}</p>}
    </section>

    <div className="strategy-card">
      <div><strong>推荐偏好</strong><span>{strategyCopy[strategy]}</span></div>
      <div className="strategy-row">{(["稳健", "高上限", "娱乐"] as Strategy[]).map((entry) => <button key={entry} className={strategy === entry ? "active" : ""} onClick={() => setStrategy(entry)}>{entry}</button>)}</div>
    </div>

    <SectionHeading index="01" title="已选强化" meta={`${selectedNames.length}/4`} />
    <div className="selected-grid">
      {[0, 1, 2, 3].map((index) => selectedAugments[index] ? <button key={index} className="selected-augment" onClick={() => setSelectedNames(selectedNames.filter((_, i) => i !== index))}>
        <AugmentIcon augment={selectedAugments[index]} size="small" />
        <span><strong>{selectedAugments[index].name}</strong><small>{selectedAugments[index].rarity} · 点击移除</small></span>
      </button> : <button key={index} className="empty-slot" onClick={() => onPick("augment")}><b>＋</b><span>添加强化</span></button>)}
    </div>

    <SectionHeading index="02" title="本轮三选一" meta={`英雄池 ${hero.augmentPool.length} 个`} action={<button className="text-action" onClick={() => { setCandidateNames([]); onPick("candidate"); }}>录入候选</button>} />
    {candidates.length === 3 ? <div className="candidate-list">
      {candidates.map((augment, index) => <button key={augment.name} className={`candidate-row ${index === 0 ? "best" : ""}`} onClick={() => onAddAugment(augment.name)}>
        <span className="candidate-rank">{index === 0 ? "首选" : `#${index + 1}`}</span>
        <AugmentIcon augment={augment} size="small" />
        <span className="candidate-copy"><strong>{augment.name}</strong><small>{augment.tags.slice(0, 3).join(" · ")}</small></span>
        <span className="match-score"><strong>{augment.score}</strong><small>匹配分</small></span>
      </button>)}
    </div> : <button className="candidate-empty" onClick={() => onPick("candidate")}><span>＋</span><strong>录入本轮三个强化</strong><small>帮你快速比较最值得选哪一个</small></button>}

    <SectionHeading index="03" title="下一张值得等" meta="综合推荐" />
    <div className="recommend-list">
      {scored.slice(0, 4).map((augment, index) => <button key={augment.name} className={`recommend-row rank-${index + 1}`} onClick={() => onAddAugment(augment.name)}>
        <span className="number">{index + 1}</span>
        <AugmentIcon augment={augment} />
        <span className="recommend-copy"><strong>{augment.name}<em>{augment.rarity}</em></strong><small>{augment.summary}</small><i>{augment.tags.slice(0, 3).map((tag) => `#${tag}`).join("  ")}</i></span>
        <span className="match-score"><strong>{augment.score}</strong><small>匹配分</small></span>
      </button>)}
    </div>
    <p className="model-note">只在该英雄当前版本已观察到的固定池内推荐。0–100 匹配分综合英雄机制、已有强化、公开梯度与玩法偏好，不是胜率或系统发牌概率。</p>

    <SectionHeading index="04" title="联动出装" meta={`专属池 ${itemScores.length} 件`} action={<button className="text-action" onClick={() => onPick("item")}>全量装备库</button>} />
    <section className="build-card">
      {itemScores.length ? <>
        <div className="build-icons">{itemScores.slice(0, 6).map((item, index) => <button key={item.name} className={equipped.includes(item.name) ? "equipped" : ""} onClick={() => onAddItem(item.name)}><ItemImage item={item} /><small>{index + 1}</small></button>)}</div>
        <strong>{selectedNames.length ? "已在英雄专属池内按强化联动排序" : "当前英雄的推荐核心路线"}</strong>
        <p>{itemScores.slice(0, 3).map((item) => item.name).join(" → ")}。推荐只从该英雄当前版本的专属候选池产生，最后三件再按敌方阵容补生存、穿透或重伤。</p>
      </> : <div className="item-pool-empty"><strong>当前版本暂无可靠英雄装备样本</strong><p>仍可打开全量装备库手动记录，但不会生成通用路线冒充专属推荐。</p></div>}
      {equipped.length > 0 && <div className="owned-items"><span>已出装备</span>{equipped.map((name) => <button key={name} onClick={() => setEquipped(equipped.filter((entry) => entry !== name))}>{name} ×</button>)}</div>}
    </section>

    <button className="reset-button" onClick={() => { setSelectedNames([]); setEquipped([]); setCandidateNames([]); }}>结束本局，重新开始</button>
    <footer className="legal-note">海斗助手不是 Riot Games 或腾讯官方产品，亦未获得其认可。英雄联盟及相关素材归其权利人所有。<button onClick={onSource}>数据与素材说明</button></footer>
  </>;
}

function SectionHeading({ index, title, meta, action }: { index: string; title: string; meta?: string; action?: React.ReactNode }) {
  return <div className="section-heading"><span>{index}</span><h2>{title}</h2>{meta && <small>{meta}</small>}{action}</div>;
}

function Leaderboard({ region, setRegion, onChoose, onSource }: { region: Region; setRegion: (value: Region) => void; onChoose: (champion: Champion) => void; onSource: () => void }) {
  const [query, setQuery] = useState("");
  const list = champions.filter((champion) => getStats(champion, region)).sort((a, b) => (getStats(a, region)?.rank ?? 999) - (getStats(b, region)?.rank ?? 999));
  const filtered = list.filter((entry) => `${entry.name}${entry.title}`.includes(query));
  return <section className="page-section">
    <div className="page-heading"><span>{patchInfo.displayPatch} · 当前版本</span><h1>英雄强度榜</h1><p>国服优先，全球样本单独展示。</p></div>
    <div className="board-tools"><RegionSwitch value={region} onChange={setRegion} /><button className="source-link" onClick={onSource}>来源与样本</button></div>
    <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索英雄或称号" /></label>
    <div className="leader-list">{filtered.map((champion) => { const stats = getStats(champion, region)!; return <button key={champion.key} onClick={() => onChoose(champion)}>
      <b>{stats.rank ? `#${stats.rank}` : "—"}</b><ChampionPortrait champion={champion} size="small" />
      <span className="leader-name"><strong>{champion.name}</strong><small>{champion.title}</small></span>
      <em className={`tier tier-${stats.tier}`}>{stats.tier}</em>
      <span className="leader-stat"><strong>{stats.winRate.toFixed(2)}%</strong><small>{stats.pickRate === null ? "选取率未公开" : `选取 ${stats.pickRate.toFixed(2)}%`}</small></span>
    </button>; })}</div>
    <p className="data-footnote">{region === "cn" ? `已接入 ARAMGG 的 ${patchInfo.cnStatCount} 位英雄腾讯国服公开统计；显示排名、胜率与选取率，数据日期 ${patchInfo.cnUpdatedAt}。` : `已接入 ${patchInfo.globalStatCount} 位英雄的全球样本，更新时间 ${patchInfo.globalUpdatedAt}。`}</p>
  </section>;
}

function CodexBoard({ region, setRegion, onHero, onAugment, onSource }: { region: Region; setRegion: (value: Region) => void; onHero: (champion: Champion) => void; onAugment: (name: string) => void; onSource: () => void }) {
  const [view, setView] = useState<"英雄" | "强化">("英雄");
  return <>
    <div className="codex-switch" aria-label="图鉴分类">
      <button className={view === "英雄" ? "active" : ""} onClick={() => setView("英雄")}>英雄榜</button>
      <button className={view === "强化" ? "active" : ""} onClick={() => setView("强化")}>强化图鉴</button>
    </div>
    {view === "英雄" ? <Leaderboard region={region} setRegion={setRegion} onChoose={onHero} onSource={onSource} /> : <AugmentBoard onChoose={onAugment} onSource={onSource} />}
  </>;
}

function AugmentBoard({ onChoose, onSource }: { onChoose: (name: string) => void; onSource: () => void }) {
  const [rarity, setRarity] = useState("全部");
  const [query, setQuery] = useState("");
  const list = augments.filter((entry) => (rarity === "全部" || entry.rarity === rarity) && entry.name.includes(query));
  return <section className="page-section">
    <div className="page-heading"><span>当前版本 · {patchInfo.augmentCount} 个已接入</span><h1>强化图鉴</h1><p>使用 16.16 客户端提取图标；版本外或无法核验的条目不展示。</p></div>
    <button className="inline-source" onClick={onSource}>查看强化来源与口径</button>
    <div className="filter-row">{["全部", "白银", "黄金", "棱彩"].map((entry) => <button key={entry} className={rarity === entry ? "active" : ""} onClick={() => setRarity(entry)}>{entry}</button>)}</div>
    <label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索强化名称" /></label>
    <div className="augment-board">{list.map((augment) => <button key={augment.name} onClick={() => onChoose(augment.name)}>
      <AugmentIcon augment={augment} size="large" />
      <span><strong>{augment.name}</strong><small>{augment.rarity} · 当前机制梯度</small><p>{augment.summary}</p></span>
      <em>{augment.tier}</em>
    </button>)}</div>
  </section>;
}

function Favorites({ names, onChoose, onSource }: { names: string[]; onChoose: (champion: Champion) => void; onSource: () => void }) {
  const favorites = names.map((name) => champions.find((entry) => entry.name === name)).filter(Boolean) as Champion[];
  return <section className="page-section">
    <div className="page-heading"><span>保存在当前设备</span><h1>我的收藏</h1><p>无需登录，换设备不会自动同步。</p></div>
    {favorites.length ? <div className="favorite-grid">{favorites.map((champion) => <button key={champion.key} onClick={() => onChoose(champion)}><ChampionPortrait champion={champion} size="large" /><strong>{champion.name}</strong><small>{champion.cn?.tier ?? champion.global?.tier ?? "暂无统计"} · {champion.title}</small></button>)}</div> : <div className="empty-state">还没有收藏英雄</div>}
    <section className="transparency-card"><span>数据透明</span><h2>缺数据时，宁可留空</h2><p>排名与胜率只来自公开统计页面；更新失败时保留上一份可靠快照，不用模型补造。</p><button onClick={onSource}>查看完整数据说明</button></section>
  </section>;
}

function PickerSheet({ type, hero, query, setQuery, candidates, setCandidates, onClose, onHero, onAugment, onItem }: {
  type: Exclude<Picker, null>; hero: Champion; query: string; setQuery: (value: string) => void; candidates: string[]; setCandidates: (value: string[]) => void;
  onClose: () => void; onHero: (champion: Champion) => void; onAugment: (name: string) => void; onItem: (name: string) => void;
}) {
  const [itemCategory, setItemCategory] = useState<ItemCategory>("全部");
  const heroList = champions.filter((entry) => `${entry.name}${entry.title}`.includes(query));
  const pool = getHeroAugmentPool(hero);
  const augmentList = augments.filter((entry) => pool.includes(entry.name) && entry.name.includes(query));
  const heroItems = getHeroItemPool(hero);
  const heroItemIds = new Set(heroItems.map((entry) => entry.id));
  const itemList = items
    .filter((entry) => entry.name.includes(query) && (itemCategory === "全部" || entry.categories.includes(itemCategory)))
    .sort((a, b) => Number(heroItemIds.has(b.id)) - Number(heroItemIds.has(a.id)));
  const itemCategories: ItemCategory[] = ["全部", "攻击", "法术", "坦克", "辅助", "鞋子", "模式专属"];
  const candidateMode = type === "candidate";
  const toggleCandidate = (name: string) => setCandidates(candidates.includes(name) ? candidates.filter((entry) => entry !== name) : [...candidates, name].slice(0, 3));
  return <div className="sheet-backdrop" onClick={onClose}><section className="bottom-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" />
    <div className="sheet-title"><div><small>{candidateMode ? `${candidates.length}/3 已选择 · ${hero.name}池内 ${pool.length} 个` : type === "item" ? `当前模式全量 ${items.length} 件 · ${hero.name}专属池 ${heroItems.length} 件` : "海斗助手"}</small><h2>{type === "hero" ? "选择英雄" : type === "item" ? "选择装备" : candidateMode ? "录入本轮候选" : "添加已选强化"}</h2></div><button onClick={onClose} aria-label="关闭">×</button></div>
    <label className="search-box sheet-search"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入名称搜索" /></label>
    {type === "item" && <div className="item-filter-row">{itemCategories.map((category) => <button key={category} className={itemCategory === category ? "active" : ""} onClick={() => setItemCategory(category)}>{category}</button>)}</div>}
    {type === "hero" && <div className="hero-picker-grid">{heroList.map((champion) => <button key={champion.key} onClick={() => onHero(champion)}><ChampionPortrait champion={champion} size="large" /><strong>{champion.name}</strong><small>{champion.global?.tier ?? "—"}</small></button>)}</div>}
    {(type === "augment" || candidateMode) && <div className="sheet-list">{augmentList.map((augment) => <button key={augment.name} className={candidates.includes(augment.name) && candidateMode ? "selected" : ""} onClick={() => candidateMode ? toggleCandidate(augment.name) : onAugment(augment.name)}><AugmentIcon augment={augment} size="small" /><span><strong>{augment.name}</strong><small>{augment.rarity} · {augment.tags.join(" / ")}</small></span><em>{candidates.includes(augment.name) && candidateMode ? "✓" : augment.tier}</em></button>)}</div>}
    {type === "item" && <div className="sheet-list">{itemList.map((item) => <button key={item.id} className={heroItemIds.has(item.id) ? "hero-item" : ""} onClick={() => onItem(item.name)}><ItemImage item={item} /><span><strong>{item.name}</strong><small>{item.tags.join(" / ")} · {item.cost.toLocaleString("zh-CN")} 金币</small></span>{heroItemIds.has(item.id) && <em>英雄候选</em>}</button>)}</div>}
    {candidateMode && <button className="sheet-primary" disabled={candidates.length !== 3} onClick={onClose}>完成并比较</button>}
  </section></div>;
}

function SourceSheet({ onClose }: { onClose: () => void }) {
  return <div className="sheet-backdrop" onClick={onClose}><section className="bottom-sheet source-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
    <div className="sheet-handle" /><div className="sheet-title"><div><small>{patchInfo.productVersion}</small><h2>数据与素材说明</h2></div><button onClick={onClose} aria-label="关闭">×</button></div>
    <div className="source-summary"><div><span>游戏补丁</span><strong>{patchInfo.riotPatch}</strong></div><div><span>最后成功更新</span><strong>{patchInfo.updatedAt}</strong></div><div><span>英雄目录</span><strong>{patchInfo.officialChampionCount} 位</strong></div><div><span>统计覆盖</span><strong>国服 {patchInfo.cnStatCount} / 全球 {patchInfo.globalStatCount}</strong></div><div><span>当前模式成装</span><strong>{patchInfo.itemCount} 件</strong></div><div><span>英雄装备池</span><strong>{patchInfo.itemPoolCount} 位</strong></div></div>
    <div className="source-list">{sources.map((source) => <a key={source.label} href={source.url} target="_blank" rel="noreferrer"><span>{source.label}</span><strong>{source.name}</strong><p>{source.scope}</p><em>访问来源 ↗</em></a>)}</div>
    <p className="source-policy">国服英雄排名、胜率和选取率来自 ARAMGG 汇总的腾讯国服公开统计。强化与装备推荐均执行英雄专属候选池硬过滤；全量装备库只收录当前模式可用成装。遵守 Riot 政策，不展示强化或装备胜率，匹配分也不等于系统发牌概率。图标优先使用当前版本客户端提取素材，无法核验的条目直接移除。</p>
  </section></div>;
}
