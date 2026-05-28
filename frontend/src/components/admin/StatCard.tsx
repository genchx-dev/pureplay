// components/admin/StatCard.tsx

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

export const StatCard = ({ icon: Icon, label, value, sub, trend, trendValue, color = 'text-primary' }: StatCardProps) => (
  <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all">
    <div className="absolute -top-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
      <Icon size={80} />
    </div>
    <div className="flex items-center gap-3 mb-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 ${color}`}>
        <Icon size={18} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">{label}</span>
    </div>
    <div className={`text-2xl font-black tracking-tight ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
    <div className="flex items-center gap-2 mt-1.5">
      {sub && <span className="text-[11px] text-zinc-500">{sub}</span>}
      {trend && trendValue && (
        <span className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500'}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </span>
      )}
    </div>
  </div>
);
