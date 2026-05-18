import { Trophy, TrendingUp } from 'lucide-react';

export const LeaderboardPage = () => {
  const topPlayers = [
    { rank: 1, name: 'QuantumKing', wins: 245, winRate: 87.5, earnings: 45200 },
    { rank: 2, name: 'ShadowMaster', wins: 232, winRate: 85.2, earnings: 41800 },
    { rank: 3, name: 'ProGamerX', wins: 218, winRate: 83.1, earnings: 38500 },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6 text-center">
      <div className="flex flex-col items-center justify-center gap-2 mb-6">
        <TrendingUp size={32} className="text-primary" />
        <h1 className="text-2xl font-bold">Top Players</h1>
        <p className="text-zinc-400 text-sm">Global Rankings - May 2026</p>
      </div>

      <div className="flex items-end justify-center gap-2 mb-10">
        <div className="flex-1">
          <div className="w-16 h-16 rounded-full bg-zinc-400 mx-auto mb-2 flex items-center justify-center border-4 border-zinc-300">
            <span className="text-xl font-bold text-black">2</span>
          </div>
          <div className="bg-card rounded-lg p-2 border border-zinc-800">
            <div className="text-xs font-semibold">{topPlayers[1].name}</div>
            <div className="text-primary text-[10px] font-bold">₦{topPlayers[1].earnings.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex-1 -mt-6">
          <div className="w-20 h-20 rounded-full bg-primary mx-auto mb-2 flex items-center justify-center border-4 border-primary shadow-lg shadow-primary/50">
            <Trophy size={32} className="text-black" />
          </div>
          <div className="bg-card rounded-lg p-2 border-2 border-primary shadow-lg shadow-primary/20">
            <div className="text-primary font-bold text-sm">{topPlayers[0].name}</div>
            <div className="text-primary text-xs font-bold">₦{topPlayers[0].earnings.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="w-16 h-16 rounded-full bg-amber-700 mx-auto mb-2 flex items-center justify-center border-4 border-amber-600">
            <span className="text-xl font-bold">3</span>
          </div>
          <div className="bg-card rounded-lg p-2 border border-zinc-800">
            <div className="text-xs font-semibold">{topPlayers[2].name}</div>
            <div className="text-primary text-[10px] font-bold">₦{topPlayers[2].earnings.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
