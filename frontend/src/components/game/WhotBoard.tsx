import { useState } from 'react';

// ─── Types & Constants ────────────────────────────────────────────────────────

const SHAPES = ['Circle', 'Triangle', 'Cross', 'Square', 'Star'];
const SYM: Record<string, string> = { Circle: '⬤', Triangle: '▲', Cross: '✚', Square: '■', Star: '★', Whot: 'W' };

const CLR: Record<string, { fg: string; accent: string; bg: string }> = {
  Circle: { fg: '#dc2626', accent: '#dc2626', bg: '#fef2f2' },
  Triangle: { fg: '#16a34a', accent: '#16a34a', bg: '#f0fdf4' },
  Cross: { fg: '#2563eb', accent: '#2563eb', bg: '#eff6ff' },
  Square: { fg: '#d97706', accent: '#d97706', bg: '#fffbeb' },
  Star: { fg: '#7c3aed', accent: '#7c3aed', bg: '#f5f3ff' },
  Whot: { fg: '#000000', accent: '#d97706', bg: '#fefce8' },
};

const SPECIAL_LABEL: Partial<Record<number, string>> = {
  1: 'HOLD ON', 2: 'PICK TWO', 8: 'SUSPENSION', 14: 'GENERAL\nMARKET',
};

// ─── Card Face Component ─────────────────────────────────────────────────────

interface CardFaceProps {
  card: { shape: string; value: number };
  playable?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  rotate?: number;
  zIndex?: number;
  translateX?: number;
  translateY?: number;
  size?: 'sm' | 'md';
}

