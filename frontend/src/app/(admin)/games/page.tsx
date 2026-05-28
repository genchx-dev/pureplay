// app/(admin)/games/page.tsx

import { useEffect } from 'react';
import { Gamepad2, Users, Coins, Activity, Play } from 'lucide-react';
import { useAdminStore } from '../../../store/admin.store';
import { StatCard } from '../../../components/admin/StatCard';

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export const AdminGamesPage = () => {
  const { games, loading, fetchGames } = useAdminStore();

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  if (loading.games && !games) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate totals
  const totalActiveMatches = games?.reduce((sum, g) => sum + g.active_matches, 0) ?? 0;
  const totalQueueUsers = games?.reduce((sum, g) => sum + g.queue_users, 0) ?? 0;
  const totalQuickMatches = games?.reduce((sum, g) => sum + g.quick_matches_played, 0) ?? 0;
  const totalRevenue = games?.reduce((sum, g) => sum + g.revenue_made, 0) ?? 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-primary">Game Management</h1>
          <p className="text-xs text-zinc-500 mt-1">Live metrics and revenue tracking per game</p>
        </div>
        <button
          onClick={() => fetchGames()}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 transition-all font-semibold flex items-center gap-1.5"
        >
          <Activity size={12} className="text-primary animate-pulse" />
          Refresh Stats
        </button>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Gamepad2}
          label="Total Games"
          value={games?.length ?? 3}
          sub="Active on platform"
          color="text-primary"
        />
        <StatCard
          icon={Play}
          label="Active Matches"
          value={totalActiveMatches}
          sub={`${totalActiveMatches * 2} players in-game`}
          color="text-emerald-400"
        />
        <StatCard
          icon={Users}
          label="Queueing Players"
          value={totalQueueUsers}
          sub="Waiting in matchmaking"
          color="text-amber-400"
        />
        <StatCard
          icon={Coins}
          label="Total Game Revenue"
          value={fmt(totalRevenue)}
          sub={`Across ${totalQuickMatches} settled matches`}
          color="text-primary"
        />
      </div>

      {/* Games List Grid (WOW Premium Glassmorphic cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {games?.map((game) => (
          <div
            key={game.id}
            className="group relative overflow-hidden bg-zinc-950/40 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black tracking-widest text-zinc-500 uppercase">
                  ID: {game.id}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${game.active_matches > 0 ? 'bg-emerald-500 animate-ping' : 'bg-zinc-600'}`} />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">
                    {game.active_matches > 0 ? 'Active matches' : 'Idle'}
                  </span>
                </span>
              </div>

              <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                {game.label}
              </h3>
            </div>

            {/* Metrics list */}
            <div className="space-y-3.5 my-6">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs text-zinc-500">Active Matches</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{game.active_matches}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs text-zinc-500">Quick Matches Played</span>
                <span className="font-mono text-xs font-bold text-zinc-300">{game.quick_matches_played}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs text-zinc-500">Queueing Players</span>
                <span className="font-mono text-xs font-bold text-amber-400">{game.queue_users}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-xs text-zinc-500">Online Users</span>
                <span className="font-mono text-xs font-bold text-zinc-300">{game.online_users}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-zinc-400 font-bold">Revenue Made</span>
                <span className="font-mono text-sm font-black text-primary">{fmt(game.revenue_made)}</span>
              </div>
            </div>

            <div className="text-[10px] text-zinc-600 italic">
              * Online count includes (active matches * 2) + queue entries
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
