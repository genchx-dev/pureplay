import { useState } from 'react';
import { 
  User, 
  Wallet, 
  Settings, 
  LogOut, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Gamepad2, 
  Trophy, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';

export const MePage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { balance = 0, transactions } = useWallet(isAuthenticated);
  const [activeTab, setActiveTab] = useState<'transactions' | 'games'>('transactions');

  const gameHistory = [
    { id: 1, game: 'Tic Tac Toe', opponent: 'ShadowMaster', result: 'WIN', earnings: 950, date: 'May 13, 2026', time: '03:25 PM' },
    { id: 2, game: 'Tic Tac Toe', opponent: 'QuantumKing', result: 'LOSS', earnings: -500, date: 'May 13, 2026', time: '03:20 PM' },
    { id: 3, game: 'Tic Tac Toe', opponent: 'ProGamerX', result: 'DRAW', earnings: 0, date: 'May 12, 2026', time: '11:10 AM' },
  ];

  return (
    <div className="px-6 pb-24 pt-6 space-y-6 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 border border-primary/20 shadow-xl shadow-primary/5">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center border-4 border-primary/30 text-black shrink-0">
            <User size={36} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl mb-1 text-white">{user?.username || 'Gamer'}</h2>
            <div className="flex items-center gap-2">
              <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">Gold Tier</span>
              <span className="text-zinc-500 text-xs font-medium">#42 RANK</span>
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Settings className="text-zinc-400" size={20} />
          </button>
        </div>

        {/* Wallet Inset Card */}
        <div className="bg-black/50 rounded-2xl p-5 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-primary" />
              <span className="text-zinc-400 text-sm font-medium">Available Balance</span>
            </div>
            <span className="text-primary font-black text-2xl font-mono">₦{balance.toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.assign('/wallet')}
              className="flex-1 bg-primary text-black font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/10 transition-all active:scale-95"
            >
              Deposit
            </button>
            <button
              onClick={() => window.location.assign('/wallet')}
              className="flex-1 border-2 border-primary text-primary font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
            >
              Withdraw
            </button>
          </div>
          <p className="mt-3 text-xs font-medium text-zinc-500">
            Wallet ledger and match stakes are fully operational.
          </p>
        </div>
      </div>

      {/* History Section Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'transactions' ? 'bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <History size={18} />
            <span>Transactions</span>
          </button>
          <button 
            onClick={() => setActiveTab('games')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'games' ? 'bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Gamepad2 size={18} />
            <span>Games</span>
          </button>
        </div>

        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          {activeTab === 'transactions' ? (
            <div className="divide-y divide-zinc-800/50">
              {transactions.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-zinc-500">
                  No transactions yet.
                </div>
              )}
              {transactions.map((tx) => {
                const positive = tx.amount > 0 || tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund';
                const label = tx.description || tx.type.replace('-', ' ');
                const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent';
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {positive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors capitalize">{label}</div>
                        <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} /> {date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${positive ? 'text-green-500' : 'text-zinc-300'}`}>
                        {positive ? '+' : '-'}₦{Math.abs(tx.amount).toLocaleString()}
                      </div>
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{tx.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {gameHistory.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      game.result === 'WIN' ? 'bg-primary/10 text-primary' : 
                      game.result === 'LOSS' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        vs {game.opponent}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} /> {game.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${game.earnings > 0 ? 'text-primary' : game.earnings < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                      {game.earnings > 0 ? '+' : ''}₦{game.earnings.toLocaleString()}
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                      game.result === 'WIN' ? 'text-primary' : 
                      game.result === 'LOSS' ? 'text-red-500' : 'text-zinc-500'
                    }`}>{game.result}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={logout}
        className="w-full bg-zinc-900/50 text-red-500 font-bold py-4 rounded-2xl border border-zinc-800/50 flex items-center justify-center gap-2 hover:bg-red-500/5 transition-all group mt-4"
      >
        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Logout Account</span>
      </button>
    </div>
  );
};
