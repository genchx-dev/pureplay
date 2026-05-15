import { Trophy, Users } from 'lucide-react';
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
    <div className="relative group overflow-hidden bg-zinc-900 rounded-[2rem] border border-primary/20 shadow-2xl">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>

      <div className="relative p-6 md:p-10 flex flex-col lg:flex-row gap-8 items-center">
        {/* Left Side: Info & Countdown */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <Trophy size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Tournament</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-shrikhand text-foreground tracking-wide uppercase">{title}</h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-md mx-auto lg:mx-0 font-medium">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 lg:justify-start justify-center">
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Starts In</div>
              <div className="text-3xl font-mono font-black text-primary flex gap-2">
                {startsIn.split(':').map((unit, i) => (
                  <span key={i}>
                    {unit}{i < 2 && <span className="text-zinc-700 ml-2">:</span>}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800 hidden sm:block"></div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Entry Fee</div>
              <div className="text-2xl font-black text-primary">₦{entryFee.toLocaleString()}</div>
            </div>
            <div className="w-px h-10 bg-zinc-800 hidden sm:block"></div>
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Joined Users</div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Users size={20} className="text-primary" />
                <span className="text-2xl font-black">{joinedUsers}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onEnter}
            className="w-full sm:w-auto bg-primary text-black px-12 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
          >
            Enter Arena
          </button>
        </div>

        {/* Right Side: Prize Pool Summary */}
        <div className="w-full lg:w-80 bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-inner">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Prizes</h3>
             <span className="text-primary font-black text-xl">₦{totalPrize.toLocaleString()}</span>
          </div>

          <div className="space-y-3">
            {prizes.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-3.5 rounded-2xl border border-white/5 ${p.bg}`}>
                <span className={`text-[10px] font-black tracking-tighter ${p.color}`}>{p.rank}</span>
                <span className="font-bold text-sm text-foreground">₦{p.prize.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
