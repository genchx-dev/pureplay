// app/(admin)/users/page.tsx

import { useEffect, useState } from 'react';
import { Shield, User } from 'lucide-react';
import { useAdminStore } from '../../../store/admin.store';
import { DataTable } from '../../../components/admin/DataTable';

export const AdminUsersPage = () => {
  const { users, loading, fetchUsers } = useAdminStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers({ page, search });
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [page, search, fetchUsers]);

  const columns = [
    {
      key: 'username',
      label: 'User',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700">
            <User size={12} className="text-zinc-400" />
          </div>
          <div>
            <div className="font-bold text-zinc-200">{item.username}</div>
            <div className="text-[10px] text-zinc-500">{item.email}</div>
          </div>
          {item.is_staff && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
              <Shield size={9} className="text-primary" />
              <span className="text-[8px] font-black uppercase text-primary">Staff</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'date_joined',
      label: 'Joined',
      render: (item: any) => (
        <span className="text-zinc-400">{new Date(item.date_joined).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'last_login',
      label: 'Last Login',
      render: (item: any) => (
        <span className="text-zinc-400">
          {item.last_login ? new Date(item.last_login).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'wallet_balance',
      label: 'Balance',
      render: (item: any) => (
        <span className="font-mono font-bold text-emerald-400">
          ₦{item.wallet_balance.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'matches',
      label: 'Matches',
      render: (item: any) => (
        <span className="text-zinc-300">{item.stats?.total_matches ?? 0}</span>
      ),
    },
    {
      key: 'win_rate',
      label: 'Win Rate',
      render: (item: any) => {
        const wr = item.stats?.win_rate ?? 0;
        return (
          <span className={`font-bold ${wr >= 60 ? 'text-emerald-400' : wr >= 40 ? 'text-amber-400' : 'text-zinc-400'}`}>
            {wr}%
          </span>
        );
      },
    },
    {
      key: 'mmr',
      label: 'MMR',
      render: (item: any) => (
        <span className="font-mono text-zinc-300">{item.stats?.mmr ?? 1000}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black uppercase tracking-widest text-primary">User Management</h1>
        <p className="text-xs text-zinc-500 mt-1">Browse and monitor all registered users</p>
      </div>

      <DataTable
        columns={columns}
        data={users?.results ?? []}
        total={users?.total ?? 0}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        loading={loading.users}
        searchValue={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by username or email..."
        emptyMessage="No users found"
      />
    </div>
  );
};