const CardFace = ({
  card,
  playable,
  onClick,
  disabled,
  rotate = 0,
  zIndex = 0,
  translateX = 0,
  translateY = 0,
  size = 'md',
}: CardFaceProps) => {
  const c = CLR[card.shape] || CLR.Whot;
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
        width: w,
        height: h,
        borderRadius: 8,
        background: isWhot ? '#fefce8' : '#ffffff',
        border: playable ? `2.5px solid #fbbf24` : `1.5px solid ${playable === false ? '#d1d5db' : '#d1d5db'}`,
        boxShadow: playable
          ? `0 0 0 3px #fbbf2466, 0 4px 16px rgba(0,0,0,0.45)`
          : `0 3px 8px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.2)`,
        position: 'relative',
        flexShrink: 0,
        cursor: playable && onClick ? 'pointer' : 'default',
        transform: `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px)`,
        zIndex,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '4px 4px',
        opacity: (!playable && playable !== undefined && onClick) ? 0.55 : 1,
      }}
      onMouseEnter={(e) => {
        if (playable && onClick) {
          (e.currentTarget as HTMLButtonElement).style.transform = `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY - 12}px) scale(1.06)`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px)`;
      }}
    >
      {/* Top-left */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
        <span style={{ fontSize: numSz, fontWeight: 900, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>
          {card.value === 20 ? 'W' : card.value}
        </span>
        <span style={{ fontSize: numSz - 2, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>{SYM[card.shape]}</span>
      </div>

      {/* Centre */}
      <div style={{ textAlign: 'center', lineHeight: 1 }}>
        <span
          style={{
            fontSize: symSz,
            color: isWhot ? '#d97706' : c.fg,
            fontWeight: 900,
            textShadow: isWhot ? '0 0 12px #d9770644' : 'none',
            display: 'block',
          }}
        >
          {isWhot ? 'W' : SYM[card.shape]}
        </span>
        {sp && (
          <span
            style={{
              fontSize: 5.5,
              fontWeight: 900,
              color: c.fg,
              textTransform: 'uppercase',
              letterSpacing: 0.3,
              background: c.bg,
              borderRadius: 3,
              padding: '1px 3px',
              display: 'block',
              marginTop: 2,
              lineHeight: 1.3,
              whiteSpace: 'pre',
            }}
          >
            {sp}
          </span>
        )}
      </div>

      {/* Bottom-right (rotated) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1, transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: numSz, fontWeight: 900, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>
          {card.value === 20 ? 'W' : card.value}
        </span>
        <span style={{ fontSize: numSz - 2, color: isWhot ? '#d97706' : c.fg, lineHeight: 1 }}>{SYM[card.shape]}</span>
      </div>
    </button>
  );
};

// ─── Card Back Component ─────────────────────────────────────────────────────

const CardBack = ({
  rotate = 0,
  translateX = 0,
  translateY = 0,
  zIndex = 0,
  size = 'sm',
}: {
  rotate?: number;
  translateX?: number;
  translateY?: number;
  zIndex?: number;
  size?: 'sm' | 'md';
}) => {
  const w = size === 'sm' ? 44 : 62;
  const h = size === 'sm' ? 63 : 90;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        flexShrink: 0,
        background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)',
        border: '1.5px solid #1e40af',
        boxShadow: '0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        transform: `rotate(${rotate}deg) translateX(${translateX}px) translateY(${translateY}px)`,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', inset: 4, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4 }} />
      <div style={{ position: 'absolute', inset: 7, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2 }} />
      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)', fontWeight: 900, transform: 'rotate(45deg)' }}>W</span>
    </div>
  );
};

// ─── Fan Layout Helper ───────────────────────────────────────────────────────

function getFanProps(idx: number, total: number, isPlayer: boolean) {
  const spread = Math.min(total * 6, 42); // max ±42°
  const maxRotate = spread;
  const rotateStep = total <= 1 ? 0 : (maxRotate * 2) / (total - 1);
  const rotate = total <= 1 ? 0 : -maxRotate + rotateStep * idx;
  const normIdx = total <= 1 ? 0 : (idx / (total - 1)) * 2 - 1; // -1..1
  const translateY = isPlayer ? normIdx * normIdx * 8 : -(normIdx * normIdx * 8);
  const overlapX = total <= 6 ? 0 : (idx - (total - 1) / 2) * -(total - 6) * 2;
  return { rotate: isPlayer ? rotate : -rotate, translateY, translateX: overlapX, zIndex: idx };
}

// ─── Game Rules Legality Helper ──────────────────────────────────────────────

function canPlay(card: { shape: string; value: number }, top: { shape: string; value: number } | null, neededShape: string | null, fx: any): boolean {
  if (!top) return false;
  if (fx?.type === 'pick2') return card.value === 2 || card.shape === 'Whot';
  if (card.shape === 'Whot') return true;
  const es = neededShape ?? top.shape;
  return card.shape === es || card.value === top.value;
}

// ─── Main WhotBoard Component ────────────────────────────────────────────────

interface WhotBoardProps {
  board: any; // backend Whot state
  playerSymbol: 'X' | 'O' | null;
  currentPlayer: 'X' | 'O';
  status: string;
  sendMove: (move: any) => void;
  player1Username: string | null;
  player2Username: string | null;
}

export const WhotBoard = ({
  board,
  playerSymbol,
  currentPlayer,
  status,
  sendMove,
  player1Username,
  player2Username,
}: WhotBoardProps) => {
  const [showShapeModal, setShowShapeModal] = useState(false);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);

  const isSpectator = !playerSymbol;
  const isMyTurn = status === 'playing' && currentPlayer === playerSymbol && !isSpectator;

  // Resolve hands
  const hands = board?.hands || { X: [], O: [] };
  const playerHand = playerSymbol ? hands[playerSymbol] : hands.X;
  const opponentHand = playerSymbol ? hands[playerSymbol === 'X' ? 'O' : 'X'] : hands.O;

  // Resolve pile & draw stack
  const pile = board?.pile || [];
  const topCard = pile[pile.length - 1] || null;
  const drawCount = board?.drawCount || 0;
  const neededShape = board?.neededShape || null;
  const fx = board?.fx || null;
  const logs = board?.logs || [];

  const formatLog = (logStr: string) => {
    return logStr
      .replace(/\bX\b/g, player1Username || 'Player 1')
      .replace(/\bO\b/g, player2Username || 'Player 2');
  };

  const handlePlayCard = (idx: number) => {
    if (!isMyTurn) return;
    const card = playerHand[idx];
    
    if (fx?.type === 'pick2') {
      if (card.value === 2) {
        sendMove({ action: 'play', card_index: idx });
        return;
      }
      if (card.shape === 'Whot') {
        setPendingIdx(idx);
        setShowShapeModal(true);
        return;
      }
      return;
    }

    if (card.shape === 'Whot') {
      setPendingIdx(idx);
      setShowShapeModal(true);
      return;
    }

    if (canPlay(card, topCard, neededShape, fx)) {
      sendMove({ action: 'play', card_index: idx });
    }
  };

  const handleDraw = () => {
    if (!isMyTurn) return;
    sendMove({ action: 'draw' });
  };

  const handleSelectShape = (shape: string) => {
    if (pendingIdx === null) return;
    sendMove({ action: 'play', card_index: pendingIdx, whot_shape: shape });
    setShowShapeModal(false);
    setPendingIdx(null);
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: 460,
        borderRadius: 24,
        background: 'linear-gradient(180deg, #15803d 0%, #166534 50%, #14532d 100%)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 10px 10px -5px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 12px 20px',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── Opponent Hand (Top) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 72, position: 'relative', width: '100%' }}>
          {opponentHand.map((card: any, i: number) => {
            const { rotate, translateY, zIndex, translateX } = getFanProps(i, opponentHand.length, false);
            const spread = Math.max(opponentHand.length - 1, 0);
            const offsetX = spread === 0 ? 0 : (i - spread / 2) * 24;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 0,
                  transform: `translateX(calc(-50% + ${offsetX + translateX}px)) rotate(${rotate}deg) translateY(${-translateY}px)`,
                  zIndex: zIndex + 1,
                }}
              >
                {isSpectator ? (
                  <CardFace card={card} size="sm" />
                ) : (
                  <CardBack rotate={0} size="sm" />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {playerSymbol === 'X' ? (player2Username || 'Opponent') : (player1Username || 'Opponent')} Hand ({opponentHand.length} cards)
        </div>
      </div>

      {/* ── Central Table (Discard Pile, Market & Logs) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, margin: '20px 0' }}>
        
        {/* Discard Pile */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Discard Pile</div>
          <div style={{ position: 'relative' }}>
            {pile.length > 1 && (
              <div style={{ position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, background: 'rgba(255,255,255,0.15)', borderRadius: 8 }} />
            )}
            {pile.length > 2 && (
              <div style={{ position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, background: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
            )}
            {topCard ? (
              <CardFace card={topCard} size="md" />
            ) : (
              <div style={{ width: 62, height: 90, borderRadius: 8, border: '2px dashed rgba(255,255,255,0.2)' }} />
            )}
          </div>
          {neededShape && (
            <div
              style={{
                background: `${CLR[neededShape]?.fg || '#000'}22`,
                border: `1px solid ${CLR[neededShape]?.fg || '#000'}55`,
                color: CLR[neededShape]?.fg || '#fff',
                fontSize: 8,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {SYM[neededShape]} {neededShape}
            </div>
          )}
          {fx?.type === 'pick2' && (
            <div
              style={{
                background: '#dc262622',
                border: '1px solid #dc262655',
                color: '#f87171',
                fontSize: 8,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 12,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              +{fx.count} pending
            </div>
          )}
        </div>

        {/* Market Deck */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Market</div>
          <button
            onClick={handleDraw}
            disabled={!isMyTurn}
            style={{
              width: 62,
              height: 90,
              borderRadius: 8,
              border: 'none',
              cursor: isMyTurn ? 'pointer' : 'default',
              background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)',
              boxShadow: isMyTurn
                ? '0 0 0 3px #fbbf2466, 0 4px 16px rgba(0,0,0,0.45)'
                : '0 4px 12px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: !isMyTurn ? 0.65 : 1,
              transition: 'all 0.15s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 6, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4 }} />
            <div style={{ position: 'absolute', inset: 10, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2 }} />
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20, fontWeight: 900, transform: 'rotate(45deg)' }}>W</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {fx?.type === 'pick2' ? `Draw ${fx.count}` : 'Draw'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7 }}>{drawCount} left</div>
          </button>
        </div>

        {/* Action Logs */}
        <div
          style={{
            width: 130,
            height: 100,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            padding: '6px 8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              fontSize: 7,
              color: 'rgba(255,255,255,0.25)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: 2,
              marginBottom: 4,
              flexShrink: 0,
            }}
          >
            Match Logs
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {logs.slice().reverse().map((l: string, idx: number) => (
              <div
                key={idx}
                style={{
                  fontSize: 8,
                  fontFamily: 'monospace',
                  color: idx === 0 ? '#fbbf24' : 'rgba(255,255,255,0.35)',
                  lineHeight: 1.3,
                  fontWeight: idx === 0 ? 700 : 400,
                }}
              >
                {formatLog(l)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Player Hand (Bottom) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {isSpectator ? `${player1Username || 'Player 1'} Hand` : 'Your Hand'} ({playerHand.length} cards)
        </div>
        <div style={{ position: 'relative', width: '100%', height: 110, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {playerHand.map((card: any, i: number) => {
            const total = playerHand.length;
            const { rotate, translateY, zIndex, translateX } = getFanProps(i, total, true);
            const spread = Math.max(total - 1, 0);
            const offsetX = spread === 0 ? 0 : (i - spread / 2) * (total > 8 ? 24 : 32);
            const isPlayable = isMyTurn && canPlay(card, topCard, neededShape, fx);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: `translateX(calc(-50% + ${offsetX + translateX}px)) rotate(${rotate}deg) translateY(${translateY + (isPlayable ? -8 : 0)}px)`,
                  zIndex: zIndex + 1,
                  transition: 'transform 0.15s',
                }}
              >
                <CardFace
                  card={card}
                  playable={isMyTurn ? isPlayable : undefined}
                  onClick={() => handlePlayCard(i)}
                  disabled={!isMyTurn}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Whot Shape Picker Overlay ── */}
      {showShapeModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#1a1a2e',
              border: '2px solid #fbbf24',
              borderRadius: 20,
              padding: 16,
              maxWidth: 260,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(251,191,36,0.2)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>🃏</div>
            <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
              Call Your Shape!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Choose what opponent must play next
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {SHAPES.map((shape) => {
                const c = CLR[shape];
                return (
                  <button
                    key={shape}
                    onClick={() => handleSelectShape(shape)}
                    style={{
                      background: '#fff',
                      border: `2px solid ${c.fg}`,
                      borderRadius: 8,
                      padding: '8px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'transform 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <span style={{ fontSize: 20, color: c.fg }}>{SYM[shape]}</span>
                    <span style={{ fontSize: 8, fontWeight: 900, color: c.fg, textTransform: 'uppercase', letterSpacing: 0.5 }}>{shape}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setShowShapeModal(false);
                setPendingIdx(null);
              }}
              style={{
                width: '100%',
                padding: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.35)',
                fontSize: 9,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
