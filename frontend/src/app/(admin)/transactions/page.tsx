// app/(admin)/transactions/page.tsx

import { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/admin.store';
import { DataTable } from '../../../components/admin/DataTable';

const typeColors: Record<string, string> = {
  deposit: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  withdrawal: 'bg-red-500/15 text-red-400 border-red-500/20',
  stake: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  lock: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  win: 'bg-primary/15 text-primary border-primary/20',
  refund: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

const statusColors: Record<string, string> = {
  completed: 'text-emerald-400',
  pending: 'text-amber-400',
  failed: 'text-red-400',
  reversed: 'text-zinc-400',
};

export const AdminTransactionsPage = () => {
  const { transactions, loading, fetchTransactions } = useAdminStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions({ page, search, type: typeFilter, status: statusFilter });
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, search, typeFilter, statusFilter, fetchTransactions]);

  const columns = [
    {
      key: 'created_at',
      label: 'Time',
      render: (item: any) => (
        <div className="text-zinc-400">
          <div className="text-[11px]">{new Date(item.created_at).toLocaleDateString()}</div>
          <div className="text-[9px] text-zinc-600">{new Date(item.created_at).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'User',
      render: (item: any) => (
        <span className="font-bold text-zinc-200">{item.username}</span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item: any) => (
        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase ${typeColors[item.type] || 'text-zinc-400'}`}>
          {item.type}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: any) => (
        <span className={`font-mono font-bold ${
          item.type === 'deposit' || item.type === 'win' || item.type === 'refund'
            ? 'text-emerald-400'
            : 'text-red-400'
        }`}>
          {item.type === 'deposit' || item.type === 'win' || item.type === 'refund' ? '+' : '-'}₦{item.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <span className={`text-[10px] font-bold uppercase ${statusColors[item.status] || 'text-zinc-400'}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item: any) => (
        <span className="text-zinc-500 text-[11px] max-w-[200px] truncate block">{item.description || '—'}</span>
      ),
    },
    {
      key: 'reference_id',
      label: 'Ref',
      render: (item: any) => (
        <span className="text-zinc-600 text-[10px] font-mono">{item.reference_id ? item.reference_id.substring(0, 8) + '...' : '—'}</span>
      ),
    },
  ];

  const sections = [
    { id: 'all', label: 'All Operations', value: '' },
    { id: 'deposits', label: 'Deposits', value: 'deposit' },
    { id: 'withdrawals', label: 'Withdrawals', value: 'withdrawal' },
    { id: 'stakes', label: 'Stakes', value: 'stake' },
    { id: 'wins', label: 'Winnings', value: 'win' },
    { id: 'refunds', label: 'Refunds', value: 'refund' },
  ];

  const selectClass = "px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-primary/40 transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/40 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-primary">Financial Audit Log</h1>
          <p className="text-xs text-zinc-500 mt-1">Track every transaction across the platform</p>
        </div>

        {/* Transaction Category Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-zinc-950/80 border border-zinc-800 rounded-2xl w-fit">
          {sections.map((sec) => {
            const isActive = typeFilter === sec.value;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setTypeFilter(sec.value);
                  setPage(1);
                }}
                className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-black shadow-lg shadow-primary/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactions?.results ?? []}
        total={transactions?.total ?? 0}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        loading={loading.transactions}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by username..."
        emptyMessage="No transactions found"
        filters={
          <div className="flex items-center gap-2">
            <select className={selectClass} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        }
      />
    </div>
  );
};
