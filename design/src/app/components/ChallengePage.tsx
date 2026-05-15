import { Swords, Clock } from 'lucide-react';

export default function ChallengePage() {
  const activeChallenges = [
    { id: 1, opponent: 'ShadowKing', game: 'Speed Chess', stake: 50, timeLeft: '15:30' },
    { id: 2, opponent: 'ProGamer99', game: 'Card Master', stake: 100, timeLeft: '08:45' },
  ];

  const availableChallenges = [
    { id: 3, player: 'DragonSlayer', game: 'Speed Chess', stake: 75 },
    { id: 4, player: 'NinjaWarrior', game: 'Puzzle Rush', stake: 30 },
    { id: 5, player: 'MasterMind', game: 'Card Master', stake: 150 },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6">
      {/* Create Challenge Button */}
      <button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C4A037] text-black font-bold py-4 rounded-xl hover:from-[#E5C158] hover:to-[#D4AF37] transition-all shadow-lg shadow-[#D4AF37]/20">
        <div className="flex items-center justify-center gap-2">
          <Swords size={24} />
          <span>Create New Challenge</span>
        </div>
      </button>

      {/* Active Challenges */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">Active Challenges</h2>
          <span className="ml-auto bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-full">
            {activeChallenges.length}
          </span>
        </div>

        <div className="space-y-3">
          {activeChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center border-2 border-[#D4AF37]/50">
                    <Swords size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{challenge.opponent}</div>
                    <div className="text-xs text-zinc-400">{challenge.game}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] font-bold">
                    ₦{challenge.stake}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-1 text-zinc-400 text-sm">
                  <Clock size={14} />
                  <span>{challenge.timeLeft}</span>
                </div>
                <button className="px-4 py-1.5 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#E5C158] transition-colors text-sm">
                  Join Battle
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Challenges */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">Open Challenges</h2>
        </div>

        <div className="space-y-3">
          {availableChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 hover:border-[#D4AF37]/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Swords size={18} className="text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{challenge.player}</div>
                    <div className="text-xs text-zinc-400">{challenge.game}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[#D4AF37] font-bold">
                    ₦{challenge.stake}
                  </div>
                  <button className="px-3 py-1.5 border-2 border-[#D4AF37] text-[#D4AF37] font-semibold rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all text-sm">
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
