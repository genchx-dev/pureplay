import { Clock, Coins, Flame, Trophy, Users } from 'lucide-react';
import { type PrizeDistribution } from '../../types/tournament.types';

interface TournamentHeroProps {
  title: string;
  description: string;
  startsIn: string;
  entryFee: number;
  joinedUsers: number;
  maxParticipants: number;
  totalPrize: number;
  prizes: PrizeDistribution[];
  gameImage: string;
  onEnter: () => void;
}

export const TournamentHero = ({
  title,
  description,
  startsIn,
  entryFee,
  joinedUsers,
  maxParticipants,
  totalPrize,
  prizes,
  gameImage,
  onEnter,
}: TournamentHeroProps) => {
  const spotsLeft = Math.max(0, maxParticipants - joinedUsers);

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-zinc-900 to-black p-5 shadow-xl shadow-primary/5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-zinc-900">
          <img src={gameImage} alt="" className="h-full w-full object-contain p-1.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-red-300">
            <Flame size={12} />
            Main Event
          </div>
          <h2 className="text-xl font-black uppercase tracking-wide text-white md:text-2xl">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-[0.82fr_1.18fr] gap-4">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <Clock size={12} />
              Countdown
            </div>
            <div className="text-2xl font-black text-primary">{startsIn}</div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <Users size={12} />
              Players
            </div>
            <div className="text-lg font-black text-white">{joinedUsers}/{maxParticipants}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">{spotsLeft} slots left</div>
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <Coins size={12} />
              Entry
            </div>
            <div className="text-lg font-black text-white">NGN {entryFee.toLocaleString()}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
              <Trophy size={12} />
              Prize Pool
            </div>
            <div className="text-2xl font-black text-primary md:text-3xl">NGN {totalPrize.toLocaleString()}</div>
          </div>

          <div className="space-y-2">
            {prizes.slice(0, 5).map((prize, index) => (
              <div
                key={prize.rank}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-2 ${
                  index === 0
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-zinc-800 bg-zinc-950/80'
                }`}
              >
                <span className="min-w-0 truncate text-[11px] font-black uppercase tracking-widest text-zinc-400">
                  {index + 1}. {prize.rank.replace(' PLACE', '')}
                </span>
                <span className={`shrink-0 text-xs font-black ${index === 0 ? 'text-primary' : 'text-zinc-200'}`}>
                  NGN {prize.prize.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onEnter}
        className="mt-5 w-full rounded-xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01]"
      >
        Join Tournament
      </button>
    </section>
  );
};
