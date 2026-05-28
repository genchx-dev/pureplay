// app/(admin)/page.tsx — Admin Dashboard Entry Point

import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { OverviewPage } from './overview/page';
import { AdminUsersPage } from './users/page';
import { AdminTournamentsPage } from './tournaments/page';
import { AdminTransactionsPage } from './transactions/page';
import { AdminMatchesPage } from './matches/page';
import { AdminGamesPage } from './games/page';
import { AdminRevenuePage } from './revenue/page';

const pages: Record<string, React.FC> = {
  overview: OverviewPage,
  games: AdminGamesPage,
  revenue: AdminRevenuePage,
  users: AdminUsersPage,
  tournaments: AdminTournamentsPage,
  transactions: AdminTransactionsPage,
  matches: AdminMatchesPage,
};

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const ActivePage = pages[activeTab] || OverviewPage;

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ActivePage />
    </AdminLayout>
  );
};

export default AdminDashboard;
