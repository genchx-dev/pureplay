import { Trophy, TrendingUp, Medal, Zap } from 'lucide-react';

const TIER_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Grandmaster: { label: 'Grandmaster', color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  Diamond:     { label: 'Diamond',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30' },
  Gold:        { label: 'Gold',        color: 'text-primary',    bg: 'bg-primary/10',    border: 'border-primary/30' },
  Silver:      { label: 'Silver',      color: 'text-zinc-300',   bg: 'bg-zinc-700/30',   border: 'border-zinc-600/40' },
  Bronze:      { label: 'Bronze',      color: 'text-amber-600',  bg: 'bg-amber-900/20',  border: 'border-amber-700/30' },
};

const players = [
  { rank: 1,  name: 'QuantumKing',   tier: 'Grandmaster', wins: 245, losses: 35,  earnings: 45200 },
  { rank: 2,  name: 'ShadowMaster',  tier: 'Diamond',     wins: 232, losses: 40,  earnings: 41800 },
  { rank: 3,  name: 'ProGamerX',     tier: 'Gold',        wins: 218, losses: 42,  earnings: 38500 },
  { rank: 4,  name: 'NightOwl',      tier: 'Gold',        wins: 195, losses: 55,  earnings: 31200 },
  { rank: 5,  name: 'CryptoChamp',   tier: 'Gold',        wins: 187, losses: 63,  earnings: 28900 },
  { rank: 6,  name: 'BlitzKing',     tier: 'Silver',      wins: 162, losses: 72,  earnings: 22400 },
  { rank: 7,  name: 'TacticsGod',    tier: 'Silver',      wins: 148, losses: 80,  earnings: 19700 },
  { rank: 8,  name: 'Dominator99',   tier: 'Bronze',      wins: 121, losses: 95,  earnings: 14100 },
  { rank: 9,  name: 'FlashPoint',    tier: 'Bronze',      wins: 109, losses: 101, earnings: 11600 },
  { rank: 10, name: 'XcelPlayer',    tier: 'Bronze',      wins: 98,  losses: 110, earnings: 9800  },
];

const winRate = (wins: number, losses: number) =>
  Math.round((wins / (wins + losses)) * 100);

const podiumOrder = [players[1], players[0], players[2]]; // 2nd, 1st, 3rd
const podiumHeights = ['h-24', 'h-32', 'h-20'];
const podiumLabels  = ['2nd', '1st', '3rd'];
const podiumRings   = ['ring-2 ring-zinc-400', 'ring-4 ring-primary shadow-[0_0_24px_rgba(255,204,51,0.4)]', 'ring-2 ring-amber-600'];
const podiumAvatarBg = ['bg-zinc-400', 'bg-primary', 'bg-amber-700'];
const podiumTextCol = ['text-zinc-300', 'text-primary', 'text-amber-600'];

export const LeaderboardPage = () => {
  return (
    <div className="px-4 pb-24 pt-6 space-y-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Leaderboard</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Rankings · May 2026</p>
        </div>
      </div>

      {/* Podium */}
      <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl border border-zinc-800 p-6">
        <div className="flex items-end justify-center gap-3">
          {podiumOrder.map((player, i) => {
            const tier = TIER_STYLES[player.tier] ?? TIER_STYLES.Bronze;
            return (
              <div key={player.rank} className="flex flex-col items-center gap-2 flex-1">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full ${podiumAvatarBg[i]} ${podiumRings[i]} flex items-center justify-center`}>
                  {i === 1
                    ? <Trophy size={24} className="text-black" />
                    : <span className="text-lg font-black text-black">{podiumLabels[i][0]}</span>
                  }
                </div>
                {/* Name + tier */}
                <div className="text-center">
                  <div className="text-xs font-black text-foreground truncate max-w-[80px]">{player.name}</div>
                  <div className={`text-[9px] font-bold uppercase tracking-tighter ${tier.color}`}>{player.tier}</div>
                </div>
                {/* Podium block */}
                <div className={`w-full ${podiumHeights[i]} rounded-t-2xl flex flex-col items-center justify-start pt-2 gap-1 ${i === 1 ? 'bg-primary/15 border border-primary/30' : 'bg-zinc-800/60 border border-zinc-700/40'}`}>
                  <span className={`text-lg font-black ${podiumTextCol[i]}`}>{podiumLabels[i]}</span>
                  <span className="text-[10px] font-bold text-zinc-400">NGN {player.earnings.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full ranked table */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Medal size={14} className="text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Full Rankings</h2>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4rem_5rem] gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">#</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Player</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">W/L</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">Rate</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">Earnings</div>
          </div>

          {players.map((player, idx) => {
            const tier = TIER_STYLES[player.tier] ?? TIER_STYLES.Bronze;
            const rate = winRate(player.wins, player.losses);
            const isTop3 = player.rank <= 3;
            return (
              <div
                key={player.rank}
                className={`grid grid-cols-[2.5rem_1fr_4.5rem_4rem_5rem] gap-2 items-center px-4 py-3.5 transition-colors hover:bg-white/[0.03] ${idx < players.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
              >
                {/* Rank */}
                <div className={`text-sm font-black ${isTop3 ? 'text-primary' : 'text-zinc-600'}`}>
                  {player.rank <= 3
                    ? ['🥇', '🥈', '🥉'][player.rank - 1]
                    : player.rank
                  }
                </div>

                {/* Player + tier */}
                <div className="flex flex-col min-w-0">
                  <div className="text-sm font-black text-foreground truncate">{player.name}</div>
                  <div className={`inline-flex w-fit items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${tier.bg} ${tier.color} border ${tier.border}`}>
                    <Zap size={7} />
                    {player.tier}
                  </div>
                </div>

                {/* Wins / Losses */}
                <div className="text-center">
                  <span className="text-xs font-black text-green-500">{player.wins}</span>
                  <span className="text-zinc-600 text-xs font-bold"> / </span>
                  <span className="text-xs font-black text-red-500">{player.losses}</span>
                </div>

                {/* Win rate bar */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-zinc-400">{rate}%</span>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>

                {/* Earnings */}
                <div className="text-right text-xs font-black text-primary">
                  NGN {player.earnings.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
