import { Trophy, Users, Clock, Calendar } from 'lucide-react';

export default function TournamentPage() {
  const liveTournaments = [
    {
      id: 1,
      name: 'Speed Chess Championship',
      game: 'Speed Chess',
      participants: 64,
      maxParticipants: 128,
      prize: 10000,
      entryFee: 50,
      timeLeft: '2h 15m',
      status: 'live',
    },
  ];

  const upcomingTournaments = [
    {
      id: 2,
      name: 'Card Master Pro League',
      game: 'Card Master',
      participants: 42,
      maxParticipants: 64,
      prize: 5000,
      entryFee: 25,
      startTime: 'Tomorrow 8:00 PM',
    },
    {
      id: 3,
      name: 'Puzzle Rush Elite',
      game: 'Puzzle Rush',
      participants: 28,
      maxParticipants: 32,
      prize: 3000,
      entryFee: 30,
      startTime: 'May 14, 6:00 PM',
    },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6">
      {/* Live Tournaments */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full animate-pulse" />
          <h2 className="text-lg font-semibold text-white">Live Now</h2>
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            LIVE
          </span>
        </div>

        {liveTournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-5 border-2 border-red-500/50 shadow-xl shadow-red-500/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">{tournament.name}</h3>
                <p className="text-zinc-400 text-sm">{tournament.game}</p>
              </div>
              <div className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                <Clock size={12} />
                <span>{tournament.timeLeft}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-xs text-zinc-400 mb-1">Prize Pool</div>
                <div className="text-[#D4AF37] font-bold text-lg">
                  ₦{tournament.prize.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <div className="text-xs text-zinc-400 mb-1">Participants</div>
                <div className="flex items-center gap-1 text-white font-bold text-lg">
                  <Users size={18} />
                  <span>
                    {tournament.participants}/{tournament.maxParticipants}
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all">
              Spectate Tournament
            </button>
          </div>
        ))}
      </section>

      {/* Upcoming Tournaments */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#C4A037] rounded-full" />
          <h2 className="text-lg font-semibold text-white">Upcoming Tournaments</h2>
        </div>

        <div className="space-y-4">
          {upcomingTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-5 border border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5"
            >
              <div className="mb-4">
                <h3 className="text-white font-bold text-lg mb-1">{tournament.name}</h3>
                <p className="text-zinc-400 text-sm">{tournament.game}</p>
              </div>

              <div className="flex items-center gap-2 mb-4 text-zinc-300 text-sm">
                <Calendar size={14} className="text-[#D4AF37]" />
                <span>{tournament.startTime}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-400 mb-1">Entry</div>
                  <div className="text-[#D4AF37] font-bold">₦{tournament.entryFee}</div>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-400 mb-1">Prize</div>
                  <div className="text-[#D4AF37] font-bold">₦{tournament.prize.toLocaleString()}</div>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-2 text-center">
                  <div className="text-xs text-zinc-400 mb-1">Slots</div>
                  <div className="text-white font-bold">
                    {tournament.participants}/{tournament.maxParticipants}
                  </div>
                </div>
              </div>

              <button className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded-xl hover:bg-[#E5C158] transition-all">
                Enter Tournament
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
