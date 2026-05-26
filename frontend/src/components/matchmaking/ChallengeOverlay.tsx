import { useNavigate, useLocation } from 'react-router-dom';
import { Swords, X, Loader2, ShieldAlert } from 'lucide-react';
import { useChallengeStore } from '../../store/challenge.store';
import { useWalletStore } from '../../store/wallet.store';

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

export const ChallengeOverlay = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  
  if (pathname.startsWith('/game')) {
    return null;
  }
  const {
    incomingChallenges,
    sentChallenge,
    acceptChallenge,
    declineChallenge,
    cancelSentChallenge,
  } = useChallengeStore();
  
  const fetchBalance = useWalletStore((state) => state.fetchBalance);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);

  const handleAccept = async (id: string) => {
    try {
      const matchRoute = await acceptChallenge(id);
      await Promise.allSettled([fetchBalance(), fetchTransactions()]);
      navigate(matchRoute);
    } catch (err) {
      alert('Could not accept challenge. Please try again.');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineChallenge(id);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Render Outgoing Wait Modal
  if (sentChallenge) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="relative w-full max-w-md rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 text-center shadow-2xl shadow-primary/10">
          {/* Animated Glowing Ring & Swords */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/5 text-primary shadow-[0_0_24px_rgba(255,204,51,0.15)] relative">
            <span className="absolute inset-0 rounded-3xl border border-primary/50 animate-ping opacity-25"></span>
            <Loader2 className="absolute h-16 w-16 text-primary/30 animate-spin" />
            <Swords size={32} className="text-primary animate-pulse" />
          </div>

          <h3 className="text-2xl font-shrikhand uppercase tracking-widest text-primary">Challenge Sent</h3>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Waiting for <span className="font-bold text-white">{sentChallenge.opponentName}</span> to accept your challenge.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
            Stake: {formatMoney(sentChallenge.stake)}
          </div>

          <button
            onClick={cancelSentChallenge}
            className="mt-8 w-full rounded-2xl border border-zinc-800 bg-card py-4 text-sm font-black uppercase tracking-widest text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400 active:scale-[0.98]"
          >
            Cancel Challenge
          </button>
        </div>
      </div>
    );
  }

  // 2. Render Incoming Challenge Modal
  if (incomingChallenges.length > 0) {
    const activeChallenge = incomingChallenges[0];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="relative w-full max-w-md rounded-[2.5rem] border border-primary/30 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl shadow-primary/10">
          
          {/* Decorative Close Button */}
          <button
            onClick={() => handleDecline(activeChallenge.id)}
            className="absolute right-6 top-6 text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Decline Challenge"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            {/* Animated Glow Alert Badge */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_rgba(255,204,51,0.2)] relative">
              <span className="absolute inset-0 rounded-3xl border-2 border-primary animate-ping opacity-10"></span>
              <ShieldAlert size={36} strokeWidth={2} className="text-primary animate-bounce" />
            </div>

            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.25em] text-primary mb-3">
              Incoming Request
            </div>

            <h3 className="text-2xl font-shrikhand uppercase tracking-widest text-primary">Challenge Alert!</h3>
            
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              <span className="font-bold text-white text-base">{activeChallenge.challenger.username}</span> has challenged you to a live game of Tic Tac Toe.
            </p>

            {/* Challenger Card Details */}
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Challenger Stats</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {activeChallenge.challenger.tier || 'Bronze'}
                  </span>
                  <span className="text-zinc-400 text-xs font-bold font-mono">Rank {activeChallenge.challenger.rank || 1000}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-500 font-mono">Stake Stakes</div>
                <div className="mt-1 text-sm font-black text-primary font-mono">
                  {formatMoney(activeChallenge.stake)}
                </div>
              </div>
            </div>

            {/* Decision Buttons */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDecline(activeChallenge.id)}
                className="rounded-2xl border border-zinc-800 bg-card py-4 text-sm font-black uppercase tracking-widest text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400 active:scale-[0.98]"
              >
                Decline
              </button>
              <button
                onClick={() => handleAccept(activeChallenge.id)}
                className="rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-primary/15 transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Swords size={16} strokeWidth={3} />
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
