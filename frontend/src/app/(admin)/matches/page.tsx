// app/(admin)/matches/page.tsx

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAdminStore } from '../../../store/admin.store';
import { DataTable } from '../../../components/admin/DataTable';

const statusColors: Record<string, string> = {
  waiting: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  completed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  abandoned: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export const AdminMatchesPage = () => {
  const { matches, loading, fetchMatches } = useAdminStore();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [matchTypeFilter, setMatchTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMatches({
      page,
      status: statusFilter,
      game_type: gameTypeFilter,
      is_tournament: matchTypeFilter,
      search: search,
    });
  }, [page, statusFilter, gameTypeFilter, matchTypeFilter, search, fetchMatches]);

  const columns = [
    {
      key: 'id',
      label: 'Match ID',
      render: (item: any) => (
        <span className="font-mono text-[10px] text-zinc-500">{String(item.id).substring(0, 8)}...</span>
      ),
    },
    {
      key: 'players',
      label: 'Players',
      render: (item: any) => (
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${item.winner === item.player1 ? 'text-primary' : 'text-zinc-300'}`}>
            {item.player1 || '?'}
          </span>
          <span className="text-zinc-600 text-[10px]">vs</span>
          <span className={`font-bold ${item.winner === item.player2 ? 'text-primary' : 'text-zinc-300'}`}>
            {item.player2 || '?'}
          </span>
        </div>
      ),
    },
    {
      key: 'game_type',
      label: 'Game',
      render: (item: any) => (
        <span className="text-zinc-400 uppercase text-[10px] font-bold">{item.game_type}</span>
      ),
    },
    {
      key: 'stake',
      label: 'Stake',
      render: (item: any) => (
        <span className="font-mono text-zinc-300">{item.stake ? `₦${item.stake.toLocaleString()}` : 'Free'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${statusColors[item.status] || 'text-zinc-400'}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'winner',
      label: 'Winner',
      render: (item: any) => (
        item.winner ? (
          <span className="flex items-center gap-1 text-primary font-bold">
            <Trophy size={11} /> {item.winner}
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        )
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item: any) => (
        <span className={`text-[10px] font-bold uppercase ${item.is_tournament ? 'text-amber-400' : 'text-zinc-500'}`}>
          {item.is_tournament ? 'Tournament' : 'Quick Match'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (item: any) => (
        <span className="text-zinc-400 text-[11px]">{new Date(item.created_at).toLocaleDateString()}</span>
      ),
    },
  ];

  const selectClass = "px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-primary/40 transition-colors";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-primary">Match History</h1>
        <p className="text-xs text-zinc-500 mt-1">All matches played across the platform</p>
      </div>

      <DataTable
        columns={columns}
        data={matches?.results ?? []}
        total={matches?.total ?? 0}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        loading={loading.matches}
        emptyMessage="No matches found"
        filters={
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Search player..."
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-primary/40 transition-colors w-40"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select className={selectClass} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="waiting">Waiting</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <select className={selectClass} value={gameTypeFilter} onChange={(e) => { setGameTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Games</option>
              <option value="tictactoe">Tic Tac Toe</option>
              <option value="chess">Chess</option>
              <option value="whot">Whot! Cards</option>
            </select>
            <select className={selectClass} value={matchTypeFilter} onChange={(e) => { setMatchTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="false">Quick Match</option>
              <option value="true">Tournament</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
