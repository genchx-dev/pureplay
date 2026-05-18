import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Loader2, Swords, Users } from 'lucide-react';
import { matchmakingApi } from '../../../services/api/matchmaking.api';
import type { AvailablePlayer, MatchmakingMode } from '../../../types/matchmaking.types';

const fallbackPlayers: AvailablePlayer[] = [
  { id: 'demo-shadow', username: 'ShadowMaster', tier: 'Gold', rank: 1240, preferredStake: 500, status: 'online' },
  { id: 'demo-quantum', username: 'QuantumKing', tier: 'Silver', rank: 1180, preferredStake: 1000, status: 'online' },
  { id: 'demo-pro', username: 'ProGamerX', tier: 'Bronze', rank: 1060, preferredStake: 100, status: 'online' },
];

export const MatchmakingPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<MatchmakingMode>('quick_match');
  const [stake, setStake] = useState(500);
  const [status, setStatus] = useState<'idle' | 'searching' | 'waiting' | 'challenging' | 'error'>('idle');
  const [message, setMessage] = useState('Choose how you want to play.');
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersHint, setPlayersHint] = useState('');
  const [activeOpponentId, setActiveOpponentId] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'challenge') return;

    let cancelled = false;
    const loadPlayers = async () => {
      setPlayersLoading(true);
      setPlayersHint('');

      try {
        const { data } = await matchmakingApi.getAvailablePlayers('tictactoe', stake);
        if (!cancelled) {
          setAvailablePlayers(data);
          setPlayersHint(data.length === 0 ? 'No players are available right now.' : '');
        }
      } catch (error) {
        console.error('Failed to fetch available players', error);
        if (!cancelled) {
          setAvailablePlayers(fallbackPlayers);
          setPlayersHint('Showing sample players until the backend available-player endpoint is live.');
        }
      } finally {
        if (!cancelled) {
          setPlayersLoading(false);
        }
      }
    };

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, [mode, stake]);

  const handleModeChange = (nextMode: MatchmakingMode) => {
    setMode(nextMode);
    setStatus('idle');
    setActiveOpponentId(null);

    if (nextMode === 'bot') {
      setMessage('Practice against the local demo bot flow without waiting for backend matchmaking.');
      return;
    }

    if (nextMode === 'quick_match') {
      setMessage('Choose your stake and enter the quick-match queue.');
      return;
    }

    setMessage('Pick an online player and send a direct challenge.');
  };

  const handleStakeChange = (value: number) => {
    setStake(value);
    if (status === 'error') {
      setStatus('idle');
      setMessage(mode === 'challenge' ? 'Pick an online player and send a direct challenge.' : 'Choose how you want to play.');
    }
  };

  const joinQueue = async () => {
    setStatus('searching');
    setMessage('Finding a worthy adversary for you.');

    try {
      const { data } = await matchmakingApi.joinQueue({
        gameType: 'tictactoe',
        stake,
        mode: 'quick_match',
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
      setMessage('Quick Match is not available yet. Ask the backend to implement `/matchmaking/queue/`.');
    }
  };

  const challengePlayer = async (opponentId: string) => {
    setActiveOpponentId(opponentId);
    setStatus('challenging');
    setMessage('Sending challenge request.');

    try {
      const { data } = await matchmakingApi.challengePlayer({
        gameType: 'tictactoe',
        stake,
        opponentId,
      });

      if (data.status === 'matched' && data.matchId) {
        navigate(`/game/${data.matchId}`);
        return;
      }

      setStatus('waiting');
      setMessage('Challenge sent. Waiting for the opponent to accept.');
    } catch (error) {
      console.error('Failed to challenge player', error);
      setStatus('error');
      setMessage('Challenge flow is not available yet. Ask the backend to implement `/matchmaking/challenge/`.');
    } finally {
      setActiveOpponentId(null);
    }
  };

  const cancelQueue = () => {
    setStatus('idle');
    setMessage(mode === 'quick_match' ? 'Queue cancelled. Choose your stake and enter again.' : 'Choose how you want to play.');
  };

  const goToBotDemo = () => {
    navigate('/game/demo?demo=1');
  };

  const isQueueBusy = mode === 'quick_match' && (status === 'searching' || status === 'waiting');
  const modeOptions = [
    { id: 'bot' as const, icon: Bot, label: 'Practice Bot', description: 'Frontend-only demo for instant testing.' },
    { id: 'quick_match' as const, icon: Swords, label: 'Quick Match', description: 'Stake and queue for any available player.' },
    { id: 'challenge' as const, icon: Users, label: 'Challenge Player', description: 'See online players and challenge one directly.' },
  ];
  const stakeOptions = [100, 500, 1000];

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-zinc-500 transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        <div className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-zinc-950 to-black p-6 shadow-2xl shadow-primary/5 md:p-8">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              Tic Tac Toe Lobby
            </div>
            <h1 className="text-3xl font-shrikhand uppercase tracking-widest text-primary md:text-4xl">Choose Match Type</h1>
            <p className={`mt-3 max-w-2xl text-sm font-medium ${status === 'error' ? 'text-red-400' : 'text-zinc-400'}`}>
              {message}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {modeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleModeChange(option.id)}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  mode === option.id
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <option.icon size={24} className={mode === option.id ? 'text-primary' : 'text-zinc-500'} />
                <div className="mt-4 text-sm font-black uppercase tracking-widest">{option.label}</div>
                <div className="mt-2 text-sm leading-6 text-zinc-500">{option.description}</div>
              </button>
            ))}
          </div>

          {mode !== 'bot' && (
            <div className="mt-8">
              <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Stake</div>
              <div className="grid grid-cols-3 gap-3 md:max-w-sm">
                {stakeOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleStakeChange(option)}
                    disabled={status === 'searching' || status === 'challenging'}
                    className={`rounded-2xl border px-5 py-3 font-black transition-all ${
                      stake === option
                        ? 'border-primary bg-primary text-black'
                        : 'border-border bg-card text-zinc-300 hover:border-primary/50'
                    }`}
                  >
                    N{option.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'bot' && (
            <div className="mt-8 max-w-md rounded-3xl border border-border bg-card p-5">
              <div className="mb-2 text-sm font-black uppercase tracking-widest text-primary">Practice Bot</div>
              <div className="text-sm leading-6 text-zinc-400">
                This uses the local demo board so you can test turns, wins, draws, and resets without waiting for backend matchmaking.
              </div>
              <button
                onClick={goToBotDemo}
                className="mt-5 rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01]"
              >
                Play Practice Bot
              </button>
            </div>
          )}

          {mode === 'quick_match' && (
            <div className="mt-8">
              <button
                onClick={joinQueue}
                disabled={isQueueBusy}
                className="min-w-56 rounded-2xl bg-primary px-8 py-4 font-black uppercase tracking-widest text-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {isQueueBusy ? 'In Queue' : 'Find Match'}
              </button>

              {isQueueBusy && (
                <button
                  onClick={cancelQueue}
                  className="ml-0 mt-3 block rounded-2xl border border-zinc-800 px-8 py-3 font-black uppercase tracking-widest text-zinc-400 transition-colors hover:border-primary/40 hover:text-primary md:ml-4 md:inline-block md:mt-0"
                >
                  Cancel Search
                </button>
              )}

              {isQueueBusy && (
                <div className="mt-6 flex items-center gap-3 text-sm font-bold text-zinc-500">
                  <Loader2 className="animate-spin text-primary" size={18} />
                  <span>Waiting for a real player.</span>
                </div>
              )}
            </div>
          )}

          {mode === 'challenge' && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Available Players</div>
                {playersHint && <div className="text-xs font-bold text-zinc-500">{playersHint}</div>}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {playersLoading && (
                  <div className="rounded-3xl border border-border bg-card p-5 text-sm font-bold text-zinc-500">
                    Loading players...
                  </div>
                )}

                {!playersLoading && availablePlayers.map((player) => (
                  <div key={player.id} className="rounded-3xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-black uppercase tracking-widest text-foreground">{player.username}</div>
                        <div className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                          {player.tier || 'Bronze'} • Rank {player.rank || 1000}
                        </div>
                        <div className="mt-3 text-sm text-zinc-400">
                          Preferred stake: N{(player.preferredStake || stake).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        {player.status || 'online'}
                      </div>
                    </div>

                    <button
                      onClick={() => challengePlayer(player.id)}
                      disabled={status === 'challenging' && activeOpponentId === player.id}
                      className="mt-5 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
                    >
                      {status === 'challenging' && activeOpponentId === player.id ? 'Sending...' : `Challenge for N${stake.toLocaleString()}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
