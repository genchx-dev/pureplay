import { Clock, Trophy, Users, Zap, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useTournaments } from '../../../hooks/useTournaments';
import type { Tournament } from '../../../types/tournament.types';

const statusLabel: Record<string, string> = {
  upcoming: 'Upcoming',
  registration_open: 'Registration Open',
  active: 'Live',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

const formatDateTime = (dateString: string) => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const tournamentDescription = (tournament: Tournament) =>
  tournament.description || `${tournament.gameType} competition with locked entry and backend-managed registration.`;

export const TournamentPage = () => {
  const { isAuthenticated } = useAuth();
  const { tournaments, loading, error, joinTournament } = useTournaments(isAuthenticated);

  const liveTournaments = tournaments.filter((tournament) =>
    ['registration_open', 'active', 'live'].includes(tournament.status),
  );
  const upcomingTournaments = tournaments.filter((tournament) => tournament.status === 'upcoming');

  return (
    <div className="px-4 pb-24 pt-6 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Trophy size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Tournaments</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Compete / Win / Rise</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Active Now</h2>
        </div>

        {loading && tournaments.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-card p-6 text-center text-sm font-bold uppercase tracking-widest text-zinc-500">
            Loading tournaments...
          </div>
        )}

        {!loading && liveTournaments.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-card p-6 text-center text-sm text-zinc-500 font-medium">
            No active tournaments right now. Check back soon.
          </div>
        )}

        <div className="space-y-4">
          {liveTournaments.map((tournament) => {
            const fillPct = Math.min(100, Math.round((tournament.participants / tournament.maxParticipants) * 100));
            const isFull = tournament.participants >= tournament.maxParticipants;
            const canJoin = tournament.status === 'registration_open' && !isFull && !tournament.isJoined;

            return (
              <div
                key={tournament.id}
                className="rounded-3xl border-2 border-red-500/40 bg-gradient-to-br from-zinc-900 to-black shadow-xl shadow-red-500/10 overflow-hidden"
              >
                <div className="flex items-center justify-between bg-red-500/10 border-b border-red-500/20 px-5 py-2">
                  <div className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest">
                    <Zap size={12} className="animate-pulse" />
                    {statusLabel[tournament.status] || tournament.status}
                  </div>
                  <div className="flex items-center gap-1.5 text-red-400 text-[10px] font-bold">
                    <Clock size={11} />
                    {formatDateTime(tournament.startTime)}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-black uppercase tracking-wide text-foreground mb-1">{tournament.name}</h3>
                  <p className="text-sm text-zinc-400 leading-5 mb-5">{tournamentDescription(tournament)}</p>

                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-zinc-800/50 rounded-2xl p-3 text-center border border-zinc-700/40">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Prize Pool</div>
                      <div className="text-primary font-black text-sm">{formatMoney(tournament.prizePool)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-2xl p-3 text-center border border-zinc-700/40">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Entry</div>
                      <div className="text-foreground font-black text-sm">{formatMoney(tournament.entryFee)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-2xl p-3 text-center border border-zinc-700/40">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Players</div>
                      <div className="text-foreground font-black text-sm">{tournament.participants}/{tournament.maxParticipants}</div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                      <span className="flex items-center gap-1"><Users size={9} /> {tournament.participants} joined</span>
                      <span>{fillPct}% full</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => joinTournament(tournament.id)}
                    disabled={loading || !canJoin}
                    className="w-full rounded-2xl bg-primary px-5 py-3.5 text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {tournament.isJoined ? 'Already Joined' : isFull ? 'Tournament Full' : tournament.status === 'registration_open' ? 'Enter Tournament' : 'Registration Closed'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={13} className="text-zinc-500" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">Upcoming</h2>
        </div>

        {!loading && upcomingTournaments.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-card p-6 text-center text-sm text-zinc-500 font-medium">
            No upcoming tournaments are scheduled yet.
          </div>
        )}

        <div className="space-y-4">
          {upcomingTournaments.map((tournament) => {
            const fillPct = Math.min(100, Math.round((tournament.participants / tournament.maxParticipants) * 100));

            return (
              <div key={tournament.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-black uppercase tracking-wide text-foreground truncate">{tournament.name}</h3>
                      <div className="flex items-center gap-1 shrink-0 bg-zinc-800 rounded-full px-2 py-0.5 text-[8px] font-bold text-zinc-400 uppercase">
                        <Lock size={8} /> Upcoming
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-5">{tournamentDescription(tournament)}</p>
                  </div>
                  <div className="shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter bg-zinc-800 text-zinc-500">
                    {formatMoney(tournament.entryFee)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 font-bold mb-4">
                  <span className="flex items-center gap-1"><Clock size={10} /> {formatDateTime(tournament.startTime)}</span>
                  <span className="flex items-center gap-1"><Trophy size={10} /> {formatMoney(tournament.prizePool)} pool</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {tournament.participants}/{tournament.maxParticipants}</span>
                </div>

                <div className="mb-4">
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-zinc-600 transition-all" style={{ width: `${fillPct}%` }} />
                  </div>
                </div>

                <button
                  disabled
                  className="w-full rounded-2xl font-black py-3 text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800"
                >
                  Registration Opens Soon <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
