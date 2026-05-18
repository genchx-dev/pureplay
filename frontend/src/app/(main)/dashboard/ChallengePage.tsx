import { Swords, Clock } from 'lucide-react';

export const ChallengePage = () => {
  const activeChallenges = [
    { id: 1, opponent: 'ShadowKing', game: 'Tic Tac Toe', stake: 50, timeLeft: '15:30' },
    { id: 2, opponent: 'ProGamer99', game: 'Tic Tac Toe', stake: 100, timeLeft: '08:45' },
  ];

  const availableChallenges = [
    { id: 3, player: 'DragonSlayer', game: 'Tic Tac Toe', stake: 75 },
    { id: 4, player: 'NinjaWarrior', game: 'Tic Tac Toe', stake: 30 },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6">
      <button className="w-full bg-primary text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20">
        <div className="flex items-center justify-center gap-2">
          <Swords size={24} />
          <span>Create New Challenge</span>
        </div>
      </button>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-semibold">Active Challenges</h2>
          <span className="ml-auto bg-primary text-black text-xs font-bold px-2 py-1 rounded-full">
            {activeChallenges.length}
          </span>
        </div>

        <div className="space-y-3">
          {activeChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-card rounded-xl p-4 border border-primary/30 shadow-lg shadow-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-primary/50">
                    <Swords size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{challenge.opponent}</div>
                    <div className="text-xs text-zinc-400">{challenge.game}</div>
                  </div>
                </div>
                <div className="text-primary font-bold">₦{challenge.stake}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-1 text-zinc-400 text-sm">
                  <Clock size={14} />
                  <span>{challenge.timeLeft}</span>
                </div>
                <button className="px-4 py-1.5 bg-primary text-black font-semibold rounded-lg text-sm">Join Battle</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-zinc-500 rounded-full" />
          <h2 className="text-lg font-semibold">Available Challenges</h2>
          <span className="ml-auto bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded-full">
            {availableChallenges.length}
          </span>
        </div>

        <div className="space-y-3">
          {availableChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-card rounded-xl p-4 border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700">
                    <Swords size={20} className="text-zinc-400" />
                  </div>
                  <div>
                    <div className="font-semibold">{challenge.player}</div>
                    <div className="text-xs text-zinc-400">{challenge.game}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-primary font-bold">₦{challenge.stake}</div>
                  <button className="px-4 py-1.5 bg-primary text-black font-semibold rounded-lg text-sm">Accept</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
