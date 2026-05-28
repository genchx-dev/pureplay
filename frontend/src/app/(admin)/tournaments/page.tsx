// app/(admin)/tournaments/page.tsx

import { useEffect, useState } from 'react';
import { Plus, Play, X, Trophy, Eye } from 'lucide-react';
import { useAdminStore } from '../../../store/admin.store';
import { DataTable } from '../../../components/admin/DataTable';
import { TournamentBracketModal } from '../../../components/tournament/TournamentBracketModal';
import { useAuthStore } from '../../../store/auth.store';

const statusColors: Record<string, string> = {
  registering: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  in_progress: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  completed: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const defaultDistribution = JSON.stringify({
  "1": 50,
  "2": 25,
  "3": 15,
  "4": 7,
  "5": 3
}, null, 2);

export const AdminTournamentsPage = () => {
  const { tournaments, loading, fetchTournaments, createTournament, startTournament, cancelTournament } = useAdminStore();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);

  const normalizeAdminTournament = (item: any): any => {
    let status = 'upcoming';
    const rawStatus = item.status;
    if (rawStatus === 'registering' || rawStatus === 'registration_open') {
      status = 'registration_open';
    } else if (rawStatus === 'in_progress' || rawStatus === 'active' || rawStatus === 'live') {
      status = 'active';
    } else if (rawStatus === 'completed') {
      status = 'completed';
    } else if (rawStatus === 'cancelled') {
      status = 'cancelled';
    } else if (rawStatus === 'upcoming') {
      status = 'upcoming';
    }
    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      gameType: item.game_type || 'tictactoe',
      entryFee: Number(item.entry_fee || 0),
      prizePool: Number(item.prize_pool || 0),
      participants: Number(item.current_players || 0),
      maxParticipants: Number(item.max_players || 8),
      startTime: item.scheduled_start_time || item.started_at || item.created_at || new Date().toISOString(),
      registrationDeadline: item.registration_deadline || undefined,
      status,
      isJoined: true,
      winners: item.winner ? [item.winner] : [],
    };
  };

  // Form state
  const [form, setForm] = useState({
    name: '',
    game_type: 'tictactoe',
    entry_fee: 500,
    max_players: 8,
    bracket_type: 'single_elimination',
    tournament_type: 'knockout',
    scheduled_start_time: '',
    registration_deadline: '',
    prize_distribution: defaultDistribution,
  });

  useEffect(() => {
    fetchTournaments({ page });
  }, [page, fetchTournaments]);

  const handleCreate = async () => {
    setSubmitting(true);
    let dist: Record<string, number> = {};
    try {
      dist = JSON.parse(form.prize_distribution);
    } catch { /* ignore */ }

    const success = await createTournament({
      ...form,
      prize_distribution: dist,
      scheduled_start_time: form.scheduled_start_time || undefined,
      registration_deadline: form.registration_deadline || undefined,
    });
    setSubmitting(false);
    if (success) {
      setShowForm(false);
      setForm({
        name: '',
        game_type: 'tictactoe',
        entry_fee: 500,
        max_players: 8,
        bracket_type: 'single_elimination',
        tournament_type: 'knockout',
        scheduled_start_time: '',
        registration_deadline: '',
        prize_distribution: defaultDistribution,
      });
      fetchTournaments({ page: 1 });
      setPage(1);
    }
  };

  const handleStart = async (id: string) => {
    if (confirm('Start this tournament? This will generate the bracket.')) {
      const success = await startTournament(id);
      if (success) fetchTournaments({ page });
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Cancel this tournament? All participants will be refunded.')) {
      const success = await cancelTournament(id);
      if (success) fetchTournaments({ page });
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tournament',
      render: (item: any) => (
        <div>
          <div className="font-bold text-zinc-200">{item.name}</div>
          <div className="text-[10px] text-zinc-500 uppercase">{item.game_type} · {item.tournament_type}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${statusColors[item.status] || 'text-zinc-400'}`}>
          {item.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'players',
      label: 'Players',
      render: (item: any) => (
        <span className="text-zinc-300">{item.current_players} / {item.max_players}</span>
      ),
    },
    {
      key: 'entry_fee',
      label: 'Entry Fee',
      render: (item: any) => (
        <span className="font-mono text-zinc-300">₦{item.entry_fee.toLocaleString()}</span>
      ),
    },
    {
      key: 'prize_pool',
      label: 'Prize Pool',
      render: (item: any) => (
        <span className="font-mono font-bold text-primary">₦{item.prize_pool.toLocaleString()}</span>
      ),
    },
    {
      key: 'winner',
      label: 'Winner',
      render: (item: any) => (
        item.winner ? (
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <Trophy size={11} /> {item.winner}
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        )
      ),
    },
    {
      key: 'scheduled',
      label: 'Scheduled',
      render: (item: any) => (
        <span className="text-zinc-400 text-[10px]">
          {item.scheduled_start_time ? new Date(item.scheduled_start_time).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item: any) => (
        <div className="flex items-center gap-1">
          {item.status !== 'cancelled' && (
            <button
              onClick={() => setSelectedTournament(normalizeAdminTournament(item))}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="View Live Bracket"
            >
              <Eye size={12} />
            </button>
          )}
          {item.status === 'registering' && (
            <>
              <button
                onClick={() => handleStart(item.id)}
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="Start Tournament"
              >
                <Play size={12} />
              </button>
              <button
                onClick={() => handleCancel(item.id)}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Cancel Tournament"
              >
                <X size={12} />
              </button>
            </>
          )}
          {item.status === 'in_progress' && (
            <button
              onClick={() => handleCancel(item.id)}
              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Cancel Tournament"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const inputClass = "w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-primary/40 transition-colors";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500 mb-1 block";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-primary">Tournament Management</h1>
          <p className="text-xs text-zinc-500 mt-1">Create, start, and manage tournaments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Create Tournament
        </button>
      </div>

      {/* Create Tournament Form */}
      {showForm && (
        <div className="bg-zinc-950/80 border border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-primary">New Tournament</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Tournament Name</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend Battle Cup" />
            </div>
            <div>
              <label className={labelClass}>Game Type</label>
              <select className={inputClass} value={form.game_type} onChange={(e) => setForm({ ...form, game_type: e.target.value })}>
                <option value="tictactoe">Tic Tac Toe</option>
                <option value="chess">Chess</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Entry Fee (₦)</label>
              <input type="number" className={inputClass} value={form.entry_fee} onChange={(e) => setForm({ ...form, entry_fee: Number(e.target.value) })} />
            </div>
            <div>
              <label className={labelClass}>Max Players</label>
              <select className={inputClass} value={form.max_players} onChange={(e) => setForm({ ...form, max_players: Number(e.target.value) })}>
                {[4, 8, 16, 32, 64, 128, 256].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Bracket Type</label>
              <select className={inputClass} value={form.bracket_type} onChange={(e) => setForm({ ...form, bracket_type: e.target.value })}>
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
                <option value="swiss">Swiss</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Tournament Type</label>
              <select className={inputClass} value={form.tournament_type} onChange={(e) => setForm({ ...form, tournament_type: e.target.value })}>
                <option value="knockout">Pure Knockout</option>
                <option value="swiss_hybrid">Swiss Hybrid</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Scheduled Start Time</label>
              <input type="datetime-local" className={inputClass} value={form.scheduled_start_time} onChange={(e) => setForm({ ...form, scheduled_start_time: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Registration Deadline</label>
              <input type="datetime-local" className={inputClass} value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <label className={labelClass}>Prize Distribution (%)</label>
              <textarea className={`${inputClass} h-20 resize-none font-mono`} value={form.prize_distribution} onChange={(e) => setForm({ ...form, prize_distribution: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={submitting || !form.name}
              className="px-5 py-2 bg-primary text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Tournament'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={tournaments?.results ?? []}
        total={tournaments?.total ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        loading={loading.tournaments}
        emptyMessage="No tournaments found"
      />

      {/* Bracket Tree Modal Overlay */}
      {selectedTournament && (
        <TournamentBracketModal
          tournament={selectedTournament}
          user={user}
          onClose={() => setSelectedTournament(null)}
        />
      )}
    </div>
  );
};
