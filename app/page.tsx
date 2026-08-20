// Internal workspace sites can read the authenticated OpenAI user from the
// forwarded request headers:
//
// import { headers } from "next/headers";
//
// export default async function Home() {
//   const requestHeaders = await headers();
//   const email = requestHeaders.get("oai-authenticated-user-email");
//   const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
//   const fullName =
//     encodedFullName &&
//     requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
//       "percent-encoded-utf-8"
//       ? decodeURIComponent(encodedFullName)
//       : null;
//   const displayName = fullName ?? email;
//   // ...
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { augments, champions, items, patchInfo, type Augment, type Champion, type Strategy } from "./game-data";

type Tab = "本局" | "英雄榜" | "强化榜" | "收藏";

const navIcons: Record<Tab, string> = { 本局: "✦", 英雄榜: "♜", 强化榜: "⬡", 收藏: "◇" };
const rarityClass = (rarity: string) => rarity === "棱彩" ? "rarity-prismatic" : rarity === "黄金" ? "rarity-gold" : "rarity-silver";

function Avatar({ champion, small = false }: { champion: Champion; small?: boolean }) {
  return <span className={`avatar ${small ? "avatar-small" : ""}`} aria-hidden="true">{champion.name.slice(0, 1)}</span>;
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="metric"><span>{label}</span><strong className={accent ? "accent" : ""}>{value}</strong></div>;
}

