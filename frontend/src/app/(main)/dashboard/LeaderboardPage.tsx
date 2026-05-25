import { useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Medal, 
  Loader2
} from 'lucide-react';
import { useRankingStore } from '../../../store/ranking.store';
import { useAuthStore } from '../../../store/auth.store';
import { getTierByXp, TIERS } from '../../../utils/tier';

// Import SVG Badges
import woodIcon from '../../../assets/games/tiericon/wood.svg';
import copperIcon from '../../../assets/games/tiericon/copper.svg';
import bronzeIcon from '../../../assets/games/tiericon/bronze.svg';
import ironIcon from '../../../assets/games/tiericon/iron.svg';
import silverIcon from '../../../assets/games/tiericon/silver.svg';
import goldIcon from '../../../assets/games/tiericon/gold.svg';
import diamondIcon from '../../../assets/games/tiericon/diamond.svg';
import platinumIcon from '../../../assets/games/tiericon/platinum.svg';
import titaniumIcon from '../../../assets/games/tiericon/titanium.svg';
import rubyIcon from '../../../assets/games/tiericon/ruby.svg';

export const TIER_BADGES: Record<string, string> = {
  wood: woodIcon,
  copper: copperIcon,
  bronze: bronzeIcon,
  iron: ironIcon,
  silver: silverIcon,
  gold: goldIcon,
  diamond: diamondIcon,
  platinum: platinumIcon,
  titanium: titaniumIcon,
  ruby: rubyIcon,
};

export const TierBadge = ({ tierName, xp }: { tierName?: string; xp?: number }) => {
  const tierConfig = xp !== undefined 
    ? getTierByXp(xp) 
    : TIERS.find(t => t.name.toLowerCase() === tierName?.toLowerCase()) || TIERS[0];
    
  const badgeUrl = TIER_BADGES[tierConfig.name.toLowerCase()] || bronzeIcon;
  
  return (
    <div className={`inline-flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${tierConfig.bg} ${tierConfig.color} border ${tierConfig.border}`}>
      <img src={badgeUrl} alt={tierConfig.name} className="w-3.5 h-3.5 object-contain" />
      <span>{tierConfig.name}</span>
    </div>
  );
};

const winRate = (wins: number, losses: number, draws = 0) => {
  const total = wins + losses + draws;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
};

