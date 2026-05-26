import { X, Swords, Trophy, TrendingUp } from 'lucide-react';
import { getTierByXp } from '../../../utils/tier';
import { getTierBadgeUrl } from './LeaderboardPage';
import type { LeaderboardPlayer } from '../../../types/ranking.types';

interface PlayerProfileModalProps {
  player: LeaderboardPlayer;
  isMe: boolean;
  onClose: () => void;
  onChallenge: () => void;
}

export const PlayerProfileModal = ({ player, isMe, onClose, onChallenge }: PlayerProfileModalProps) => {
  const tierConfig = getTierByXp(player.xp);
  const badgeUrl = getTierBadgeUrl(tierConfig.name);
  const total = player.wins + player.losses + player.draws;
  const winRate = total > 0 ? Math.round((player.wins / total) * 100) : 0;

  const stats = [
    { label: 'Wins',   value: player.wins,   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Losses', value: player.losses, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Draws',  value: player.draws,  color: 'text-zinc-400',   bg: 'bg-zinc-800/60 border-zinc-700/30' },
    { label: 'Win %',  value: `${winRate}%`, color: 'text-primary',    bg: 'bg-primary/10 border-primary/20' },
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Card — slides up on mobile, centred on desktop */}
      <div
        className="w-full sm:max-w-sm bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Player Profile
          </span>
          <button
            onClick={onClose}
            aria-label="Close profile"
            className="p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 flex items-center justify-center mb-4 relative">
            <img
              src={badgeUrl}
              alt={tierConfig.name}
              loading="lazy"
              decoding="async"
              className="w-32 h-32 object-contain"
            />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">{player.username}</h2>

          {/* Tier pill */}
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${tierConfig.bg} ${tierConfig.color} border ${tierConfig.border}`}>
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-current opacity-80" />
            {tierConfig.name} Tier
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs font-bold text-zinc-500">
            <span className="flex items-center gap-1">
              <Trophy size={11} className="text-primary" />
              Rank #{player.rank}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={11} className="text-primary" />
              {player.xp.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {stats.map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-3 text-center ${bg}`}>
              <div className={`text-lg font-black ${color}`}>{value}</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</div>
            </div>
          ))}
        </div>

        {/* Win rate bar */}
        <div className="mb-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3">
          <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase mb-2">
            <span>Win Rate</span>
            <span className="text-primary">{winRate}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700"
              style={{ width: `${winRate}%` }}
            />
          </div>
        </div>

        {/* Earnings */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-3 mb-6 text-center">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Earnings</div>
          <div className="text-xl font-black text-primary font-mono">
            NGN {player.earnings.toLocaleString()}
          </div>
        </div>

        {/* CTA */}
        {isMe ? (
          <div className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest py-2">
            This is your profile
          </div>
        ) : (
          <button
            id={`challenge-btn-${player.username}`}
            onClick={onChallenge}
            className="w-full bg-primary text-black font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Swords size={18} />
            Challenge {player.username}
          </button>
        )}
      </div>
    </div>
  );
};
