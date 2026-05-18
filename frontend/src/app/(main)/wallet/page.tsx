import { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, History, Gamepad2, Trophy, Clock, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';

type WalletAction = 'deposit' | 'withdraw' | null;

export const WalletPage = () => {
  const { isAuthenticated } = useAuth();
  const { balance = 0, transactions, loading, error, deposit, withdraw } = useWallet(isAuthenticated);
  const [activeTab, setActiveTab] = useState<'transactions' | 'games'>('transactions');
  const [walletAction, setWalletAction] = useState<WalletAction>(null);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const gameHistory = [
    { id: 1, game: 'Tic Tac Toe', opponent: 'ShadowMaster', result: 'WIN', earnings: 950, date: 'May 13, 2026', time: '03:25 PM' },
    { id: 2, game: 'Tic Tac Toe', opponent: 'QuantumKing', result: 'LOSS', earnings: -500, date: 'May 13, 2026', time: '03:20 PM' },
    { id: 3, game: 'Tic Tac Toe', opponent: 'ProGamerX', result: 'DRAW', earnings: 0, date: 'May 12, 2026', time: '11:10 AM' },
  ];

  const openWalletAction = (action: WalletAction) => {
    setWalletAction(action);
    setAmount('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setFormError(null);
  };

  const closeWalletAction = () => {
    if (loading) return;
    setWalletAction(null);
    setFormError(null);
  };

  const submitWalletAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Enter a valid amount');
      return;
    }

    if (walletAction === 'withdraw' && (!bankName.trim() || !accountNumber.trim() || !accountName.trim())) {
      setFormError('Enter complete bank details');
      return;
    }

    setFormError(null);

    if (walletAction === 'deposit') {
      await deposit(numericAmount);
    }

    if (walletAction === 'withdraw') {
      await withdraw(numericAmount, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
    }

    setWalletAction(null);
  };

  const formatTransactionDate = (date?: string) => {
    if (!date) return 'Pending date';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="px-6 pb-24 pt-6 space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-8 border border-primary/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="text-primary" size={20} />
              <span className="text-zinc-500 text-xs font-black uppercase tracking-widest">Available Balance</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-primary font-mono">₦{balance.toLocaleString()}</h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => openWalletAction('deposit')}
              disabled={loading || !isAuthenticated}
              className="flex-1 md:flex-none bg-primary text-black px-8 py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              <Plus size={18} strokeWidth={3} />
              <span>Deposit</span>
            </button>
            <button
              onClick={() => openWalletAction('withdraw')}
              disabled={loading || !isAuthenticated}
              className="flex-1 md:flex-none bg-zinc-900 text-white px-8 py-3 rounded-xl font-black border border-zinc-800 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-60"
            >
              <ArrowUpRight size={18} />
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
          {error}
        </div>
      )}

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
          <span>Game History</span>
        </button>
      </div>

      <section className="bg-card rounded-3xl border border-border overflow-hidden">
        {activeTab === 'transactions' ? (
          <div className="divide-y divide-zinc-800/50">
            {transactions.length === 0 && (
              <div className="p-8 text-center text-sm font-medium text-zinc-500">
                {loading ? 'Loading transactions...' : 'No transactions yet'}
              </div>
            )}
            {transactions.map((tx) => {
              const positive = tx.amount > 0 || tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund';
              const label = tx.description || tx.type.replace('-', ' ');
              return (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {positive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors capitalize">{label}</div>
                      <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} /> {formatTransactionDate(tx.createdAt || tx.date)}
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    game.result === 'WIN' ? 'bg-primary/10 text-primary' :
                    game.result === 'LOSS' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    <Trophy size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {game.game} <span className="text-zinc-500 font-medium">vs</span> {game.opponent}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} /> {game.date} • {game.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-black ${game.earnings > 0 ? 'text-primary' : game.earnings < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                    {game.earnings > 0 ? '+' : ''}₦{game.earnings.toLocaleString()}
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                    game.result === 'WIN' ?
                      'text-primary' :
                      game.result === 'LOSS' ? 'text-red-500' : 'text-zinc-500'
                  }`}>{game.result}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {walletAction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
          <form onSubmit={submitWalletAction} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black capitalize text-foreground">{walletAction}</h2>
                <p className="text-xs font-medium text-zinc-500">
                  {walletAction === 'deposit' ? 'Add money to your PurePlay wallet' : 'Send money to your bank account'}
                </p>
              </div>
              <button type="button" onClick={closeWalletAction} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-primary">
                <X size={18} />
              </button>
            </div>

            <label className="mb-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">Amount</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="1"
                inputMode="decimal"
                placeholder="500"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>

            {walletAction === 'withdraw' && (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">Bank Name</span>
                  <input
                    value={bankName}
                    onChange={(event) => setBankName(event.target.value)}
                    placeholder="Bank"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">Account Number</span>
                  <input
                    value={accountNumber}
                    onChange={(event) => setAccountNumber(event.target.value)}
                    inputMode="numeric"
                    placeholder="0000000000"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-widest text-zinc-500">Account Name</span>
                  <input
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="Player One"
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>
            )}

            {formError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-primary px-6 py-4 font-black text-black transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? 'Processing...' : walletAction === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
