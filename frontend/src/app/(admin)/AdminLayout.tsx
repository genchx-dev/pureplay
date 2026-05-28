// app/(admin)/AdminLayout.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Receipt,
  Swords,
  ArrowLeft,
  Menu,
  ChevronLeft,
  Shield,
  Gamepad2,
  CircleDollarSign,
} from 'lucide-react';

const navItems = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'games', icon: Gamepad2, label: 'Games' },
  { id: 'revenue', icon: CircleDollarSign, label: 'Revenue' },
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'tournaments', icon: Trophy, label: 'Tournaments' },
  { id: 'transactions', icon: Receipt, label: 'Transactions' },
  { id: 'matches', icon: Swords, label: 'Matches' },
];

interface AdminLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AdminLayout = ({ activeTab, setActiveTab, children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand */}
        <div className={`p-5 border-b border-border flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-black">
                <Shield size={16} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-primary">Admin</div>
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider">PurePlay Control</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-colors"
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : ''}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${
                activeTab === item.id
                  ? 'bg-primary text-black font-bold shadow-lg shadow-primary/10'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {!collapsed && <span className="font-semibold">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Back to App */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => navigate('/')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all text-sm ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <ArrowLeft size={18} />
            {!collapsed && <span className="font-semibold">Back to App</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-black">
              <Shield size={14} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-primary">Admin Panel</span>
          </div>
          <button onClick={() => navigate('/')} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Back
          </button>
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === item.id
                  ? 'bg-primary text-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <item.icon size={12} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-0 md:pt-0">
        <div className="md:hidden h-[88px]" /> {/* Mobile header spacer */}
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
};
