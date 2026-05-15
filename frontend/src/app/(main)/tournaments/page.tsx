import { Trophy, Users, Clock, Calendar } from 'lucide-react';

export const TournamentPage = () => {
  const tournaments = [
    { id: 1, name: 'Speed Tic Tac Toe', participants: 64, max: 128, prize: 10000, time: '2h 15m', type: 'LIVE' },
    { id: 2, name: 'Weekend Masters', participants: 42, max: 64, prize: 5000, time: 'Tomorrow', type: 'UPCOMING' },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-red-500 rounded-full animate-pulse" />
          <h2 className="text-lg font-semibold">Live Tournaments</h2>
        </div>

        {tournaments.filter(t => t.type === 'LIVE').map(t => (
          <div key={t.id} className="bg-card rounded-2xl p-5 border-2 border-red-500/50 shadow-xl shadow-red-500/10 mb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{t.name}</h3>
              <div className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                <Clock size={12} /> {t.time}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-zinc-400 uppercase">Prize</div>
                <div className="text-primary font-bold">₦{t.prize.toLocaleString()}</div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-zinc-400 uppercase">Slots</div>
                <div className="font-bold">{t.participants}/{t.max}</div>
              </div>
            </div>
            <button className="w-full bg-red-500 text-white font-bold py-3 rounded-xl">Spectate</button>
          </div>
        ))}
      </section>
    </div>
  );
};