function scoreAugment(champion: Champion, augment: Augment, selected: Augment[], strategy: Strategy) {
  const heroFit = augment.tags.filter((tag) => champion.tags.includes(tag)).length;
  const selectedTags = selected.flatMap((entry) => entry.tags);
  const synergy = augment.tags.filter((tag) => selectedTags.includes(tag)).length;
  const base = augment.tier === "S+" ? 10 : augment.tier === "S" ? 8 : augment.tier === "A" ? 6 : 4;
  let score = 52 + heroFit * 9 + synergy * 7 + base;
  if (champion.augments.includes(augment.name)) score += 13;
  if (strategy === "高上限") score += synergy * 4 + (augment.rarity === "棱彩" ? 4 : 0);
  if (strategy === "稳健") score += base * 0.5 + (augment.tags.includes("续航") || augment.tags.includes("射程") ? 4 : 0);
  if (strategy === "娱乐") score += augment.tags.includes("通用") || augment.tags.includes("近战") ? 6 : 1;
  return Math.min(99, Math.round(score));
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("本局");
  const [hero, setHero] = useState<Champion>(champions.find((entry) => entry.name === "薇恩")!);
  const [strategy, setStrategy] = useState<Strategy>("稳健");
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<string[]>([]);
  const [candidateNames, setCandidateNames] = useState<string[]>(["暴击飞弹", "双刀流", "坚韧不屈"]);
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState<"hero" | "augment" | "item" | "candidate" | null>(null);
  const [favorites, setFavorites] = useState<string[]>(["薇恩", "格雷福斯", "提莫"]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("h")) {
      const linkedHero = champions.find((entry) => entry.name === params.get("h"));
      if (linkedHero) setHero(linkedHero);
      const linkedAugments = (params.get("a") ?? "").split(",").filter((name) => augments.some((entry) => entry.name === name)).slice(0, 4);
      const linkedItems = (params.get("i") ?? "").split(",").filter((name) => items.some((entry) => entry.name === name)).slice(0, 6);
      const linkedStrategy = params.get("s") as Strategy | null;
      setSelectedNames(linkedAugments);
      setEquipped(linkedItems);
      if (linkedStrategy && ["稳健", "高上限", "娱乐"].includes(linkedStrategy)) setStrategy(linkedStrategy);
      return;
    }
    const saved = window.localStorage.getItem("haidou-state");
    if (!saved) return;
    try {
      const value = JSON.parse(saved);
      const savedHero = champions.find((entry) => entry.name === value.hero);
      if (savedHero) setHero(savedHero);
      if (Array.isArray(value.augments)) setSelectedNames(value.augments);
      if (Array.isArray(value.items)) setEquipped(value.items);
      if (Array.isArray(value.favorites)) setFavorites(value.favorites);
      if (["稳健", "高上限", "娱乐"].includes(value.strategy)) setStrategy(value.strategy);
    } catch { /* keep defaults */ }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("haidou-state", JSON.stringify({ hero: hero.name, augments: selectedNames, items: equipped, favorites, strategy }));
  }, [hero, selectedNames, equipped, favorites, strategy]);

  const selectedAugments = selectedNames.map((name) => augments.find((entry) => entry.name === name)).filter(Boolean) as Augment[];
  const recommendations = useMemo(() => augments
    .filter((entry) => !selectedNames.includes(entry.name))
    .map((entry) => ({ ...entry, score: scoreAugment(hero, entry, selectedAugments, strategy) }))
    .sort((a, b) => b.score - a.score), [hero, selectedNames, strategy]);
  const candidateScores = candidateNames.map((name) => recommendations.find((entry) => entry.name === name) ?? augments.find((entry) => entry.name === name)).filter(Boolean).map((entry) => ({ ...entry!, score: scoreAugment(hero, entry!, selectedAugments, strategy) })).sort((a, b) => b.score - a.score);
  const itemRecommendations = items.map((item) => {
    const activeTags = [...hero.tags, ...selectedAugments.flatMap((entry) => entry.tags)];
    const fit = item.tags.filter((tag) => activeTags.includes(tag)).length;
    return { ...item, score: 60 + fit * 10 + (hero.items.includes(item.name) ? 18 : 0) };
  }).sort((a, b) => b.score - a.score);

  const closePicker = () => { setPicker(null); setQuery(""); };
  const addSelected = (name: string) => {
    if (!selectedNames.includes(name) && selectedNames.length < 4) setSelectedNames([...selectedNames, name]);
    closePicker();
  };
  const addItem = (name: string) => {
    if (!equipped.includes(name) && equipped.length < 6) setEquipped([...equipped, name]);
    closePicker();
  };
  const resetGame = () => { setSelectedNames([]); setEquipped([]); setCandidateNames(["暴击飞弹", "双刀流", "坚韧不屈"]); };
  const toggleFavorite = () => setFavorites((current) => current.includes(hero.name) ? current.filter((name) => name !== hero.name) : [...current, hero.name]);
  const shareCurrent = async () => {
    const params = new URLSearchParams({ h: hero.name, s: strategy });
    if (selectedNames.length) params.set("a", selectedNames.join(","));
    if (equipped.length) params.set("i", equipped.join(","));
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("本局分享链接已复制");
    } catch {
      window.prompt("复制本局分享链接", url);
    }
    window.setTimeout(() => setToast(""), 1800);
  };

  const matchingHeroes = champions.filter((entry) => `${entry.name}${entry.title}`.includes(query));
  const filteredHeroes = query ? matchingHeroes : matchingHeroes.slice(0, 80);
  const filteredAugments = augments.filter((entry) => entry.name.includes(query));
  const filteredItems = items.filter((entry) => entry.name.includes(query));

  return (
    <main className="app-shell">
      <div className="energy-orb orb-one" /><div className="energy-orb orb-two" />
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><div><strong>海斗助手</strong><small>ARAM MAYHEM LAB</small></div></div>
        <div className="patch-pill"><i />国服 {patchInfo.patch}<span>已更新</span></div>
      </header>

      <div className="content-wrap">
        {tab === "本局" && <>
          <section className="hero-panel glass-card">
            <button className="hero-identity" onClick={() => setPicker("hero")} aria-label="更换英雄">
              <Avatar champion={hero} />
              <div><small>当前英雄 · 点击更换</small><h1>{hero.name}</h1><p>{hero.title}</p></div>
            </button>
            <div className="tier-badge">{hero.tier ?? "?"}<small>梯度</small></div>
            <div className="hero-actions"><button onClick={toggleFavorite} aria-label="收藏英雄">{favorites.includes(hero.name) ? "◆" : "◇"}</button><button onClick={shareCurrent} aria-label="分享本局">↗</button></div>
            <div className="metric-grid">
              <Metric label="国服胜率" value={hero.winRate ? `${hero.winRate.toFixed(2)}%` : "待同步"} accent />
              <Metric label="选取率" value={hero.pickRate ? `${hero.pickRate.toFixed(2)}%` : "待同步"} />
              <Metric label="全英雄" value={hero.rank ? `#${hero.rank}` : "—"} />
              <Metric label="版本趋势" value={hero.trend === null ? "—" : `${hero.trend >= 0 ? "+" : ""}${hero.trend.toFixed(2)}%`} />
            </div>
          </section>

          <section className="strategy-row" aria-label="推荐策略">
            {(["稳健", "高上限", "娱乐"] as Strategy[]).map((entry) => <button key={entry} className={strategy === entry ? "active" : ""} onClick={() => setStrategy(entry)}>{entry}</button>)}
          </section>

          <section className="section-block">
            <div className="section-title"><div><span>01</span><h2>已选强化</h2></div><small>{selectedNames.length}/4</small></div>
            <div className="slot-row">
              {[0, 1, 2, 3].map((index) => selectedAugments[index] ? <button key={index} className={`augment-chip ${rarityClass(selectedAugments[index].rarity)}`} onClick={() => setSelectedNames(selectedNames.filter((_, selectedIndex) => selectedIndex !== index))}><i>{selectedAugments[index].rarity.slice(0, 1)}</i><span>{selectedAugments[index].name}<small>{selectedAugments[index].rarity} · 点击移除</small></span></button> : <button key={index} className="empty-slot" onClick={() => setPicker("augment")}><b>＋</b><span>添加强化</span></button>)}
            </div>
          </section>

          <section className="section-block recommendation-block">
            <div className="section-title"><div><span>02</span><h2>下一张值得等</h2></div><small>综合推荐</small></div>
            <div className="recommend-stack">
              {recommendations.slice(0, 3).map((augment, index) => <button className={`recommend-card rank-${index + 1}`} key={augment.name} onClick={() => addSelected(augment.name)}>
                <span className="rank-number">{index + 1}</span><span className={`hex-icon ${rarityClass(augment.rarity)}`}>⬡</span>
                <span className="recommend-copy"><strong>{augment.name}</strong><small>{augment.summary}</small><em>{augment.tags.slice(0, 3).map((tag) => `#${tag}`).join("  ")}</em></span>
                <span className="score"><strong>{augment.score}</strong><small>匹配度</small></span>
              </button>)}
            </div>
            <p className="explain-note">✦ 推荐分综合英雄适配、已有强化联动、装备路线与策略偏好，不代表强化胜率。</p>
          </section>

          <section className="section-block">
            <div className="section-title"><div><span>03</span><h2>本轮三选一</h2></div><button className="text-action" onClick={() => { setCandidateNames([]); setPicker("candidate"); }}>重新选择</button></div>
            <div className="candidate-grid">
              {candidateScores.slice(0, 3).map((augment, index) => <button key={augment.name} className={`candidate-card ${index === 0 ? "winner" : ""}`} onClick={() => addSelected(augment.name)}><span className="pick-label">{index === 0 ? "首选" : `备选 ${index}`}</span><span className={`mini-hex ${rarityClass(augment.rarity)}`}>⬡</span><strong>{augment.name}</strong><small>{augment.score} 分</small></button>)}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title"><div><span>04</span><h2>联动出装</h2></div><button className="text-action" onClick={() => setPicker("item")}>编辑装备</button></div>
            <div className="build-card glass-card">
              <div className="build-path">{itemRecommendations.slice(0, 6).map((item, index) => <button key={item.name} title={item.name} className={equipped.includes(item.name) ? "equipped" : ""} onClick={() => addItem(item.name)}><i style={{ background: item.tone }}>{item.name.slice(0, 1)}</i>{index < 5 && <span>›</span>}</button>)}</div>
              <div className="build-copy"><strong>{selectedNames.length ? "强化已改变装备优先级" : "标准核心路线"}</strong><p>{itemRecommendations.slice(0, 3).map((item) => item.name).join(" → ")}。根据敌方阵容补重伤、穿透或生存装。</p></div>
              {equipped.length > 0 && <div className="equipped-row"><small>已出装备 · 点击移除</small><div>{equipped.map((name) => <button key={name} onClick={() => setEquipped(equipped.filter((entry) => entry !== name))}>{name} ×</button>)}</div></div>}
            </div>
          </section>

          <button className="reset-button" onClick={resetGame}>↻ 结束本局，重新开始</button>
          <footer className="legal-note"><p>英雄数据：<a href="https://aramgg.com/zh-CN" target="_blank" rel="noreferrer">ARAMGG 国服公开统计汇总</a>。强化仅展示机制梯度与匹配分，不展示强化胜率。</p><p>“海斗助手”非 Riot Games 或腾讯官方产品，亦未获得其认可。Riot Games 及相关标识归其所有者所有。</p></footer>
        </>}

        {tab === "英雄榜" && <Leaderboard onChoose={(champion) => { setHero(champion); setTab("本局"); }} />}
        {tab === "强化榜" && <AugmentBoard onChoose={(name) => { addSelected(name); setTab("本局"); }} />}
        {tab === "收藏" && <Favorites favorites={favorites} onChoose={(name) => { const found = champions.find((entry) => entry.name === name); if (found) { setHero(found); setTab("本局"); } }} />}
      </div>

      <nav className="bottom-nav">{(["本局", "英雄榜", "强化榜", "收藏"] as Tab[]).map((entry) => <button key={entry} onClick={() => setTab(entry)} className={tab === entry ? "active" : ""}><i>{navIcons[entry]}</i><span>{entry}</span></button>)}</nav>

      {picker && <div className="picker-backdrop" role="dialog" aria-modal="true" onClick={closePicker}><section className="picker-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" /><div className="picker-title"><h2>{picker === "hero" ? "选择英雄" : picker === "item" ? "添加装备" : picker === "candidate" ? `选择本轮候选 ${candidateNames.length}/3` : "添加已选强化"}</h2><button onClick={closePicker}>×</button></div>
        <label className="search-box">⌕<input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入名称搜索…" /></label>
        <div className="picker-list">
          {picker === "hero" && filteredHeroes.map((entry) => <button key={entry.id} onClick={() => { setHero(entry); closePicker(); }}><Avatar champion={entry} small /><span><strong>{entry.name}</strong><small>{entry.title}</small></span><em>{entry.tier ?? "待同步"}</em></button>)}
          {(picker === "augment" || picker === "candidate") && filteredAugments.map((entry) => <button key={entry.name} className={candidateNames.includes(entry.name) && picker === "candidate" ? "picker-selected" : ""} onClick={() => { if (picker === "candidate") { const next = candidateNames.includes(entry.name) ? candidateNames.filter((name) => name !== entry.name) : [...candidateNames, entry.name].slice(0, 3); setCandidateNames(next); if (next.length === 3) closePicker(); } else addSelected(entry.name); }}><span className={`mini-hex ${rarityClass(entry.rarity)}`}>⬡</span><span><strong>{entry.name}</strong><small>{entry.rarity} · {entry.tags.join(" / ")}</small></span><em>{entry.tier}</em></button>)}
          {picker === "item" && filteredItems.map((entry) => <button key={entry.name} onClick={() => addItem(entry.name)}><span className="item-dot" style={{ background: entry.tone }}>{entry.name.slice(0, 1)}</span><span><strong>{entry.name}</strong><small>{entry.tags.join(" / ")}</small></span></button>)}
        </div>
      </section></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function Leaderboard({ onChoose }: { onChoose: (champion: Champion) => void }) {
  const [filter, setFilter] = useState("");
  const ranked = champions.filter((entry) => entry.winRate !== null).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  return <section className="page-section"><div className="page-heading"><span>26.16 · 国服</span><h1>英雄强度榜</h1><p>真实统计优先；低样本不参与综合排名。</p></div><label className="search-box standalone">⌕<input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="搜索英雄或称号" /></label><div className="leader-list">{ranked.filter((entry) => `${entry.name}${entry.title}`.includes(filter)).map((entry) => <button key={entry.id} onClick={() => onChoose(entry)}><b>#{entry.rank}</b><Avatar champion={entry} small /><span><strong>{entry.name}</strong><small>{entry.title}</small></span><em className={`tier tier-${entry.tier}`}>{entry.tier}</em><span className="win"><strong>{entry.winRate?.toFixed(2)}%</strong><small>胜率 · {entry.pickRate?.toFixed(2)}%选取</small></span></button>)}</div><p className="data-footnote">当前已接入 {ranked.length} 位英雄的可靠统计，其余英雄目录正在同步，不会用模型补造数字。</p></section>;
}

function AugmentBoard({ onChoose }: { onChoose: (name: string) => void }) {
  const [rarity, setRarity] = useState<string>("全部");
  const filtered = rarity === "全部" ? augments : augments.filter((entry) => entry.rarity === rarity);
  return <section className="page-section"><div className="page-heading"><span>机制梯度 · 非胜率</span><h1>强化图鉴</h1><p>点击强化即可加入当前对局。</p></div><div className="filter-pills">{["全部", "白银", "黄金", "棱彩"].map((entry) => <button className={rarity === entry ? "active" : ""} onClick={() => setRarity(entry)} key={entry}>{entry}</button>)}</div><div className="augment-board">{filtered.map((entry) => <button key={entry.name} onClick={() => onChoose(entry.name)} className={rarityClass(entry.rarity)}><span className="big-hex">⬡</span><div><strong>{entry.name}</strong><small>{entry.rarity} · {entry.tags.join(" / ")}</small><p>{entry.summary}</p></div><em>{entry.tier}</em></button>)}</div></section>;
}

function Favorites({ favorites, onChoose }: { favorites: string[]; onChoose: (name: string) => void }) {
  return <section className="page-section"><div className="page-heading"><span>保存在当前设备</span><h1>最近与收藏</h1><p>无需登录，换设备不会同步。</p></div><div className="favorite-grid">{favorites.map((name) => { const champion = champions.find((entry) => entry.name === name)!; return <button key={name} onClick={() => onChoose(name)}><Avatar champion={champion} /><strong>{name}</strong><small>{champion.tier ?? "待同步"} · {champion.winRate ? `${champion.winRate}%` : "暂无统计"}</small></button>; })}</div><div className="source-card glass-card"><span>数据透明</span><h2>每个数字都有出处</h2><p>英雄统计来自腾讯国服公开统计的汇总页面；强化推荐结合英雄适配、机制标签与公开梯度。数据异常时保留上次可靠版本，不自动编造。</p><div><small>当前版本</small><strong>{patchInfo.patch}</strong><small>更新时间</small><strong>{patchInfo.updatedAt}</strong></div></div></section>;
}