export const LeaderboardPage = () => {
  const { leaderboard, loading, fetchLeaderboard } = useRankingStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const top3 = leaderboard.slice(0, 3);
  const top10 = leaderboard.slice(0, 10);
  
  // Find current user's entry
  const userEntry = leaderboard.find(p => p.username === user?.username);
  const showUserRow = userEntry && userEntry.rank > 10;

  // Podium arrangement: [2nd, 1st, 3rd]
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const podiumData = [
    ...(second ? [{ player: second, label: '2nd', height: 'h-24', ring: 'ring-2 ring-zinc-500/60', badgeIdx: 1 }] : []),
    ...(first ? [{ player: first, label: '1st', height: 'h-32', ring: 'ring-4 ring-primary shadow-[0_0_24px_rgba(255,204,51,0.3)]', badgeIdx: 0 }] : []),
    ...(third ? [{ player: third, label: '3rd', height: 'h-20', ring: 'ring-2 ring-amber-700/60', badgeIdx: 2 }] : [])
  ];

  if (loading && leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Loading Rankings...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-6 space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Leaderboard</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Rankings · Season 1</p>
          </div>
        </div>
      </div>

      {/* Podium */}
      {podiumData.length > 0 && (
        <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl border border-zinc-800 p-6">
          <div className="flex items-end justify-center gap-3">
            {podiumData.map(({ player, label, height, ring, badgeIdx }) => {
              const badgeUrl = TIER_BADGES[player.tier.toLowerCase()] || bronzeIcon;
              return (
                <div key={player.username} className="flex flex-col items-center gap-2 flex-1">
                  {/* Avatar (Tier SVG Badge) */}
                  <div className={`w-16 h-16 rounded-full bg-zinc-950/80 border border-zinc-850 flex items-center justify-center relative p-1 shadow-lg ${ring}`}>
                    <img src={badgeUrl} alt={player.tier} className="w-11 h-11 object-contain" />
                    {badgeIdx === 0 && (
                      <div className="absolute -top-2 -right-1 bg-primary text-black p-0.5 rounded-full border border-zinc-950 shadow-md">
                        <Trophy size={10} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  {/* Name + tier */}
                  <div className="text-center w-full min-w-0">
                    <div className="text-xs font-black text-foreground truncate px-1">{player.username}</div>
                    <div className="mt-0.5">
                      <TierBadge tierName={player.tier} xp={player.xp} />
                    </div>
                  </div>
                  {/* Podium block */}
                  <div className={`w-full ${height} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 ${badgeIdx === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-zinc-900/60 border border-zinc-800/40'}`}>
                    <span className={`text-sm font-black ${badgeIdx === 0 ? 'text-primary' : badgeIdx === 1 ? 'text-zinc-300' : 'text-amber-600'}`}>{label}</span>
                    <span className="text-[9px] font-black text-zinc-400 font-mono">NGN {player.earnings.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full ranked table */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Medal size={14} className="text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Global Standings</h2>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
          {/* Table header */}
          <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4rem_5rem] gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">#</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Player</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">W/L/D</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">Win %</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">Earnings</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-zinc-800/40">
            {top10.map((player) => {
              const rate = winRate(player.wins, player.losses, player.draws);
              const isTop3 = player.rank <= 3;
              const isMe = user?.username === player.username;
              return (
                <div
                  key={player.username}
                  className={`grid grid-cols-[2.5rem_1fr_4.5rem_4rem_5rem] gap-2 items-center px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${isMe ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white truncate">{player.username}</span>
                      {isMe && <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 border border-primary/20">YOU</span>}
                    </div>
                    <div className="mt-1">
                      <TierBadge tierName={player.tier} xp={player.xp} />
                    </div>
                  </div>

                  {/* Wins / Losses / Draws */}
                  <div className="text-center text-[11px] font-mono">
                    <span className="text-green-500 font-bold">{player.wins}</span>
                    <span className="text-zinc-600 font-medium">/</span>
                    <span className="text-red-500 font-bold">{player.losses}</span>
                    <span className="text-zinc-600 font-medium">/</span>
                    <span className="text-zinc-400 font-bold">{player.draws}</span>
                  </div>

                  {/* Win rate bar */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-zinc-400 font-mono">{rate}%</span>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right text-xs font-black text-primary font-mono">
                    NGN {player.earnings.toLocaleString()}
                  </div>
                </div>
              );
            })}

            {/* Separated user row if user is ranked > 10 */}
            {showUserRow && userEntry && (
              <div className="grid grid-cols-[2.5rem_1fr_4.5rem_4rem_5rem] gap-2 items-center px-4 py-3.5 bg-zinc-950 border-t border-t-zinc-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] border-l-2 border-l-primary">
                {/* Rank */}
                <div className="text-sm font-black text-zinc-400">
                  {userEntry.rank}
                </div>

                {/* Player + tier */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white truncate">{userEntry.username}</span>
                    <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 border border-primary/20">YOU</span>
                  </div>
                  <div className="mt-1">
                    <TierBadge tierName={userEntry.tier} xp={userEntry.xp} />
                  </div>
                </div>

                {/* Wins / Losses / Draws */}
                <div className="text-center text-[11px] font-mono">
                  <span className="text-green-500 font-bold">{userEntry.wins}</span>
                  <span className="text-zinc-600 font-medium">/</span>
                  <span className="text-red-500 font-bold">{userEntry.losses}</span>
                  <span className="text-zinc-600 font-medium">/</span>
                  <span className="text-zinc-400 font-bold">{userEntry.draws}</span>
                </div>

                {/* Win rate bar */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-zinc-400 font-mono">{winRate(userEntry.wins, userEntry.losses, userEntry.draws)}%</span>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${winRate(userEntry.wins, userEntry.losses, userEntry.draws)}%` }}
                    />
                  </div>
                </div>

                {/* Earnings */}
                <div className="text-right text-xs font-black text-primary font-mono">
                  NGN {userEntry.earnings.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
