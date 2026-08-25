"use client";

import { useEffect, useMemo, useState } from "react";
import { gameCards, gameEnemies, gameHeroes, type GameCard, type GameHero } from "./roguelite-data";

type Phase = "hero" | "choice" | "battle" | "result";
type BattleLog = { won: boolean; playerPower: number; enemyPower: number; damage: number; heal: number; line: string };
type GameRecord = { runs: number; clears: number; bestScore: number; seen: string[] };

const emptyRecord: GameRecord = { runs: 0, clears: 0, bestScore: 0, seen: [] };

function hash(text: string) {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function dailyKey() {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function seededSort<T extends { id: string }>(list: T[], seed: string) {
  return [...list].sort((a, b) => hash(`${seed}-${a.id}`) - hash(`${seed}-${b.id}`));
}

function tagCounts(hero: GameHero, cards: GameCard[]) {
  const counts = new Map<string, number>();
  [...hero.tags, ...cards.flatMap((card) => card.tags)].forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function calculatePower(hero: GameHero, cards: GameCard[], hp: number, wins: number) {
  const attack = hero.attack + cards.reduce((sum, card) => sum + (card.attack ?? 0), 0) + (hero.id === "storm" ? wins * 2 : 0);
  const guard = hero.guard + cards.reduce((sum, card) => sum + (card.guard ?? 0), 0);
  const crit = cards.reduce((sum, card) => sum + (card.crit ?? 0), 0);
  const counts = tagCounts(hero, cards);
  const synergy = counts.reduce((sum, [, count]) => sum + (count >= 2 ? (count - 1) * 8 : 0), 0);
  const multiplier = cards.reduce((value, card) => value * (card.multiplier ?? 1), 1);
  const heroBonus = hero.id === "star-ranger" ? counts.filter(([tag, count]) => count >= 2 && ["连击", "暴击"].includes(tag)).length * 8
    : hero.id === "aegis" ? (counts.find(([tag]) => tag === "护盾")?.[1] ?? 0) * 5
      : hero.id === "shade" && hp < hero.hp * .45 ? 24
        : hero.id === "caller" ? counts.filter(([, count]) => count >= 3).length * 10 : 0;
  return Math.round((attack * 1.35 + guard * .72 + crit * .45 + synergy + heroBonus) * multiplier);
}

function CardGlyph({ card }: { card: GameCard }) {
  return <span className={`sim-card-glyph sim-${card.rarity}`}>{card.glyph}</span>;
}

export default function RogueliteGame({ onToast }: { onToast: (message: string) => void }) {
  const [phase, setPhase] = useState<Phase>("hero");
  const [hero, setHero] = useState<GameHero | null>(null);
  const [round, setRound] = useState(0);
  const [hp, setHp] = useState(0);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [offers, setOffers] = useState<GameCard[]>([]);
  const [rerolls, setRerolls] = useState(2);
  const [rerollNonce, setRerollNonce] = useState(0);
  const [wins, setWins] = useState(0);
  const [battle, setBattle] = useState<BattleLog | null>(null);
  const [cleared, setCleared] = useState(false);
  const [record, setRecord] = useState<GameRecord>(emptyRecord);
  const seed = dailyKey();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("haidou-sim-v1");
      if (saved) setRecord({ ...emptyRecord, ...JSON.parse(saved) as GameRecord });
    } catch {
      // Embedded browsers may block storage; the run remains playable.
    }
  }, []);

  const heroDraft = useMemo(() => seededSort(gameHeroes, `${seed}-heroes`).slice(0, 3), [seed]);
  const counts = hero ? tagCounts(hero, cards) : [];
  const power = hero ? calculatePower(hero, cards, hp, wins) : 0;
  const maxHp = hero ? hero.hp + cards.reduce((sum, card) => sum + (card.hp ?? 0), 0) : 100;
  const score = hero ? Math.max(0, wins * 950 + power * 17 + cards.length * 120 + Math.max(0, hp) * 8) : 0;
  const hotIndex = Math.min(100, Math.round(power / 1.65 + counts.filter(([, count]) => count >= 2).length * 6));

  const rollOffers = (targetRound: number, picked: GameCard[], nonce: number, targetHero: GameHero) => {
    const owned = new Set(picked.map((card) => card.id));
    const pool = gameCards.filter((card) => !owned.has(card.id));
    const ranked = seededSort(pool, `${seed}-${targetHero.id}-${targetRound}-${nonce}`)
      .sort((a, b) => {
        const fitA = a.tags.filter((tag) => [...targetHero.tags, ...picked.flatMap((card) => card.tags)].includes(tag)).length;
        const fitB = b.tags.filter((tag) => [...targetHero.tags, ...picked.flatMap((card) => card.tags)].includes(tag)).length;
        const noiseA = hash(`${seed}-${nonce}-${a.id}`) % 24;
        const noiseB = hash(`${seed}-${nonce}-${b.id}`) % 24;
        return (fitB * 7 + noiseB) - (fitA * 7 + noiseA);
      });
    const prismatic = ranked.find((card) => card.rarity === "棱彩");
    const selection = ranked.slice(0, 3);
    if (targetRound >= 3 && prismatic && !selection.some((card) => card.rarity === "棱彩")) selection[2] = prismatic;
    setOffers(selection);
  };

  const start = (pickedHero: GameHero) => {
    setHero(pickedHero);
    setRound(0);
    setHp(pickedHero.hp);
    setCards([]);
    setRerolls(2);
    setRerollNonce(0);
    setWins(0);
    setBattle(null);
    setCleared(false);
    rollOffers(0, [], 0, pickedHero);
    setPhase("choice");
  };

  const chooseCard = (card: GameCard) => {
    if (!hero) return;
    const nextCards = [...cards, card];
    const enemy = gameEnemies[round];
    const nextMaxHp = hero.hp + nextCards.reduce((sum, entry) => sum + (entry.hp ?? 0), 0);
    const healed = nextCards.reduce((sum, entry) => sum + (entry === card ? entry.heal ?? 0 : 0), 0) + (hero.id === "ember-mage" && card.rarity === "棱彩" ? 18 : 0);
    const healedHp = Math.min(nextMaxHp, hp + Math.max(0, card.hp ?? 0) + healed);
    const playerPower = calculatePower(hero, nextCards, healedHp, wins);
    const variance = (hash(`${seed}-${hero.id}-${round}-${card.id}`) % 19) - 9;
    const enemyPower = enemy.power + variance;
    const won = playerPower >= enemyPower;
    const damage = won ? Math.max(1, Math.round(enemyPower * .05 - hero.guard * .08)) : Math.max(12, Math.round((enemyPower - playerPower) * .62 + 13));
    const afterHp = Math.max(0, healedHp - damage);
    const nextWins = wins + (won ? 1 : 0);
    const line = won
      ? playerPower > enemyPower * 1.35 ? "力量完全碾压，对手还没展开就被击穿。" : "构筑联动成功，你在拉扯中赢下这一轮。"
      : afterHp > 0 ? "这一轮没能压住对手，但你保住了继续构筑的机会。" : "构筑尚未成型，终焉观测结束了这次试炼。";
    setCards(nextCards);
    setHp(afterHp);
    setWins(nextWins);
    setBattle({ won, playerPower, enemyPower, damage, heal: healed, line });
    setRecord((current) => ({ ...current, seen: [...new Set([...current.seen, card.id])] }));
    setPhase("battle");
  };

  const finish = (cleared: boolean) => {
    setCleared(cleared);
    setRecord((current) => {
      const nextRecord = { runs: current.runs + 1, clears: current.clears + (cleared ? 1 : 0), bestScore: Math.max(current.bestScore, score), seen: current.seen };
      try { window.localStorage.setItem("haidou-sim-v1", JSON.stringify(nextRecord)); } catch { /* no-op */ }
      return nextRecord;
    });
    setPhase("result");
  };

  const nextRound = () => {
    if (!hero) return;
    if (hp <= 0) return finish(false);
    if (round >= gameEnemies.length - 1) return finish(Boolean(battle?.won && hp > 0));
    const targetRound = round + 1;
    setRound(targetRound);
    setRerollNonce(0);
    rollOffers(targetRound, cards, 0, hero);
    setPhase("choice");
  };

  const reroll = () => {
    if (!hero || rerolls <= 0) return;
    const nonce = rerollNonce + 1;
    setRerollNonce(nonce);
    setRerolls((value) => value - 1);
    rollOffers(round, cards, nonce, hero);
  };

  const share = async () => {
    if (!hero) return;
    const text = `我用${hero.name}完成了${wins}/6轮构筑试炼，天胡指数${hotIndex}，得分${score}。核心：${cards.slice(-3).map((card) => card.name).join("＋")}`;
    try {
      if (navigator.share) await navigator.share({ title: "构筑乱斗战绩", text, url: window.location.href });
      else { await navigator.clipboard.writeText(`${text} ${window.location.href}`); onToast("战绩已复制"); }
    } catch (error) {
      if ((error as Error).name !== "AbortError") onToast("分享未完成");
    }
  };

  if (phase === "hero") return <section className="sim-page">
    <div className="sim-hero-banner">
      <span className="sim-kicker">每日同源随机 · {seed.replaceAll("/", "-")}</span>
      <h1>午休来一把<br /><em>构筑乱斗</em></h1>
      <p>不需要填任何东西。选角色、拿强化、看构筑变异，3～5分钟打穿六轮试炼。</p>
      <div className="sim-record"><span><b>{record.runs}</b>累计挑战</span><span><b>{record.clears}</b>成功通关</span><span><b>{record.bestScore}</b>最高分</span></div>
    </div>
    <div className="sim-section-title"><span>01</span><div><strong>三选一角色</strong><small>每天所有玩家看到相同开局</small></div></div>
    <div className="sim-hero-draft">{heroDraft.map((entry) => <button key={entry.id} style={{ "--hero-accent": entry.accent } as React.CSSProperties} onClick={() => start(entry)}>
      <span className="sim-hero-glyph">{entry.glyph}</span><small>{entry.title}</small><strong>{entry.name}</strong><p>{entry.trait}</p><i>{entry.tags.map((tag) => `#${tag}`).join("  ")}</i><b>选择</b>
    </button>)}</div>
    <p className="sim-origin-note">“构筑乱斗”为原创轻量玩法，借鉴三选一、有限刷新、组合成型与力量膨胀的体验；角色和强化均为原创设定。</p>
  </section>;

  if (!hero) return null;
  const enemy = gameEnemies[round];

  if (phase === "result") {
    return <section className="sim-page sim-result">
      <div className={`result-sigil ${cleared ? "clear" : "failed"}`}>{cleared ? "♛" : "◇"}</div>
      <span className="sim-kicker">{cleared ? "构筑完成" : "试炼终止"}</span>
      <h1>{cleared ? "这一把，真的成了" : "差一点就能成型"}</h1>
      <p>{hero.name}完成{wins}/6场胜利，最终天胡指数<strong>{hotIndex}</strong>。</p>
      <div className="result-score"><span>本局得分</span><strong>{score}</strong><small>历史最高 {Math.max(record.bestScore, score)}</small></div>
      <div className="result-build">{cards.map((card) => <div key={card.id}><CardGlyph card={card} /><small>{card.name}</small></div>)}</div>
      <div className="result-tags">{counts.slice(0, 5).map(([tag, count]) => <span key={tag} className={count >= 3 ? "hot" : ""}>#{tag} ×{count}</span>)}</div>
      <button className="sim-primary" onClick={() => { setHero(null); setPhase("hero"); }}>再来一局</button>
      <button className="sim-secondary" onClick={share}>分享这套构筑</button>
    </section>;
  }

  if (phase === "battle" && battle) return <section className="sim-page">
    <div className="sim-hud"><button onClick={() => setPhase("hero")}>退出</button><div><span>第 {round + 1}/6 轮</span><strong>战斗结算</strong></div><span className="hud-score">{score}</span></div>
    <div className={`battle-stage ${battle.won ? "victory" : "defeat"}`}>
      <div className="battle-flare" />
      <div className="fighter player" style={{ "--fighter": hero.accent } as React.CSSProperties}><span>{hero.glyph}</span><strong>{hero.name}</strong><small>战力 {battle.playerPower}</small></div>
      <div className="battle-versus">VS</div>
      <div className="fighter enemy" style={{ "--fighter": enemy.accent } as React.CSSProperties}><span>{enemy.glyph}</span><strong>{enemy.name}</strong><small>战力 {battle.enemyPower}</small></div>
      <div className="battle-result-copy"><b>{battle.won ? "胜利" : hp > 0 ? "败退" : "终止"}</b><p>{battle.line}</p><span>-{battle.damage}生命{battle.heal > 0 ? ` · +${battle.heal}回复` : ""}</span></div>
    </div>
    <div className="sim-health"><div><span>当前生命</span><strong>{hp}/{maxHp}</strong></div><i><b style={{ width: `${Math.max(0, Math.min(100, hp / maxHp * 100))}%` }} /></i></div>
    <div className="picked-card"><CardGlyph card={cards[cards.length - 1]} /><div><small>新强化已接入构筑</small><strong>{cards[cards.length - 1].name}</strong><p>{cards[cards.length - 1].description}</p></div></div>
    <button className="sim-primary" onClick={nextRound}>{hp <= 0 ? "查看结算" : round >= 5 ? "完成试炼" : "进入下一轮"}</button>
  </section>;

  return <section className="sim-page">
    <div className="sim-hud"><button onClick={() => setPhase("hero")}>退出</button><div><span>第 {round + 1}/6 轮</span><strong>{enemy.title}</strong></div><span className="hud-score">{score}</span></div>
    <section className="sim-status" style={{ "--hero-accent": hero.accent } as React.CSSProperties}>
      <span className="sim-status-glyph">{hero.glyph}</span><div><small>{hero.name}</small><strong>战力 {power}</strong><p>{counts.slice(0, 3).map(([tag, count]) => `#${tag}${count > 1 ? `×${count}` : ""}`).join("  ")}</p></div>
      <div className="hot-index"><small>天胡指数</small><strong>{hotIndex}</strong></div>
    </section>
    <div className="sim-health"><div><span>生命</span><strong>{hp}/{maxHp}</strong></div><i><b style={{ width: `${Math.max(0, Math.min(100, hp / maxHp * 100))}%` }} /></i></div>
    <div className="enemy-preview"><span style={{ color: enemy.accent }}>{enemy.glyph}</span><div><small>本轮对手</small><strong>{enemy.name}</strong><p>战力约 {enemy.power} · 防御 {enemy.guard} · 生命 {enemy.hp}</p></div></div>
    <div className="sim-section-title"><span>0{round + 2}</span><div><strong>选择一项强化</strong><small>拿走一张，立刻自动战斗</small></div><button disabled={rerolls <= 0} onClick={reroll}>刷新 {rerolls}/2</button></div>
    <div className="sim-offers">{offers.map((card) => <button key={card.id} className={`sim-offer sim-border-${card.rarity}`} onClick={() => chooseCard(card)}>
      <div className="sim-offer-head"><CardGlyph card={card} /><span><small>{card.rarity}强化</small><strong>{card.name}</strong></span></div>
      <p>{card.description}</p><div>{card.tags.map((tag) => <i key={tag} className={counts.some(([name]) => name === tag) ? "matched" : ""}>#{tag}</i>)}</div><b>选择此强化</b>
    </button>)}</div>
    <div className="owned-strip"><span>已选 {cards.length}/6</span>{cards.length ? cards.map((card) => <CardGlyph key={card.id} card={card} />) : <small>第一张强化将决定这局的方向</small>}</div>
  </section>;
}
