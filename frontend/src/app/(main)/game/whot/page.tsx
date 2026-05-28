// app/(main)/game/whot/page.tsx
// Authentic Naija Whot — identical layout to classic Nigerian Whot app
// White cards · Green felt table · Fan hand · Special rules: +2, Skip, Market, Whot

import { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type Shape = 'Circle' | 'Triangle' | 'Cross' | 'Square' | 'Star' | 'Whot';

interface WhotCard { shape: Shape; value: number; }

interface SpecialEffect { type: 'pick2'; count: number; }

interface G {
  playerHand: WhotCard[];
  botHand: WhotCard[];
  draw: WhotCard[];
  pile: WhotCard[];
  playerTurn: boolean;
  neededShape: Shape | null;
  fx: SpecialEffect | null;
  winner: 'player' | 'bot' | null;
  scores: [number, number]; // [player, bot]
  round: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHAPES: Shape[] = ['Circle', 'Triangle', 'Cross', 'Square', 'Star'];
const SYM: Record<Shape, string> = { Circle:'⬤', Triangle:'▲', Cross:'✚', Square:'■', Star:'★', Whot:'W' };

// Authentic Naija Whot card colours
const CLR: Record<Shape, { fg: string; accent: string; bg: string }> = {
  Circle:   { fg: '#dc2626', accent: '#dc2626', bg: '#fef2f2' },
  Triangle: { fg: '#16a34a', accent: '#16a34a', bg: '#f0fdf4' },
  Cross:    { fg: '#2563eb', accent: '#2563eb', bg: '#eff6ff' },
  Square:   { fg: '#d97706', accent: '#d97706', bg: '#fffbeb' },
  Star:     { fg: '#7c3aed', accent: '#7c3aed', bg: '#f5f3ff' },
  Whot:     { fg: '#000000', accent: '#d97706', bg: '#fefce8' },
};

const SPECIAL_LABEL: Partial<Record<number, string>> = {
  1: 'HOLD ON', 2: 'PICK TWO', 8: 'SUSPENSION', 14: 'GENERAL\nMARKET',
};

// ─── Deck ────────────────────────────────────────────────────────────────────

function buildDeck(): WhotCard[] {
  const d: WhotCard[] = [];
  for (const s of SHAPES) for (let v = 1; v <= 14; v++) d.push({ shape: s, value: v });
  for (let i = 0; i < 5; i++) d.push({ shape: 'Whot', value: 20 });
  return d;
}
function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function canPlay(card: WhotCard, top: WhotCard, neededShape: Shape | null, fx: SpecialEffect | null): boolean {
  if (fx?.type === 'pick2') return card.value === 2 || card.shape === 'Whot';
  if (card.shape === 'Whot') return true;
  const es = neededShape ?? top.shape;
  return card.shape === es || card.value === top.value;
}
function mkGame(prev?: G): G {
  const d = shuffle(buildDeck());
  const pH = d.splice(0, 5), bH = d.splice(0, 5);
  let si = d.findIndex(c => c.shape !== 'Whot' && c.value !== 2 && c.value !== 8 && c.value !== 14);
  if (si < 0) si = 0;
  const first = d.splice(si, 1)[0];
  return { playerHand: pH, botHand: bH, draw: d, pile: [first], playerTurn: true, neededShape: null, fx: null, winner: null, scores: prev?.scores ?? [0, 0], round: (prev?.round ?? 0) + 1 };
}

// ─── Card Face ───────────────────────────────────────────────────────────────

interface CardFaceProps {
  card: WhotCard; playable?: boolean; onClick?: () => void; disabled?: boolean;
  rotate?: number; zIndex?: number; translateX?: number; translateY?: number; size?: 'sm'|'md';
}

const CardFace = ({ card, playable, onClick, disabled, rotate = 0, zIndex = 0, translateX = 0, translateY = 0, size = 'md' }: CardFaceProps) => {
  const c = CLR[card.shape];
  const isWhot = card.shape === 'Whot';
  const sp = SPECIAL_LABEL[card.value];
  const w = size === 'sm' ? 48 : 62;
  const h = size === 'sm' ? 68 : 90;
  const numSz = size === 'sm' ? 11 : 14;
  const symSz = size === 'sm' ? 20 : 28;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      style={{
        width: w, height: h, borderRadius: 8,
        background: isWhot ? '#fefce8' : '#ffffff',
        border: playable ? `2.5px solid #22c55e` : `1.5px solid ${playable === false ? '#d1d5db' : '#d1d5db'}`,
        boxShadow: playable
          ? `0 0 0 3px #22c55e66, 0 4px 16px rgba(0,0,0,0.45)`
          : `0 3px 8px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)`,
        position: 'relative', flexShrink: 0, cursor: playable && onClick ? 'pointer' : 'default',
        transform: `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px)`,
        zIndex, transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '4px 4px',
        opacity: (!playable && playable !== undefined && onClick) ? 0.55 : 1,
      }}
      onMouseEnter={e => { if (playable && onClick) (e.currentTarget as HTMLButtonElement).style.transform = `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY - 12}px) scale(1.06)`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px)`; }}
    >
      {/* Top-left */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', lineHeight:1 }}>
        <span style={{ fontSize: numSz, fontWeight: 900, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>
          {card.value === 20 ? 'W' : card.value}
        </span>
        <span style={{ fontSize: numSz - 2, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>{SYM[card.shape]}</span>
      </div>

      {/* Centre */}
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <span style={{ fontSize: symSz, color: isWhot ? '#d97706' : c.fg, fontWeight: 900,
          textShadow: isWhot ? '0 0 12px #d9770644' : 'none', display: 'block' }}>
          {isWhot ? 'W' : SYM[card.shape]}
        </span>
        {sp && (
          <span style={{ fontSize: 5.5, fontWeight: 900, color: c.fg, textTransform: 'uppercase', letterSpacing: 0.3,
            background: c.bg, borderRadius: 3, padding: '1px 3px', display: 'block', marginTop: 2, lineHeight: 1.3,
            whiteSpace: 'pre' }}>
            {sp}
          </span>
        )}
      </div>

      {/* Bottom-right (rotated) */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:1, transform:'rotate(180deg)' }}>
        <span style={{ fontSize: numSz, fontWeight: 900, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>
          {card.value === 20 ? 'W' : card.value}
        </span>
        <span style={{ fontSize: numSz - 2, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>{SYM[card.shape]}</span>
      </div>
    </button>
  );
};

// ─── Card Back ───────────────────────────────────────────────────────────────

const CardBack = ({ rotate = 0, translateX = 0, translateY = 0, zIndex = 0, size = 'sm' }: {
  rotate?: number; translateX?: number; translateY?: number; zIndex?: number; size?: 'sm'|'md';
}) => {
  const w = size === 'sm' ? 44 : 62, h = size === 'sm' ? 63 : 90;
  return (
    <div style={{
      width: w, height: h, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)',
      border: '1.5px solid #1e40af',
      boxShadow: '0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      transform: `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px)`,
      zIndex,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
    }}>
      {/* Diamond pattern */}
      <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4 }} />
      <div style={{ position: 'absolute', inset: 7, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2 }} />
      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)', fontWeight: 900, transform: 'rotate(45deg)' }}>W</span>
    </div>
  );
};

// ─── Fan layout helper ────────────────────────────────────────────────────────

function getFanProps(idx: number, total: number, isPlayer: boolean) {
  const spread = Math.min(total * 6, 42); // max ±42°
  const maxRotate = spread;
  const rotateStep = total <= 1 ? 0 : (maxRotate * 2) / (total - 1);
  const rotate = total <= 1 ? 0 : -maxRotate + rotateStep * idx;
  // Arc: cards curve downward at edges
  const normIdx = total <= 1 ? 0 : (idx / (total - 1)) * 2 - 1; // -1..1
  const translateY = isPlayer ? normIdx * normIdx * 8 : -(normIdx * normIdx * 8);
  const overlapX = total <= 6 ? 0 : (idx - (total - 1) / 2) * -(total - 6) * 2;
  return { rotate: isPlayer ? rotate : -rotate, translateY, translateX: overlapX, zIndex: idx };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const WhotPage = () => {
  const navigate = useNavigate();
  const [g, setG] = useState<G>(mkGame);
  const [logs, setLogs] = useState<string[]>(['Game started!']);
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const [botBusy, setBotBusy] = useState(false);
  const [toast, setToast] = useState({ msg: '', show: false });
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const top = g.pile[g.pile.length - 1];

  const flash = useCallback((msg: string) => {
    setToast({ msg, show: true });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }, []);

  const log = useCallback((msg: string) => setLogs(p => [msg, ...p].slice(0, 25)), []);

  // Draw N cards
  const drawN = useCallback((state: G, who: 'player' | 'bot', n: number): G => {
    let s = state;
    for (let i = 0; i < n; i++) {
      if (s.draw.length === 0) {
        const top2 = s.pile[s.pile.length - 1];
        s = { ...s, draw: shuffle(s.pile.slice(0, -1)), pile: [top2] };
      }
      if (s.draw.length === 0) break;
      const [card, ...rest] = s.draw;
      s = { ...s, draw: rest, playerHand: who === 'player' ? [...s.playerHand, card] : s.playerHand, botHand: who === 'bot' ? [...s.botHand, card] : s.botHand };
    }
    return s;
  }, []);

  // Apply a play
  const applyPlay = useCallback((state: G, idx: number, who: 'player' | 'bot', whotShape?: Shape): G => {
    const hand = who === 'player' ? state.playerHand : state.botHand;
    const card = hand[idx];
    const newHand = hand.filter((_, i) => i !== idx);
    const won = newHand.length === 0 ? who : null;
    let ns: G = {
      ...state,
      playerHand: who === 'player' ? newHand : state.playerHand,
      botHand: who === 'bot' ? newHand : state.botHand,
      pile: [...state.pile, card],
      playerTurn: who === 'bot',
      neededShape: card.shape === 'Whot' ? (whotShape ?? null) : null,
      fx: null, winner: won,
    };
    if (!won) {
      if (card.value === 2) {
        const prev = state.fx?.type === 'pick2' ? state.fx.count : 0;
        ns = { ...ns, fx: { type: 'pick2', count: prev + 2 } };
      } else if (card.value === 8) {
        // Suspension — opponent skips, same player goes again
        ns = { ...ns, playerTurn: who === 'player' };
      } else if (card.value === 14) {
        // General Market — opponent picks 1, current player continues
        const opp: 'player' | 'bot' = who === 'player' ? 'bot' : 'player';
        ns = { ...drawN(ns, opp, 1), playerTurn: who === 'bot' };
      }
    }
    if (won) {
      ns = { ...ns, scores: [state.scores[0] + (won === 'player' ? 1 : 0), state.scores[1] + (won === 'bot' ? 1 : 0)] };
    }
    return ns;
  }, [drawN]);

  // Bot AI
  const botTurn = useCallback(() => {
    setBotBusy(true);
    const delay = 800 + Math.random() * 400;
    setTimeout(() => {
      setG(prev => {
        if (prev.winner || prev.playerTurn) { setBotBusy(false); return prev; }
        const topCard = prev.pile[prev.pile.length - 1];
        const fx = prev.fx;
        const bh = prev.botHand;

        // Handle pick2 pending
        if (fx?.type === 'pick2') {
          const ci = bh.findIndex(c => c.value === 2 || c.shape === 'Whot');
          if (ci >= 0) {
            const card = bh[ci];
            const ws = card.shape === 'Whot' ? SHAPES[0] : undefined;
            log(card.value === 2 ? '🤖 Bot counters with Pick Two!' : `🤖 Bot plays WHOT! calls ${ws}`);
            setBotBusy(false);
            return applyPlay(prev, ci, 'bot', ws);
          }
          const n = fx.count;
          const after = { ...drawN({ ...prev, fx: null, playerTurn: true }, 'bot', n) };
          log(`🤖 Bot picks ${n} cards 😭`);
          setBotBusy(false);
          return after;
        }

        // Priority play logic
        let pi = -1;
        // Win if 1 card left
        if (bh.length === 1 && canPlay(bh[0], topCard, prev.neededShape, fx)) pi = 0;
        // Attack with pick2 when player < 4 cards
        if (pi < 0 && prev.playerHand.length <= 3) pi = bh.findIndex(c => c.value === 2);
        // Suspension
        if (pi < 0) pi = bh.findIndex(c => c.value === 8 && canPlay(c, topCard, prev.neededShape, fx));
        // Shape match
        if (pi < 0) pi = bh.findIndex(c => c.shape !== 'Whot' && c.shape === (prev.neededShape ?? topCard.shape));
        // Value match
        if (pi < 0) pi = bh.findIndex(c => c.shape !== 'Whot' && c.value === topCard.value && canPlay(c, topCard, prev.neededShape, fx));
        // General market
        if (pi < 0) pi = bh.findIndex(c => c.value === 14 && canPlay(c, topCard, prev.neededShape, fx));
        // Whot
        if (pi < 0) pi = bh.findIndex(c => c.shape === 'Whot');

        if (pi >= 0) {
          const card = bh[pi];
          const ws = card.shape === 'Whot' ? SHAPES[Math.floor(Math.random() * SHAPES.length)] : undefined;
          log(
            card.value === 2  ? '🤖 Bot plays Pick Two! 😱' :
            card.value === 8  ? '🤖 Bot plays Suspension! 🛑' :
            card.value === 14 ? '🤖 Bot plays General Market! 🌍' :
            card.shape === 'Whot' ? `🤖 Bot plays WHOT! calls ${ws}` :
            `🤖 Bot plays ${card.value} ${card.shape}`
          );
          setBotBusy(false);
          return applyPlay(prev, pi, 'bot', ws);
        }

        // Draw
        const after = { ...drawN(prev, 'bot', 1), playerTurn: true };
        log('🤖 Bot picks from market');
        setBotBusy(false);
        return after;
      });
    }, delay);
  }, [log, applyPlay, drawN]);

  useEffect(() => { if (!g.playerTurn && !g.winner) botTurn(); }, [g.playerTurn, g.winner]);

  // Player plays a card
  const playCard = (idx: number) => {
    if (!g.playerTurn || g.winner || botBusy) return;
    const card = g.playerHand[idx];
    if (g.fx?.type === 'pick2') {
      if (card.value === 2) { log('✅ You counter with Pick Two!'); flash('Countered! 🔥'); setG(applyPlay(g, idx, 'player')); return; }
      if (card.shape === 'Whot') { setPendingIdx(idx); setShowShapeModal(true); return; }
      flash(`Must counter with a 2, or pick ${g.fx.count}!`); return;
    }
    if (card.shape === 'Whot') { setPendingIdx(idx); setShowShapeModal(true); return; }
    if (!canPlay(card, top, g.neededShape, g.fx)) { flash("Can't play that card!"); return; }
    const lbl = card.value === 2 ? '✅ Pick Two! 😤' : card.value === 8 ? '✅ Suspension! 🛑' : card.value === 14 ? '✅ General Market! 🌍' : `✅ Played ${card.value} of ${card.shape}`;
    log(lbl); if (card.value !== 1 && card.value !== 14 && card.value !== 20) flash(lbl);
    if (card.value === 2) flash('Pick Two! Bot must pick 😤');
    if (card.value === 8) flash("Bot's turn suspended! ✊");
    if (card.value === 14) flash('General Market! 🌍');
    setG(applyPlay(g, idx, 'player'));
  };

  const pickFromMarket = () => {
    if (!g.playerTurn || g.winner || botBusy) return;
    if (g.fx?.type === 'pick2') {
      const n = g.fx.count;
      const after = { ...drawN({ ...g, fx: null, playerTurn: false }, 'player', n) };
      log(`📥 You picked ${n} cards`); flash(`Picked ${n} cards 😭`);
      setG(after); return;
    }
    const after = drawN(g, 'player', 1);
    const drawn = after.playerHand[after.playerHand.length - 1];
    log(`📥 Drew ${drawn?.value ?? '?'} of ${drawn?.shape ?? '?'}`);
    setG({ ...after, playerTurn: false });
  };

  const selectShape = (shape: Shape) => {
    if (pendingIdx === null) return;
    log(`✅ WHOT! Called: ${shape}`); flash(`WHOT! You called ${shape} 🃏`);
    setG(applyPlay(g, pendingIdx, 'player', shape));
    setShowShapeModal(false); setPendingIdx(null);
  };

  const newGame = () => { setG(prev => mkGame(prev)); setLogs(['New game! Good luck! 🃏']); setShowShapeModal(false); setPendingIdx(null); setBotBusy(false); };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #15803d 0%, #166534 50%, #14532d 100%)', userSelect: 'none', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* Toast */}
      <div style={{ position: 'fixed', top: 72, left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : -20}px)`, opacity: toast.show ? 1 : 0, transition: 'all 0.25s', zIndex: 100, background: 'rgba(0,0,0,0.82)', color: '#fff', fontWeight: 800, fontSize: 12, padding: '8px 18px', borderRadius: 20, whiteSpace: 'nowrap', pointerEvents: 'none', backdropFilter: 'blur(8px)' }}>
        {toast.msg}
      </div>

      {/* ── Top Bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(0,0,0,0.35)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate('/')} style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, padding:'6px 10px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ textAlign:'center' }}>
          <div style={{ color:'#fbbf24', fontWeight:900, fontSize:15, letterSpacing:2, textTransform:'uppercase' }}>WHOT!</div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Naija Edition</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ color:'#fff', fontSize:11, fontWeight:900 }}>
            <span style={{ color:'#4ade80' }}>{g.scores[0]}</span>
            <span style={{ color:'rgba(255,255,255,0.3)' }}> – </span>
            <span style={{ color:'#f87171' }}>{g.scores[1]}</span>
          </div>
          <button onClick={newGame} style={{ background:'rgba(255,255,255,0.12)', border:'none', borderRadius:8, padding:'6px 8px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700 }}>
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* ── Bot Area ── */}
      <div style={{ padding:'16px 16px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
        {/* Bot avatar row */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.25)', borderRadius:16, padding:'6px 14px' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border: `2px solid ${!g.playerTurn && !g.winner ? '#fbbf24' : 'rgba(255,255,255,0.15)'}`, boxShadow: !g.playerTurn && !g.winner ? '0 0 10px #fbbf2466' : 'none' }}>
            🤖
          </div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:11 }}>Bot</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9 }}>{g.botHand.length} cards</div>
          </div>
          {botBusy && <div style={{ color:'#fbbf24', fontSize:9, fontWeight:700, marginLeft:4 }}>thinking…</div>}
        </div>

        {/* Bot hand (face-down fan) */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', height:72, position:'relative', width:'100%' }}>
          {g.botHand.map((_, i) => {
            const { rotate, translateY, zIndex } = getFanProps(i, g.botHand.length, false);
            const spread = Math.max(g.botHand.length - 1, 0);
            const offsetX = spread === 0 ? 0 : ((i - spread / 2) * 32);
            return (
              <div key={i} style={{ position:'absolute', left:'50%', bottom: 0, transform:`translateX(calc(-50% + ${offsetX}px)) rotate(${rotate}deg) translateY(${-translateY}px)`, zIndex: zIndex + 1 }}>
                <CardBack rotate={0} size="sm" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Centre Table ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:24, padding:'8px 16px' }}>

        {/* Discard Pile */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Pile</div>
          <div style={{ position:'relative' }}>
            {g.pile.length > 1 && (
              <div style={{ position:'absolute', top:3, left:3, right:-3, bottom:-3, background:'rgba(255,255,255,0.15)', borderRadius:8 }} />
            )}
            {g.pile.length > 2 && (
              <div style={{ position:'absolute', top:6, left:6, right:-6, bottom:-6, background:'rgba(255,255,255,0.08)', borderRadius:8 }} />
            )}
            <CardFace card={top} size="md" />
          </div>
          {g.neededShape && (
            <div style={{ background:`${CLR[g.neededShape].fg}22`, border:`1px solid ${CLR[g.neededShape].fg}55`, color: CLR[g.neededShape].fg, fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:12, textTransform:'uppercase', letterSpacing:1, animation:'pulse 1s infinite' }}>
              {SYM[g.neededShape]} {g.neededShape}
            </div>
          )}
          {g.fx?.type === 'pick2' && (
            <div style={{ background:'#dc262622', border:'1px solid #dc262655', color:'#f87171', fontSize:9, fontWeight:900, padding:'3px 10px', borderRadius:12, textTransform:'uppercase', letterSpacing:1 }}>
              +{g.fx.count} pending!
            </div>
          )}
        </div>

        {/* Market (Draw) */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>Market</div>
          <button
            onClick={pickFromMarket}
            disabled={!g.playerTurn || !!g.winner || botBusy}
            style={{
              width:62, height:90, borderRadius:8, border:'none', cursor: g.playerTurn && !g.winner && !botBusy ? 'pointer' : 'default',
              background:'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)',
              boxShadow: g.playerTurn && !g.winner && !botBusy
                ? '0 0 0 3px #22c55e66, 0 4px 16px rgba(0,0,0,0.45)'
                : '0 4px 12px rgba(0,0,0,0.4)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
              opacity: !g.playerTurn || !!g.winner || botBusy ? 0.5 : 1,
              transition:'all 0.15s', position:'relative', overflow:'hidden',
            }}
          >
            <div style={{ position:'absolute', inset:6, border:'1px solid rgba(255,255,255,0.15)', borderRadius:4 }} />
            <div style={{ position:'absolute', inset:10, border:'1px solid rgba(255,255,255,0.08)', borderRadius:2 }} />
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:20, fontWeight:900, transform:'rotate(45deg)' }}>W</div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5 }}>
              {g.fx?.type === 'pick2' ? `Pick ${g.fx.count}` : 'Market'}
            </div>
            <div style={{ color:'rgba(255,255,255,0.25)', fontSize:8 }}>{g.draw.length} left</div>
          </button>
        </div>

        {/* Log panel */}
        <div style={{ width:120, height:100, background:'rgba(0,0,0,0.3)', borderRadius:12, padding:'8px 10px', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:7, color:'rgba(255,255,255,0.25)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingBottom:4, marginBottom:4, flexShrink:0 }}>Log</div>
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
            {logs.map((l, i) => (
              <div key={i} style={{ fontSize:9, fontFamily:'monospace', color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)', lineHeight:1.3, fontWeight: i === 0 ? 700 : 400 }}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Turn Banner ── */}
      <div style={{ textAlign:'center', padding:'6px 0', minHeight:30 }}>
        {g.playerTurn && !g.winner && (
          <div style={{ display:'inline-block', background:'#15803d', color:'#fff', fontWeight:900, fontSize:11, padding:'5px 20px', borderRadius:20, textTransform:'uppercase', letterSpacing:1, border:'1px solid #22c55e' }}>
            {g.fx?.type === 'pick2' ? `⚡ Counter or Pick ${g.fx.count}!` : '🎮 Your Turn'}
          </div>
        )}
        {!g.playerTurn && !g.winner && (
          <div style={{ display:'inline-block', background:'rgba(0,0,0,0.3)', color:'rgba(255,255,255,0.5)', fontWeight:800, fontSize:11, padding:'5px 20px', borderRadius:20, textTransform:'uppercase', letterSpacing:1 }}>
            ⏳ Bot's Turn…
          </div>
        )}
      </div>

      {/* ── Player Area ── */}
      <div style={{ padding:'8px 16px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>

        {/* Player hand (face-up fan) */}
        <div style={{ position:'relative', width:'100%', height:110, display:'flex', alignItems:'flex-start', justifyContent:'center' }}>
          {g.playerHand.map((card, i) => {
            const total = g.playerHand.length;
            const { rotate, translateY, zIndex } = getFanProps(i, total, true);
            const spread = Math.max(total - 1, 0);
            const offsetX = spread === 0 ? 0 : ((i - spread / 2) * (total > 8 ? 28 : 36));
            const isPlayable = g.playerTurn && !g.winner && !botBusy && canPlay(card, top, g.neededShape, g.fx);
            return (
              <div key={i} style={{ position:'absolute', top:0, left:'50%', transform:`translateX(calc(-50% + ${offsetX}px)) rotate(${rotate}deg) translateY(${translateY + (isPlayable ? -4 : 0)}px)`, zIndex: zIndex + 1, transition:'transform 0.15s' }}>
                <CardFace
                  card={card}
                  playable={g.playerTurn && !g.winner && !botBusy ? isPlayable : undefined}
                  onClick={() => playCard(i)}
                  disabled={!g.playerTurn || !!g.winner || botBusy}
                  size="md"
                />
              </div>
            );
          })}
        </div>

        {/* Player avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.25)', borderRadius:16, padding:'6px 14px' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#065f46,#047857)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border:`2px solid ${g.playerTurn && !g.winner ? '#22c55e' : 'rgba(255,255,255,0.15)'}`, boxShadow: g.playerTurn && !g.winner ? '0 0 10px #22c55e66' : 'none' }}>
            👤
          </div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:11 }}>You</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9 }}>{g.playerHand.length} cards</div>
          </div>
        </div>

        {/* Quick reference */}
        <div style={{ display:'flex', gap:12, opacity:0.5 }}>
          {([['2','Pick 2','#ef4444'],['8','Skip','#f97316'],['14','Market','#3b82f6'],['20','Whot!','#d97706']] as [string,string,string][]).map(([v,l,c]) => (
            <span key={v} style={{ fontSize:8, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:0.5 }}>{v}={l}</span>
          ))}
        </div>
      </div>

      {/* ── WHOT Shape Picker ── */}
      {showShapeModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ background:'#1a1a2e', border:'2px solid #fbbf24', borderRadius:24, padding:24, maxWidth:300, width:'100%', textAlign:'center', boxShadow:'0 0 60px rgba(251,191,36,0.2)' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🃏</div>
            <div style={{ color:'#fbbf24', fontWeight:900, fontSize:14, textTransform:'uppercase', letterSpacing:2, marginBottom:4 }}>Call Your Shape!</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, marginBottom:18, textTransform:'uppercase', letterSpacing:1 }}>Choose what the bot must play next</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {SHAPES.map(shape => {
                const c = CLR[shape];
                return (
                  <button key={shape} onClick={() => selectShape(shape)} style={{ background:'#fff', border:`2px solid ${c.fg}`, borderRadius:10, padding:'10px 8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'transform 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)') }
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)') }
                  >
                    <span style={{ fontSize:26, color:c.fg }}>{SYM[shape]}</span>
                    <span style={{ fontSize:9, fontWeight:900, color:c.fg, textTransform:'uppercase', letterSpacing:1 }}>{shape}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => { setShowShapeModal(false); setPendingIdx(null); }} style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:10, color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:1 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Winner Screen ── */}
      {g.winner && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
          <div style={{ background: g.winner === 'player' ? 'linear-gradient(135deg,#064e3b,#065f46)' : 'linear-gradient(135deg,#1c1917,#111827)', border: g.winner === 'player' ? '2px solid #22c55e' : '2px solid #ef4444', borderRadius:28, padding:32, maxWidth:340, width:'100%', textAlign:'center', boxShadow: g.winner === 'player' ? '0 0 80px rgba(34,197,94,0.25)' : '0 0 80px rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize:72, marginBottom:12 }}>{g.winner === 'player' ? '🏆' : '😔'}</div>
            <div style={{ color:'#fff', fontWeight:900, fontSize:24, textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>
              {g.winner === 'player' ? 'You Win!' : 'Bot Wins!'}
            </div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
              {g.winner === 'player' ? 'E don do! Whot cleared! 🎉' : 'Bot cleared its hand!'}
            </div>
            <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11, fontWeight:700, marginBottom:24 }}>
              Score: <span style={{ color:'#4ade80' }}>{g.scores[0]}</span> – <span style={{ color:'#f87171' }}>{g.scores[1]}</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={newGame} style={{ width:'100%', padding:14, background: g.winner === 'player' ? '#22c55e' : '#fbbf24', color:'#000', fontWeight:900, fontSize:12, textTransform:'uppercase', letterSpacing:2, borderRadius:14, border:'none', cursor:'pointer' }}>
                Next Round
              </button>
              <button onClick={() => navigate('/')} style={{ width:'100%', padding:12, background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.45)', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:1, borderRadius:14, border:'none', cursor:'pointer' }}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
