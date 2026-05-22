import { Clock, Trophy, Users } from 'lucide-react';
import { useTournaments } from '../../../hooks/useTournaments';
import { useAuth } from '../../../hooks/useAuth';

export const TournamentPage = () => {
  const { isAuthenticated } = useAuth();
  const { tournaments, loading, error, joinTournament } = useTournaments(isAuthenticated);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const activeTournaments = tournaments.filter(t => t.status === 'registration_open' || t.status === 'live' || t.status === 'active');
  const upcomingTournaments = tournaments.filter(t => t.status === 'upcoming');

  return (
    <div className="px-6 pb-24 pt-6 space-y-8 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-shrikhand uppercase tracking-widest text-primary">Tournaments</h1>
        <p className="text-zinc-500 text-sm mt-2 font-medium">Join scheduled events, compete for the pot, and climb the ranks.</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm font-bold">
          {error}
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Active Now</h2>
        </div>

        {loading && tournaments.length === 0 && (
          <div className="text-center py-12 text-zinc-500 font-bold uppercase tracking-widest text-xs">
            Scanning for active events...
          </div>
        )}

        {!loading && activeTournaments.length === 0 && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-10 text-center">
            <Trophy className="mx-auto text-zinc-700 mb-4" size={40} />
            <p className="text-zinc-500 font-bold">No active tournaments right now. Check back soon!</p>
          </div>
        )}

        <div className="grid gap-6">
          {activeTournaments.map(t => (
            <div key={t.id} className="bg-gradient-to-br from-zinc-900 to-black rounded-[2rem] p-6 border border-primary/20 shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
                <div>
                  <h3 className="font-black text-xl text-white group-hover:text-primary transition-colors">{t.name}</h3>
                  <p className="text-zinc-500 text-xs font-medium mt-1 uppercase tracking-widest">{t.gameType} • {t.status.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  <Clock size={14} /> {formatTime(t.startTime)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50 text-center">
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Prize Pool</div>
                  <div className="text-lg font-black text-primary font-mono">₦{t.prizePool.toLocaleString()}</div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50 text-center">
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Entry Fee</div>
                  <div className="text-lg font-black text-white font-mono">₦{t.entryFee.toLocaleString()}</div>
                </div>
                <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800/50 text-center">
                  <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Slots</div>
                  <div className="text-lg font-black text-white font-mono">{t.participants}/{t.maxParticipants}</div>
                </div>
              </div>

              <button 
                onClick={() => joinTournament(t.id)}
                disabled={loading || t.participants >= t.maxParticipants}
                className="w-full bg-primary text-black font-black py-4 rounded-2xl shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-widest text-sm"
              >
                {t.participants >= t.maxParticipants ? 'Tournament Full' : 'Join Tournament'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {upcomingTournaments.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-zinc-700 rounded-full" />
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-500">Upcoming</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingTournaments.map(t => (
              <div key={t.id} className="bg-zinc-900/30 rounded-3xl p-5 border border-zinc-800/50">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-white">{t.name}</h3>
                  <span className="text-[10px] font-black text-zinc-600 bg-zinc-800 px-2 py-1 rounded-md uppercase">{t.gameType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-zinc-500">
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Users size={14} /> {t.maxParticipants}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <Trophy size={14} /> ₦{t.prizePool.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Starts {new Date(t.startTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
