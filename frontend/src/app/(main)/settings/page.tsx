import { useState, useEffect } from 'react';
import {
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Gamepad2,
  Trophy,
  Clock,
  TrendingUp,
  Swords,
  Minus,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { useRankingStore } from '../../../store/ranking.store';
import { getTierByXp, getNextTier } from '../../../utils/tier';
import { TIER_BADGES } from '../dashboard/LeaderboardPage';

export const MePage = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { balance = 0, transactions } = useWallet(isAuthenticated);
  const [activeTab, setActiveTab] = useState<'transactions' | 'games'>('transactions');
  const [showDevPanel, setShowDevPanel] = useState(false);

  const { matchHistory, fetchMatchHistory, addMatchResult, addSimulationXp, resetStats } = useRankingStore();

  useEffect(() => {
    if (user?.username) {
      fetchMatchHistory(user.username);
    }
  }, [user?.username, fetchMatchHistory]);

  const wins = matchHistory.filter((game) => game.result === 'WIN').length;
  const losses = matchHistory.filter((game) => game.result === 'LOSS').length;
  const draws = matchHistory.filter((game) => game.result === 'DRAW').length;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const stats = [
    { label: 'Wins', value: wins, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Losses', value: losses, icon: Swords, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Draws', value: draws, icon: Minus, color: 'text-zinc-400', bg: 'bg-zinc-800/50 border-zinc-700/30' },
    { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  ];

  const formatDate = (date?: string) => {
    if (!date) return 'Recent';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // XP & Tier progression variables
  const xp = user?.xp || 5000;
  const currentTier = getTierByXp(xp);
  const nextTier = getNextTier(currentTier.name);
  
  let progressPercent = 100;
  let xpRemaining = 0;
  
  if (nextTier) {
    const range = nextTier.minXp - currentTier.minXp;
    const progress = xp - currentTier.minXp;
    progressPercent = Math.max(0, Math.min(100, (progress / range) * 100));
    xpRemaining = nextTier.minXp - xp;
  }

  const badgeUrl = TIER_BADGES[currentTier.name.toLowerCase()] || TIER_BADGES.bronze;

  return (
    <div className="px-4 pb-24 pt-6 space-y-6 max-w-2xl mx-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex items-start gap-4 mb-6">
          <div className="w-20 h-20 bg-zinc-950/80 rounded-full flex items-center justify-center border border-zinc-850 shrink-0 overflow-hidden relative p-1 shadow-lg shadow-black/30">
            <img src={badgeUrl} alt={currentTier.name} className="w-16 h-16 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-xl mb-1 text-white truncate">{user?.username || 'Gamer'}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`inline-flex items-center gap-1.5 ${currentTier.bg} ${currentTier.color} text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter border ${currentTier.border}`}>
                <img src={badgeUrl} alt={currentTier.name} className="w-3.5 h-3.5 object-contain" />
                {currentTier.name} Tier
              </span>
              <span className="text-zinc-500 text-xs font-bold uppercase">#{user?.rank || 10} Rank</span>
              {user?.phone && (
                <span className="text-zinc-400 text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></span>
                  {user.phone}
                </span>
              )}
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <SettingsIcon className="text-zinc-400" size={20} />
          </button>
        </div>

        {/* Dynamic XP Progress Bar */}
        <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Progression</span>
            <span className={`text-xs font-mono font-black ${currentTier.color}`}>{xp.toLocaleString()} XP</span>
          </div>
          
          <div className="h-2.5 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden relative p-[1px]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                currentTier.name === 'Ruby' 
                  ? 'from-red-600 to-rose-500' 
                  : 'from-primary/80 to-primary'
              } transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">
              {currentTier.name} Tier
            </span>
            <span className="text-[10px] text-zinc-400 font-bold font-mono">
              {nextTier 
                ? `${xpRemaining.toLocaleString()} XP TO LEVEL UP` 
                : 'MAX TIER REACHED 👑'
              }
            </span>
          </div>
        </div>

      </div>

      {/* Wallet Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => alert("Deposit features are coming soon once the payment gateway ledger is integrated!")}
          className="flex-1 bg-primary text-black font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Wallet size={16} />
          Deposit
        </button>
        <button
          onClick={() => alert("Withdrawal features are coming soon once the banking provider integration is active!")}
          className="flex-1 border-2 border-primary text-primary font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
        >
          Withdraw
        </button>
      </div>

      {/* Stats Section */}
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-3">Performance</div>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-3 text-center ${bg}`}>
              <Icon size={16} className={`mx-auto mb-1.5 ${color}`} />
              <div className={`text-lg font-black ${color}`}>{value}</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs list (Transactions vs Game history) */}
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

                return (
                  <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {positive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors capitalize">{label}</div>
                        <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} /> {formatDate(tx.createdAt || tx.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${positive ? 'text-green-500' : 'text-zinc-300'}`}>
                        {positive ? '+' : '-'}NGN {Math.abs(tx.amount).toLocaleString()}
                      </div>
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{tx.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {matchHistory.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-zinc-500">
                  No games played yet.
                </div>
              )}
              {matchHistory.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        game.result === 'WIN' ? 'bg-primary/10 text-primary' :
                        game.result === 'LOSS' ? 'bg-zinc-850 text-zinc-600' : 'bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        vs {game.opponent}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} /> {game.date} {game.time ? `at ${game.time}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${game.earnings > 0 ? 'text-primary' : game.earnings < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                      {game.earnings > 0 ? '+' : ''}NGN {game.earnings.toLocaleString()}
                    </div>
                    <div
                      className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                        game.result === 'WIN' ? 'text-primary' :
                        game.result === 'LOSS' ? 'text-red-500' : 'text-zinc-500'
                      }`}
                    >
                      {game.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Developer Simulation Panel */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <button
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/40 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-primary" />
            <span>Developer Sandbox Panel</span>
          </div>
          {showDevPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDevPanel && user?.username && (
          <div className="p-4 space-y-4 border-t border-zinc-900 bg-zinc-950/90">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Simulate match outcomes and add XP directly to test the dynamic 10-tier ranking boundaries.
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addSimulationXp(user.username, 100)}
                className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +100 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, 1000)}
                className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +1,000 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, 10000)}
                className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +10,000 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, 100000)}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +100,000 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, -500)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                -500 XP
              </button>
              <button
                onClick={() => resetStats(user.username)}
                className="bg-zinc-900 hover:bg-red-950 text-red-500 border border-zinc-800 hover:border-red-900 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                Reset Stats
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
              <button
                onClick={() => addMatchResult(user.username, 'Tic Tac Toe', 'ShadowMaster', 'WIN', 500)}
                className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-[10px] font-bold py-2.5 rounded-lg active:scale-95 transition-all"
              >
                Simulate WIN (+50 XP)
              </button>
              <button
                onClick={() => addMatchResult(user.username, 'Tic Tac Toe', 'QuantumKing', 'LOSS', 500)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold py-2.5 rounded-lg active:scale-95 transition-all"
              >
                Simulate LOSS (+15 XP)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout button */}
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

export default MePage;
