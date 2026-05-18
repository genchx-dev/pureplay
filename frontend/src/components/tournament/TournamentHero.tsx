import { type PrizeDistribution } from '../../types/tournament.types';

interface TournamentHeroProps {
  title: string;
  description: string;
  startsIn: string;
  entryFee: number;
  joinedUsers: number;
  totalPrize: number;
  prizes: PrizeDistribution[];
  onEnter: () => void;
}

export const TournamentHero = ({
  title,
  description,
  startsIn,
  entryFee,
  joinedUsers,
  totalPrize,
  prizes,
  onEnter
}: TournamentHeroProps) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-5 border border-primary/20 shadow-xl shadow-primary/5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wide text-white">{title}</h2>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">{description}</p>
        </div>
        <button
          onClick={onEnter}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-black transition-transform hover:scale-[1.02]"
        >
          Enter ₦{entryFee.toLocaleString()}
        </button>
      </div>

      <div className="flex gap-4">
        {/* Left Side */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="text-[10px] text-zinc-400 mb-1 uppercase font-bold tracking-widest">Countdown Timer</div>
            <div className="text-2xl font-bold text-primary">{startsIn}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 mb-1 uppercase font-bold tracking-widest">Participants No.</div>
            <div className="text-xl font-semibold text-white">{joinedUsers}</div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1">
          <div className="text-[10px] text-zinc-400 mb-2 uppercase font-bold tracking-widest">Pot Prize</div>
          <div className="mb-2 text-xl font-black text-primary">₦{totalPrize.toLocaleString()}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gradient-to-r from-primary/20 to-transparent rounded-lg px-3 py-2 border border-primary/30">
              <span className="text-xs text-zinc-300">1st</span>
              <span className="text-sm font-bold text-primary">₦{prizes[0]?.prize.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700">
              <span className="text-xs text-zinc-400">2nd</span>
              <span className="text-sm font-semibold text-zinc-300">₦{prizes[1]?.prize.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center justify-between bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700">
              <span className="text-xs text-zinc-400">3rd</span>
              <span className="text-sm font-semibold text-zinc-400">₦{prizes[2]?.prize.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
