import { Bell, Send, Swords, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChallengeStore } from '../../../store/challenge.store';

export const ChallengePage = () => {
  const navigate = useNavigate();
  const simulateIncoming = useChallengeStore((state) => state.simulateIncoming);

  const handleSimulate = () => {
    const names = ['AlphaGamer', 'ShadowSniper', 'NaijaPro', 'VortexPlay', 'DeltaSquad'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomStake = [100, 500, 1000][Math.floor(Math.random() * 3)];
    simulateIncoming(randomName, randomStake);
  };

  return (
    <div className="px-6 pb-24 pt-6">
      <section className="rounded-2xl border border-primary/20 bg-zinc-950 p-6 shadow-xl shadow-primary/5">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black">
          <Swords size={28} strokeWidth={2.5} />
        </div>

        <h1 className="text-2xl font-shrikhand uppercase tracking-wide text-primary">
          Challenge Center
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-400">
          Direct challenges are available from the Tic Tac Toe lobby. Upcoming challenge invites will appear here with accept and decline actions.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-black p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              <Send size={15} />
              Send Challenge
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              Pick a player, stake, and Tic Tac Toe match type from matchmaking.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              <Bell size={15} />
              Invite Alerts
            </div>
            <p className="text-sm leading-6 text-zinc-400">
              Phone notifications will use the number attached to each player account.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row">
          <button
            onClick={() => navigate('/matchmaking')}
            className="w-full rounded-xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01] md:w-auto"
          >
            Open Tic Tac Toe Lobby
          </button>
          
          <button
            onClick={handleSimulate}
            className="w-full rounded-xl border-2 border-primary/30 px-6 py-4 text-sm font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/5 active:scale-[0.98] md:w-auto flex items-center justify-center gap-2"
          >
            <Play size={16} strokeWidth={3} />
            Simulate Incoming Challenge
          </button>
        </div>
      </section>
    </div>
  );
};
