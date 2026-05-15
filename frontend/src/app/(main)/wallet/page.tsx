import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, History } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';

export const WalletPage = () => {
  const { isAuthenticated } = useAuth();
  const { balance = 0 } = useWallet(isAuthenticated);

  return (
    <div className="px-6 pb-24 pt-6 space-y-6 max-w-lg mx-auto">
      <div className="bg-card rounded-[2.5rem] p-8 border border-primary/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Wallet className="text-primary" size={32} />
          </div>
          <span className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total Balance</span>
          <h1 className="text-5xl font-black text-primary font-mono">₦{balance.toLocaleString()}</h1>
          
          <div className="flex gap-4 w-full mt-8">
            <button className="flex-1 bg-primary text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
              <Plus size={20} strokeWidth={3} />
              <span>Deposit</span>
            </button>
            <button className="flex-1 bg-zinc-900 text-white py-4 rounded-2xl font-black border border-zinc-800 flex items-center justify-center gap-2">
              <ArrowUpRight size={20} />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
             <History size={18} className="text-primary" />
             <h3 className="font-bold">Recent Activity</h3>
           </div>
           <button className="text-[10px] font-black text-primary uppercase tracking-widest">See All</button>
        </div>
        
        <div className="bg-card rounded-3xl border border-border p-2">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-2xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
                   <ArrowDownLeft className="text-green-500" size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">Deposit Success</div>
                  <div className="text-[10px] text-zinc-500 font-medium">May 14, 2026 • 12:45 PM</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-green-500">+₦2,500</div>
                <div className="text-[9px] font-bold text-zinc-600 uppercase">Completed</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
