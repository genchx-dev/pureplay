import { useLocation } from 'react-router-dom';
import { Swords, Loader2 } from 'lucide-react';
import { useChallengeStore } from '../../store/challenge.store';

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

export const ChallengeOverlay = () => {
  const { pathname } = useLocation();
  
  const {
    sentChallenge,
    cancelSentChallenge,
  } = useChallengeStore();
  
  if (pathname.startsWith('/game')) {
    return null;
  }

  // Render Outgoing Wait Modal
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

  return null;
};
