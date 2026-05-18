import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Swords } from 'lucide-react';
import { matchmakingApi } from '../../../services/api/matchmaking.api';

export const MatchmakingPage = () => {
  const navigate = useNavigate();
  const [stake, setStake] = useState(500);
  const [status, setStatus] = useState<'idle' | 'searching' | 'waiting' | 'error'>('idle');
  const [message, setMessage] = useState('Choose your stake and enter the queue');

  const joinQueue = useCallback(async () => {
    setStatus('searching');
    setMessage('Finding a worthy adversary for you');

    try {
      const { data } = await matchmakingApi.joinQueue({
        gameType: 'tictactoe',
        stake,
      });

      if (data.status === 'matched' && data.matchId) {
        navigate(`/game/${data.matchId}`);
        return;
      }

      setStatus('waiting');
      setMessage('You are in the queue. Waiting for an opponent.');
    } catch (error) {
      console.error('Failed to join matchmaking queue', error);
      setStatus('error');
      setMessage('Matchmaking is not available yet. Try again after the backend queue endpoint is live.');
    }
  }, [navigate, stake]);

  const handleStakeChange = (value: number) => {
    setStake(value);
    if (status === 'error') {
      setStatus('idle');
      setMessage('Choose your stake and enter the queue');
    }
  };

  const isSearching = status === 'searching' || status === 'waiting';
  const stakeOptions = [100, 500, 1000];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute left-4 top-4 p-2 rounded-full border border-border text-zinc-500 hover:text-primary hover:border-primary/40 transition-colors"
        aria-label="Back to home"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="relative">
        {isSearching ? (
          <Loader2 className="animate-spin text-primary mb-8" size={64} />
        ) : (
          <Swords className="text-primary mb-8" size={64} />
        )}
        <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full" />
      </div>

      <h2 className="text-3xl font-shrikhand text-primary uppercase tracking-widest mb-2">
        {isSearching ? 'Searching...' : 'Tic Tac Toe'}
      </h2>
      <p className={`max-w-sm text-center font-medium ${status === 'error' ? 'text-red-400' : 'text-zinc-500'}`}>
        {message}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {stakeOptions.map((option) => (
          <button
            key={option}
            onClick={() => handleStakeChange(option)}
            disabled={isSearching}
            className={`rounded-xl border px-5 py-3 font-black transition-all disabled:cursor-not-allowed ${
              stake === option
                ? 'border-primary bg-primary text-black'
                : 'border-border bg-card text-zinc-300 hover:border-primary/50'
            }`}
          >
            ₦{option.toLocaleString()}
          </button>
        ))}
      </div>

      <button
        onClick={joinQueue}
        disabled={isSearching}
        className="mt-8 min-w-56 rounded-2xl bg-primary px-8 py-4 font-black text-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
      >
        {isSearching ? 'In Queue' : 'Find Match'}
      </button>

      {isSearching && (
        <div className="mt-12 flex gap-2">
          <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      )}
    </div>
  );
};
