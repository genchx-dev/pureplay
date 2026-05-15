import { User, Wallet, TrendingUp, Settings, LogOut, Award, Trophy, Target } from 'lucide-react';

export default function MePage() {
  const userStats = {
    name: 'ProGamer2026',
    rank: 42,
    totalWins: 156,
    totalGames: 203,
    winRate: 76.8,
    totalEarnings: 18750,
    balance: 1250,
  };

  const recentMatches = [
    { id: 1, game: 'Speed Chess', result: 'Win', earnings: 100, date: 'Today' },
    { id: 2, game: 'Card Master', result: 'Win', earnings: 75, date: 'Yesterday' },
    { id: 3, game: 'Puzzle Rush', result: 'Loss', earnings: -50, date: 'May 10' },
  ];

  const achievements = [
    { id: 1, title: 'First Victory', icon: Trophy },
    { id: 2, title: '10 Win Streak', icon: Target },
    { id: 3, title: 'Top 100 Player', icon: Award },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-[#D4AF37]/30 shadow-xl shadow-[#D4AF37]/5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#C4A037] rounded-full flex items-center justify-center border-4 border-[#D4AF37]/30">
            <User size={36} className="text-black" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-xl mb-1">{userStats.name}</h2>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-400 text-sm">Global Rank</span>
              <span className="bg-[#D4AF37] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                #{userStats.rank}
              </span>
            </div>
          </div>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Settings size={24} />
          </button>
        </div>

        {/* Balance */}
        <div className="bg-black/50 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-[#D4AF37]" />
              <span className="text-zinc-400 text-sm">Balance</span>
            </div>
            <span className="text-[#D4AF37] font-bold text-xl">₦{userStats.balance}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-[#D4AF37] text-black font-semibold py-2 rounded-lg hover:bg-[#E5C158] transition-colors text-sm">
              Deposit
            </button>
            <button className="flex-1 border-2 border-[#D4AF37] text-[#D4AF37] font-semibold py-2 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all text-sm">
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">Statistics</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Total Games</div>
            <div className="text-white font-bold text-2xl">{userStats.totalGames}</div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Total Wins</div>
            <div className="text-[#D4AF37] font-bold text-2xl">{userStats.totalWins}</div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Win Rate</div>
            <div className="text-white font-bold text-2xl">{userStats.winRate}%</div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
            <div className="text-xs text-zinc-400 mb-1">Total Earnings</div>
            <div className="text-[#D4AF37] font-bold text-2xl">
              ₦{userStats.totalEarnings.toLocaleString()}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">Achievements</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className="flex-shrink-0 w-24 bg-gradient-to-br from-zinc-900 to-black rounded-xl p-4 border border-[#D4AF37]/30 flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                  <Icon size={24} className="text-[#D4AF37]" />
                </div>
                <span className="text-white text-xs text-center font-semibold">
                  {achievement.title}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Matches */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">Recent Matches</h2>
        </div>

        <div className="space-y-2">
          {recentMatches.map((match) => (
            <div
              key={match.id}
              className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">{match.game}</div>
                <div className="text-xs text-zinc-400">{match.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold ${
                    match.result === 'Win' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {match.result}
                </span>
                <span
                  className={`font-bold ${
                    match.earnings > 0 ? 'text-[#D4AF37]' : 'text-red-400'
                  }`}
                >
                  {match.earnings > 0 ? '+' : ''}₦{match.earnings}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logout Button */}
      <button className="w-full bg-zinc-900 text-red-400 font-semibold py-3 rounded-xl border border-zinc-800 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );
}
