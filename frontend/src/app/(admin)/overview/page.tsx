// app/(admin)/overview/page.tsx

import { useEffect } from 'react';
import {
  Users,
  Swords,
  Trophy,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Activity,
  PiggyBank,
} from 'lucide-react';
import { useAdminStore } from '../../../store/admin.store';
import { StatCard } from '../../../components/admin/StatCard';
import { MiniChart } from '../../../components/admin/MiniChart';

const fmt = (n: number) => `NGN ${n.toLocaleString()}`;

export const OverviewPage = () => {
  const { dashboard, analytics, loading, fetchDashboard, fetchAnalytics } = useAdminStore();

  useEffect(() => {
    fetchDashboard();
    fetchAnalytics(30);
  }, [fetchDashboard, fetchAnalytics]);

  if (loading.dashboard && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const d = dashboard;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-primary">Dashboard Overview</h1>
        <p className="text-xs text-zinc-500 mt-1">Real-time platform monitoring and analytics</p>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total Users"
          value={d?.users.total ?? 0}
          sub={`+${d?.users.today ?? 0} today`}
          trend="up"
          trendValue={`+${d?.users.this_week ?? 0} this week`}
        />
        <StatCard
          icon={Activity}
          label="Active Matches"
          value={d?.matches.active ?? 0}
          sub={`${d?.matches.total_completed ?? 0} completed`}
          color="text-emerald-400"
        />
        <StatCard
          icon={Trophy}
          label="Tournaments"
          value={(d?.tournaments.active ?? 0) + (d?.tournaments.registering ?? 0)}
          sub={`${d?.tournaments.completed ?? 0} completed`}
          color="text-amber-400"
        />
        <StatCard
          icon={Swords}
          label="Total Matches"
          value={d?.matches.total_completed ?? 0}
          sub="All time"
        />
      </div>

      {/* ── Revenue Section ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-3">Platform Revenue</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={PiggyBank}
            label="Total Revenue"
            value={fmt(d?.revenue.total_platform_revenue ?? 0)}
            color="text-emerald-400"
          />
          <StatCard
            icon={Trophy}
            label="Tournament Revenue"
            value={fmt(d?.revenue.tournament_revenue ?? 0)}
            sub="Platform cut from tournaments"
            color="text-amber-400"
          />
          <StatCard
            icon={Swords}
            label="Quick Match Revenue"
            value={fmt(d?.revenue.quick_match_revenue ?? 0)}
            sub="Platform rake from matches"
            color="text-blue-400"
          />
        </div>
      </div>

      {/* ── Financial Overview ── */}
      <div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-3">Financial Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={ArrowUpRight}
            label="Total Deposited"
            value={fmt(d?.financial.total_deposited ?? 0)}
            color="text-emerald-400"
          />
          <StatCard
            icon={ArrowDownRight}
            label="Total Withdrawn"
            value={fmt(d?.financial.total_withdrawn ?? 0)}
            color="text-red-400"
          />
          <StatCard
            icon={DollarSign}
            label="Total Staked"
            value={fmt(d?.financial.total_staked ?? 0)}
            color="text-blue-400"
          />
          <StatCard
            icon={Wallet}
            label="Platform Wallet Total"
            value={fmt(d?.financial.platform_wallet_total ?? 0)}
            sub={`Locked: ${fmt(d?.financial.platform_locked_total ?? 0)}`}
          />
        </div>
      </div>

      {/* ── Analytics Charts ── */}
      {analytics && (
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-3">30-Day Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <MiniChart
              data={analytics.daily_signups}
              label="Daily Signups"
              color="#FFCC33"
              type="bar"
              height={100}
            />
            <MiniChart
              data={analytics.daily_matches}
              label="Daily Matches"
              color="#34D399"
              type="bar"
              height={100}
            />
            <MiniChart
              data={analytics.daily_deposits}
              label="Daily Deposits"
              color="#60A5FA"
              type="line"
              height={100}
              formatValue={(v) => fmt(v)}
            />
            <MiniChart
              data={analytics.daily_withdrawals}
              label="Daily Withdrawals"
              color="#F87171"
              type="line"
              height={100}
              formatValue={(v) => fmt(v)}
            />
            <MiniChart
              data={analytics.daily_stakes}
              label="Daily Staked"
              color="#A78BFA"
              type="line"
              height={100}
              formatValue={(v) => fmt(v)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
