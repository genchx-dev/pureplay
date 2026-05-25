import { useEffect, useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Medal, 
  Loader2,
  Search,
  X
} from 'lucide-react';
import { useRankingStore } from '../../../store/ranking.store';
import { useAuthStore } from '../../../store/auth.store';
import { getTierByXp, TIERS } from '../../../utils/tier';
import type { LeaderboardPlayer } from '../../../types/ranking.types';
import { PlayerProfileModal } from './PlayerProfileModal';

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

/** Renders a tier badge SVG with paint containment to avoid scroll jank */
const BadgeImg = ({ src, alt, size = 14 }: { src: string; alt: string; size?: number }) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      overflow: 'hidden',
      contain: 'strict',
      flexShrink: 0,
    }}
  >
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  </span>
);

/**
 * TierBadge — pure CSS, no image loading.
 * Uses bg-current so the dot inherits the tier's text color automatically.
 * This avoids rendering multi-MB SVGs in every table row, which caused scroll lag.
 */
export const TierBadge = ({ tierName, xp }: { tierName?: string; xp?: number }) => {
  const tierConfig = xp !== undefined
    ? getTierByXp(xp)
    : TIERS.find(t => t.name.toLowerCase() === tierName?.toLowerCase()) || TIERS[0];

  return (
    <div className={`inline-flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${tierConfig.bg} ${tierConfig.color} border ${tierConfig.border}`}>
      {/* Colored dot — inherits tier text color via bg-current, zero SVG overhead */}
      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-current opacity-80" />
      <span>{tierConfig.name}</span>
    </div>
  );
};

const winRate = (wins: number, losses: number, draws = 0) => {
  const total = wins + losses + draws;
  return total > 0 ? Math.round((wins / total) * 100) : 0;
};

// ── Shared row grid classes ──────────────────────────────────────────────────
// Mobile:  rank | player | win% | earnings  (4 cols)
// Desktop: rank | player | W/L/D | win% | earnings  (5 cols)
const ROW_GRID = 'grid grid-cols-[2rem_1fr_3rem_5rem] sm:grid-cols-[2.5rem_1fr_4.5rem_4rem_5.5rem] gap-2 items-center px-3 sm:px-4';
const HEADER_GRID = `${ROW_GRID} py-2 border-b border-zinc-800 bg-zinc-900/50`;

