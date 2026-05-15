import { User, Wallet, Settings, LogOut, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';

export const MePage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { balance } = useWallet(isAuthenticated);

  const transactions = [
    { id: 1, type: 'deposit', amount: 5000, date: '2026-05-12 10:30', status: 'completed' },
    { id: 2, type: 'win', amount: 2000, date: '2026-05-11 18:45', status: 'completed' },
    { id: 3, type: 'stake', amount: -1000, date: '2026-05-11 18:30', status: 'completed' },
    { id: 4, type: 'withdrawal', amount: -3000, date: '2026-05-10 14:20', status: 'pending' },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-xl shadow-primary/5">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center border-4 border-primary/30 text-black">
            <User size={36} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl mb-1">{user?.username || 'Gamer'}</h2>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Gold Tier</span>
              <span className="text-zinc-500 text-xs">#42 RANK</span>
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Settings className="text-zinc-400" size={20} />
          </button>
        </div>

        <div className="bg-black/50 rounded-xl p-5 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-primary" />
              <span className="text-zinc-400 text-sm font-medium">Available Balance</span>
            </div>
            <span className="text-primary font-black text-2xl">₦{balance.toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 bg-primary text-black font-bold py-2.5 rounded-xl text-sm shadow-lg shadow-primary/10 active:scale-95 transition-all">Deposit</button>
            <button className="flex-1 border-2 border-primary text-primary font-bold py-2.5 rounded-xl text-sm hover:bg-primary/5 active:scale-95 transition-all">Withdraw</button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History size={18} className="text-primary" />
          <h3 className="font-bold text-lg">Transaction History</h3>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {transactions.map((tx, idx) => (
            <div 
              key={tx.id} 
              className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${idx !== transactions.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <div className="text-sm font-bold capitalize">{tx.type}</div>
                  <div className="text-[10px] text-zinc-500">{tx.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-black ${tx.amount > 0 ? 'text-green-500' : 'text-foreground'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-widest ${
                  tx.status === 'completed' ? 'text-zinc-600' : 'text-primary animate-pulse'
                }`}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full py-3 text-zinc-500 text-sm font-bold hover:text-primary transition-colors">
          View All Transactions
        </button>
      </section>

      {/* Logout */}
      <button 
        onClick={logout}
        className="w-full bg-zinc-900/50 text-red-500 font-bold py-4 rounded-2xl border border-zinc-800/50 flex items-center justify-center gap-2 hover:bg-red-500/5 transition-all group"
      >
        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Logout Account</span>
      </button>
    </div>
  );
};
