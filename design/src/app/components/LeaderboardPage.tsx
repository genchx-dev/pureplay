import { Trophy, TrendingUp, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const topPlayers = [
    { rank: 1, name: 'QuantumKing', wins: 245, winRate: 87.5, earnings: 45200 },
    { rank: 2, name: 'ShadowMaster', wins: 232, winRate: 85.2, earnings: 41800 },
    { rank: 3, name: 'ProGamerX', wins: 218, winRate: 83.1, earnings: 38500 },
    { rank: 4, name: 'DragonSlayer', wins: 205, winRate: 81.7, earnings: 35200 },
    { rank: 5, name: 'NinjaWarrior', wins: 198, winRate: 80.3, earnings: 32800 },
    { rank: 6, name: 'MasterMind', wins: 187, winRate: 78.9, earnings: 29400 },
    { rank: 7, name: 'SpeedDemon', wins: 175, winRate: 77.2, earnings: 26700 },
    { rank: 8, name: 'EliteGamer', wins: 168, winRate: 75.8, earnings: 24500 },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-amber-600 to-amber-700';
    return 'from-zinc-700 to-zinc-800';
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <Trophy size={20} />;
    return <Award size={20} />;
  };

  return (
    <div className="px-6 pb-24 pt-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp size={24} className="text-[#D4AF37]" />
          <h1 className="text-2xl font-bold text-white">Top Players</h1>
        </div>
        <p className="text-zinc-400 text-sm">Global Rankings - May 2026</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-2 mb-6">
        {/* 2nd Place */}
        <div className="flex-1 text-center">
          <div className="bg-gradient-to-br from-gray-300 to-gray-400 w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center border-4 border-gray-200">
            <span className="text-2xl font-bold text-zinc-800">2</span>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-gray-400/30">
            <div className="text-white font-semibold text-sm mb-1">{topPlayers[1].name}</div>
            <div className="text-gray-300 text-xs font-bold">₦{topPlayers[1].earnings.toLocaleString()}</div>
          </div>
        </div>

        {/* 1st Place */}
        <div className="flex-1 text-center -mt-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center border-4 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/50">
            <Trophy size={32} className="text-black" />
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-lg p-3 border-2 border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/20">
            <div className="text-[#D4AF37] font-bold mb-1">{topPlayers[0].name}</div>
            <div className="text-[#D4AF37] text-xs font-bold">₦{topPlayers[0].earnings.toLocaleString()}</div>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="flex-1 text-center">
          <div className="bg-gradient-to-br from-amber-600 to-amber-700 w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center border-4 border-amber-500">
            <span className="text-2xl font-bold text-white">3</span>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-amber-600/30">
            <div className="text-white font-semibold text-sm mb-1">{topPlayers[2].name}</div>
            <div className="text-amber-400 text-xs font-bold">₦{topPlayers[2].earnings.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Rankings List */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">All Rankings</h2>
        </div>

        <div className="space-y-2">
          {topPlayers.map((player) => (
            <div
              key={player.rank}
              className={`rounded-xl p-4 border ${
                player.rank <= 3
                  ? 'bg-gradient-to-r from-zinc-900 to-black border-[#D4AF37]/30'
                  : 'bg-zinc-900/30 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${getRankColor(
                    player.rank
                  )} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  {player.rank <= 3 ? (
                    getRankIcon(player.rank)
                  ) : (
                    <span className="font-bold text-white">#{player.rank}</span>
                  )}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold mb-1">{player.name}</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-zinc-400">
                      {player.wins} wins
                    </span>
                    <span className="text-[#D4AF37]">
                      {player.winRate}% WR
                    </span>
                  </div>
                </div>

                {/* Earnings */}
                <div className="text-right">
                  <div className="text-[#D4AF37] font-bold">
                    ₦{player.earnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-400">earned</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your Rank */}
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-xl p-4 border-2 border-[#D4AF37]/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-zinc-400 text-sm mb-1">Your Rank</div>
            <div className="text-white font-bold text-lg">#42</div>
          </div>
          <button className="px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#E5C158] transition-colors">
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}
