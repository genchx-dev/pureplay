// components/admin/MiniChart.tsx

interface MiniChartProps {
  data: Record<string, number>;
  color?: string;
  type?: 'line' | 'bar';
  height?: number;
  label?: string;
  formatValue?: (v: number) => string;
}

export const MiniChart = ({
  data,
  color = '#FFCC33',
  type = 'line',
  height = 120,
  label,
  formatValue = (v) => v.toLocaleString(),
}: MiniChartProps) => {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return (
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4">
        {label && <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-3">{label}</div>}
        <div className="flex items-center justify-center text-xs text-zinc-600" style={{ height }}>
          No data yet
        </div>
      </div>
    );
  }

  const values = entries.map(([, v]) => v);
  const maxVal = Math.max(...values, 1);
  const totalVal = values.reduce((s, v) => s + v, 0);
  const w = 100;
  const padding = 2;
  const chartW = w - padding * 2;
  const chartH = height;

  if (type === 'bar') {
    const barW = chartW / entries.length;
    const gap = Math.max(barW * 0.15, 0.5);
    return (
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4">
        {label && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">{label}</div>
            <div className="text-[11px] font-bold text-zinc-400">Total: {formatValue(totalVal)}</div>
          </div>
        )}
        <svg viewBox={`0 0 ${w} ${chartH}`} className="w-full" style={{ height }} preserveAspectRatio="none">
          {entries.map(([, v], i) => {
            const barH = (v / maxVal) * (chartH - 8);
            const x = padding + i * barW + gap / 2;
            return (
              <rect
                key={i}
                x={x}
                y={chartH - barH}
                width={barW - gap}
                height={barH}
                rx={1}
                fill={color}
                opacity={0.7 + (i / entries.length) * 0.3}
              />
            );
          })}
        </svg>
      </div>
    );
  }

  // Line chart
  const points = entries.map(([, v], i) => {
    const x = padding + (i / Math.max(entries.length - 1, 1)) * chartW;
    const y = chartH - 4 - (v / maxVal) * (chartH - 12);
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4">
      {label && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">{label}</div>
          <div className="text-[11px] font-bold text-zinc-400">Total: {formatValue(totalVal)}</div>
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${chartH}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${label})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
        ))}
      </svg>
    </div>
  );
};
