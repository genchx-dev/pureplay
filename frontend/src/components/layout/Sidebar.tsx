import { type LucideIcon, Menu, ChevronLeft, Wallet } from 'lucide-react';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isAuthenticated: boolean;
  balance: number;
}

export const Sidebar = ({
  navItems,
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isAuthenticated,
  balance
}: SidebarProps) => {
  return (
    <aside className={`hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div className={`p-6 border-b border-border flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-primary transition-colors"
        >
          {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
              ? 'bg-primary text-black font-bold shadow-lg shadow-primary/10' 
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-foreground'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
          </button>
        ))}
      </nav>

      {isAuthenticated && (
        <div className="p-4 mt-auto border-t border-border">
          <div className={`bg-black/40 rounded-xl p-4 border border-border flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-primary" />
              {!isCollapsed && <span className="text-sm font-semibold font-mono">NGN {balance.toLocaleString()}</span>}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