export const LeaderboardPage = ({ onChallenge }: { onChallenge?: () => void }) => {
  const { 
    leaderboard, 
    loading, 
    fetchLeaderboard,
    searchResults,
    searchLoading,
    searchPlayers,
    clearSearch
  } = useRankingStore();
  const { user } = useAuthStore();
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!query.trim()) {
      clearSearch();
      return;
    }
    const timer = setTimeout(() => {
      searchPlayers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchPlayers, clearSearch]);

  const top3 = leaderboard.slice(0, 3);
  const top10 = leaderboard.slice(0, 10);

  const userEntry = leaderboard.find(p => p.username === user?.username);
  const showUserRow = userEntry && userEntry.rank > 10;

  // Podium order: 2nd | 1st | 3rd
  const podiumData = [
    ...(top3[1] ? [{ player: top3[1], label: '2nd', height: 'h-20 sm:h-24', ring: 'ring-2 ring-zinc-500/60', badgeIdx: 1 }] : []),
    ...(top3[0] ? [{ player: top3[0], label: '1st', height: 'h-28 sm:h-32', ring: 'ring-4 ring-primary shadow-[0_0_24px_rgba(255,204,51,0.3)]', badgeIdx: 0 }] : []),
    ...(top3[2] ? [{ player: top3[2], label: '3rd', height: 'h-16 sm:h-20', ring: 'ring-2 ring-amber-700/60', badgeIdx: 2 }] : []),
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
    <div className="px-3 sm:px-4 pb-24 pt-6 space-y-6 sm:space-y-8 max-w-2xl mx-auto w-full">
      {/* Player profile modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          isMe={selectedPlayer.username === user?.username}
          onClose={() => setSelectedPlayer(null)}
          onChallenge={() => {
            setSelectedPlayer(null);
            onChallenge?.();
          }}
        />
      )}


      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <TrendingUp size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Leaderboard</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Rankings · Season 1</p>
        </div>
      </div>

      {/* Podium */}
      {podiumData.length > 0 && (
        <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl border border-zinc-800 p-4 sm:p-6">
          <div className="flex items-end justify-center gap-2 sm:gap-3">
            {podiumData.map(({ player, label, height, ring, badgeIdx }) => {
              const badgeUrl = TIER_BADGES[player.tier.toLowerCase()] || bronzeIcon;
              return (
                <div key={player.username} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  {/* Avatar */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-950/80 flex items-center justify-center relative p-1 shadow-lg ${ring}`}
                    style={{ contain: 'layout' }}
                  >
                    <BadgeImg src={badgeUrl} alt={player.tier} size={44} />
                    {badgeIdx === 0 && (
                      <div className="absolute -top-2 -right-1 bg-primary text-black p-0.5 rounded-full border border-zinc-950 shadow-md">
                        <Trophy size={10} strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                  {/* Name + tier */}
                  <div className="text-center w-full min-w-0">
                    <div className="text-xs font-black text-foreground truncate px-1">{player.username}</div>
                    <div className="mt-0.5 flex justify-center">
                      <TierBadge tierName={player.tier} xp={player.xp} />
                    </div>
                  </div>
                  {/* Podium block */}
                  <div className={`w-full ${height} rounded-t-2xl flex flex-col items-center justify-start pt-3 gap-1 ${badgeIdx === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-zinc-900/60 border border-zinc-800/40'}`}>
                    <span className={`text-sm font-black ${badgeIdx === 0 ? 'text-primary' : badgeIdx === 1 ? 'text-zinc-300' : 'text-amber-600'}`}>{label}</span>
                    <span className="text-[9px] font-black text-zinc-400 font-mono truncate px-1">
                      NGN {player.earnings.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standings Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Medal size={14} className="text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Global Standings</h2>
          </div>
          
          {/* Search bar inside leaderboard */}
          <div className="relative w-full sm:w-64 group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-primary transition-colors">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opponent username..."
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-1.5 pl-9 pr-8 text-xs font-semibold placeholder:text-zinc-500 text-white focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/45 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-xl">
          {/* Table header */}
          <div className={HEADER_GRID}>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">#</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Player</div>
            {/* Hidden on mobile */}
            <div className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">W/L/D</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center">Win %</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-right">Earnings</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-800/40">
            {searchLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 bg-zinc-950/20">
                <Loader2 className="animate-spin text-primary" size={24} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Searching players...</span>
              </div>
            ) : query.trim() !== '' && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2 bg-zinc-950/20">
                <span className="text-xl">🔍</span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">No players found</span>
                <span className="text-[10px] font-semibold text-zinc-500">We couldn't find anyone matching "{query}"</span>
              </div>
            ) : (
              (query.trim() !== '' ? searchResults : top10).map((player) => {
                const rate = winRate(player.wins, player.losses, player.draws);
                const isTop3 = player.rank <= 3;
                const isMe = user?.username === player.username;
                return (
                  <div
                    key={player.username}
                    onClick={() => setSelectedPlayer(player)}
                    className={`${ROW_GRID} py-3 transition-colors hover:bg-white/[0.04] cursor-pointer active:bg-white/[0.06] ${isMe ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    {/* Rank */}
                    <div className={`text-sm font-black ${isTop3 ? 'text-primary' : 'text-zinc-600'}`}>
                      {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
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

                    {/* W/L/D — desktop only */}
                    <div className="hidden sm:block text-center text-[11px] font-mono">
                      <span className="text-green-500 font-bold">{player.wins}</span>
                      <span className="text-zinc-600 font-medium">/</span>
                      <span className="text-red-500 font-bold">{player.losses}</span>
                      <span className="text-zinc-600 font-medium">/</span>
                      <span className="text-zinc-400 font-bold">{player.draws}</span>
                    </div>

                    {/* Win % bar — all screens */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black text-zinc-400 font-mono">{rate}%</span>
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${rate}%` }} />
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="text-right text-xs font-black text-primary font-mono">
                      <span className="hidden sm:inline">NGN </span>
                      {player.earnings.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}

            {/* "My Rank" footer row if user is outside top 10 and search is empty */}
            {!query.trim() && showUserRow && userEntry && (
              <div
                onClick={() => setSelectedPlayer(userEntry)}
                className={`${ROW_GRID} py-3 bg-zinc-950 border-t border-t-zinc-700 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] border-l-2 border-l-primary cursor-pointer hover:bg-zinc-900/40 transition-colors`}
              >
                <div className="text-sm font-black text-zinc-400">{userEntry.rank}</div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white truncate">{userEntry.username}</span>
                    <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter shrink-0 border border-primary/20">YOU</span>
                  </div>
                  <div className="mt-1">
                    <TierBadge tierName={userEntry.tier} xp={userEntry.xp} />
                  </div>
                </div>

                <div className="hidden sm:block text-center text-[11px] font-mono">
                  <span className="text-green-500 font-bold">{userEntry.wins}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-red-500 font-bold">{userEntry.losses}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-zinc-400 font-bold">{userEntry.draws}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-zinc-400 font-mono">{winRate(userEntry.wins, userEntry.losses, userEntry.draws)}%</span>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${winRate(userEntry.wins, userEntry.losses, userEntry.draws)}%` }} />
                  </div>
                </div>

                <div className="text-right text-xs font-black text-primary font-mono">
                  <span className="hidden sm:inline">NGN </span>
                  {userEntry.earnings.toLocaleString()}
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
