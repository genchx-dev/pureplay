// app/(admin)/revenue/page.tsx

import { useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Download,
  Upload,
  Coins,
  Trophy,
  Swords,
  Activity,
} from 'lucide-react';
import { useAdminStore } from '../../../store/admin.store';
import { MiniChart } from '../../../components/admin/MiniChart';

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export const AdminRevenuePage = () => {
  const { dashboard, analytics, games, loading, fetchDashboard, fetchAnalytics, fetchGames } = useAdminStore();

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics(30);
    fetchGames();
  }, [fetchDashboard, fetchAnalytics, fetchGames]);

  const isDataLoading = (loading.dashboard && !dashboard) || (loading.analytics && !analytics) || (loading.games && !games);

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const d = dashboard;
  const a = analytics;

  // Calculate net ledger
  const depositAmt = d?.financial.total_deposited ?? 0;
  const withdrawAmt = d?.financial.total_withdrawn ?? 0;
  const netBankFlow = depositAmt - withdrawAmt;

  const totalStaked = d?.financial.total_staked ?? 0;
  const totalWon = d?.financial.total_won ?? 0;
  const stakesDiff = totalStaked - totalWon;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-primary">Revenue & Audit</h1>
          <p className="text-xs text-zinc-500 mt-1">Platform-wide financial flow and timeseries logs</p>
        </div>
        <button
          onClick={() => {
            fetchDashboard();
            fetchAnalytics(30);
            fetchGames();
          }}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs text-zinc-300 transition-all font-semibold flex items-center gap-1.5"
        >
          <Activity size={12} className="text-primary animate-pulse" />
          Refresh Ledger
        </button>
      </div>

      {/* Main Profits Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 to-zinc-950/40 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Net Revenue</span>
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-foreground tracking-tight">
            {fmt(d?.revenue.total_platform_revenue ?? 0)}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5">Quick match rake + tournament cuts combined</p>
        </div>

        <div className="relative overflow-hidden bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quick Match Rake</span>
            <Swords size={18} className="text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {fmt(d?.revenue.quick_match_revenue ?? 0)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5">5% rake fee on settled staked games</p>
        </div>

        <div className="relative overflow-hidden bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tournament Cuts</span>
            <Trophy size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {fmt(d?.revenue.tournament_revenue ?? 0)}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5">Total Entry Fees collected minus Prize Pools</p>
        </div>
      </div>

      {/* SVG Daily Revenue Chart */}
      <div className="grid grid-cols-1 gap-4">
        {a?.daily_revenue ? (
          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4">
            <MiniChart
              data={a.daily_revenue}
              color="#10B981"
              height={140}
              label="Daily Platform Revenue Trend (30 Days)"
              formatValue={fmt}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl text-xs text-zinc-500">
            No timeseries data loaded.
          </div>
        )}
      </div>

      {/* Per-Game Revenue Breakdown Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Game Breakdown Card */}
        <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Game Earnings Comparison</h2>
            <p className="text-[10px] text-zinc-500">Revenue split breakdown across individual games</p>
          </div>
          <div className="space-y-3">
            {games?.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
                <div className="flex items-center gap-2">
                  <Coins size={14} className="text-primary" />
                  <span className="text-xs font-bold text-zinc-300">{game.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-foreground">{fmt(game.revenue_made)}</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-semibold">
                    {game.quick_matches_played} completed matches
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Flow Ledger Summary Card */}
        <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Financial Ledger Auditing</h2>
            <p className="text-[10px] text-zinc-500">Aggregate deposits, stakes, and payout transactions</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <Download size={10} className="text-emerald-400" />
                Deposited
              </div>
              <div className="text-sm font-black text-foreground">{fmt(depositAmt)}</div>
            </div>

            <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <Upload size={10} className="text-red-400" />
                Withdrawn
              </div>
              <div className="text-sm font-black text-foreground">{fmt(withdrawAmt)}</div>
            </div>

            <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <ArrowUpRight size={10} className="text-primary" />
                Stakes (Staked)
              </div>
              <div className="text-sm font-black text-foreground">{fmt(totalStaked)}</div>
            </div>

            <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
              <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
                <ArrowDownRight size={10} className="text-zinc-400" />
                Payouts (Won)
              </div>
              <div className="text-sm font-black text-foreground">{fmt(totalWon)}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-900 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <Scale size={11} className="text-zinc-400" /> Net Bankroll Flow (Deposits - Withdraws)
              </span>
              <span className={`font-mono font-bold ${netBankFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netBankFlow >= 0 ? '+' : ''}{fmt(netBankFlow)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <Scale size={11} className="text-zinc-400" /> Stake Variance (Staked - Payouts)
              </span>
              <span className="font-mono font-bold text-zinc-300">
                {fmt(stakesDiff)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminRevenuePage;
