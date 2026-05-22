import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Loader2, RefreshCw, Swords, Users } from 'lucide-react';
import { matchmakingApi } from '../../../services/api/matchmaking.api';
import type { AvailablePlayer, MatchmakingMode, OpenMatch } from '../../../types/matchmaking.types';

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
  const [openMatches, setOpenMatches] = useState<OpenMatch[]>([]);
  const [openMatchesLoading, setOpenMatchesLoading] = useState(false);
  const [acceptingMatchId, setAcceptingMatchId] = useState<string | null>(null);

  const loadOpenMatches = useCallback(async (silent = false) => {
    if (!silent) setOpenMatchesLoading(true);
    try {
      const { data } = await matchmakingApi.getOpenMatches('tictactoe', stake);
      setOpenMatches(data);
      return data;
    } catch (error) {
       console.error('Failed to fetch open matches', error);
       setOpenMatches([]);
       return [];
    } finally {
      if (!silent) setOpenMatchesLoading(false);
    }
  }, [stake]);

  const checkQueueStatus = useCallback(async () => {
    const { data } = await matchmakingApi.joinQueue({
      gameType: 'tictactoe',
      stake,
      mode: 'quick_match',
    });

    if (data.status === 'matched' && data.matchId) {
      navigate(`/game/${data.matchId}`);
      return true;
    }

    return false;
  }, [navigate, stake]);

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
          setPlayersHint(data.length === 0 ? 'No players are available at this stake right now.' : '');
        }
      } catch (error) {
        console.error('Failed to fetch available players', error);
        if (!cancelled) {
          setAvailablePlayers([]);
          setPlayersHint('Could not load players. Please check your connection.');
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

  useEffect(() => {
    if (mode !== 'quick_match' || status !== 'waiting') return;

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const matched = await checkQueueStatus();
        if (!matched && !cancelled) {
          await loadOpenMatches(true);
          setMessage('Searching. Accept an open challenge or wait for another player to accept yours.');
        }
      } catch (error) {
        console.error('Failed to poll matchmaking queue', error);
        if (!cancelled) {
          setStatus('error');
          setMessage('Lost connection to matchmaking. Try searching again.');
        }
      }
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [checkQueueStatus, loadOpenMatches, mode, status]);

  const handleModeChange = async (nextMode: MatchmakingMode) => {
    if (status === 'waiting') {
      await matchmakingApi.cancelQueue().catch(() => undefined);
    }

    setMode(nextMode);
    setStatus('idle');
    setActiveOpponentId(null);
    setOpenMatches([]);

    if (nextMode === 'bot') {
      setMessage('Practice against the local demo bot flow without waiting for backend matchmaking.');
      return;
    }

    if (nextMode === 'quick_match') {
      setMessage('Search open challenges or publish your own stake.');
      return;
    }

    setMessage('Pick an online player and send a direct challenge.');
  };

  const handleStakeChange = (value: number) => {
    setStake(value);
    setOpenMatches([]);
    if (status === 'error') {
      setStatus('idle');
      setMessage(mode === 'challenge' ? 'Pick an online player and send a direct challenge.' : 'Choose how you want to play.');
    }
  };

  const joinQueue = async () => {
    setStatus('searching');
    setMessage('Searching for open challenges.');

    try {
      await checkQueueStatus();
      await loadOpenMatches();
      setStatus('waiting');
      setMessage('Accept an open challenge below, or keep this screen open so another player can accept yours.');
    } catch (error) {
      console.error('Failed to join matchmaking queue', error);
      setStatus('error');
      setMessage('Quick Match is unavailable right now. Try again shortly.');
    }
  };

  const acceptOpenMatch = async (queueId: string) => {
    setAcceptingMatchId(queueId);
    setMessage('Accepting challenge.');

    try {
      const { data } = await matchmakingApi.acceptOpenMatch({ queueId });
      if (data.status === 'matched' && data.matchId) {
        navigate(`/game/${data.matchId}`);
        return;
      }
      await loadOpenMatches();
      setMessage('That challenge is no longer available. Pick another one.');
    } catch (error) {
      console.error('Failed to accept open match', error);
      setStatus('error');
      setMessage('Could not accept that challenge. Refresh the list and try again.');
    } finally {
      setAcceptingMatchId(null);
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
      setMessage('Challenge flow is unavailable right now. Try again shortly.');
    } finally {
      setActiveOpponentId(null);
    }
  };

  const cancelQueue = async () => {
    try {
      await matchmakingApi.cancelQueue();
    } catch (error) {
      console.error('Failed to cancel matchmaking queue', error);
    }
    setStatus('idle');
    setOpenMatches([]);
    setMessage(mode === 'quick_match' ? 'Search cancelled. Choose your stake and search again.' : 'Choose how you want to play.');
  };

  const refreshOpenMatches = async () => {
    try {
      await loadOpenMatches();
      setMessage('Open challenges refreshed.');
    } catch (error) {
      console.error('Failed to refresh open matches', error);
      setStatus('error');
      setMessage('Could not refresh open challenges.');
    }
  };

  const goToBotDemo = () => {
    navigate('/game/demo?demo=1');
  };

  const isQueueBusy = mode === 'quick_match' && (status === 'searching' || status === 'waiting');
  const modeOptions = [
    { id: 'bot' as const, icon: Bot, label: 'Practice Bot', description: 'Frontend-only demo for instant testing.' },
    { id: 'quick_match' as const, icon: Swords, label: 'Quick Match', description: 'Search stakes, publish yours, and accept a player.' },
    { id: 'challenge' as const, icon: Users, label: 'Challenge Player', description: 'Pick a player and send a direct invite.' },
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
                    disabled={status === 'searching' || status === 'challenging' || status === 'waiting'}
                    className={`rounded-2xl border px-5 py-3 font-black transition-all ${
                      stake === option
                        ? 'border-primary bg-primary text-black'
                        : 'border-border bg-card text-zinc-300 hover:border-primary/50'
                    } disabled:opacity-60`}
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <button
                  onClick={joinQueue}
                  disabled={isQueueBusy}
                  className="min-w-56 rounded-2xl bg-primary px-8 py-4 font-black uppercase tracking-widest text-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isQueueBusy ? 'Searching' : 'Search Matches'}
                </button>

                <button
                  onClick={refreshOpenMatches}
                  disabled={openMatchesLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 px-6 py-4 text-sm font-black uppercase tracking-widest text-zinc-400 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  <RefreshCw size={16} className={openMatchesLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>

                {isQueueBusy && (
                  <button
                    onClick={cancelQueue}
                    className="rounded-2xl border border-zinc-800 px-6 py-4 text-sm font-black uppercase tracking-widest text-zinc-400 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    Cancel Search
                  </button>
                )}
              </div>

              {isQueueBusy && (
                <div className="mt-6 flex items-center gap-3 text-sm font-bold text-zinc-500">
                  <Loader2 className="animate-spin text-primary" size={18} />
                  <span>Your stake is visible to other players.</span>
                </div>
              )}

              {(isQueueBusy || openMatches.length > 0 || openMatchesLoading) && (
                <div className="mt-8">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Open Challenges</div>
                    <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      Stake N{stake.toLocaleString()}
                    </div>
                  </div>

                  {openMatchesLoading && (
                    <div className="rounded-3xl border border-border bg-card p-5 text-sm font-bold text-zinc-500">
                      Loading open challenges...
                    </div>
                  )}

                  {!openMatchesLoading && openMatches.length === 0 && (
                    <div className="rounded-3xl border border-border bg-card p-5 text-sm leading-6 text-zinc-400">
                      No one is waiting at this stake yet. Keep this screen open and another player can accept your search.
                    </div>
                  )}

                  {!openMatchesLoading && openMatches.length > 0 && (
                    <div className="grid gap-3 md:grid-cols-2">
                      {openMatches.map((match) => (
                        <div key={match.id} className="rounded-3xl border border-border bg-card p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-black uppercase tracking-widest text-foreground">{match.player.username}</div>
                              <div className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                                {match.player.tier || 'Bronze'} / Rank {match.player.rank || 1000}
                              </div>
                            </div>
                            <div className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black">
                              N{match.stake.toLocaleString()}
                            </div>
                          </div>

                          <button
                            onClick={() => acceptOpenMatch(match.id)}
                            disabled={acceptingMatchId === match.id}
                            className="mt-5 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
                          >
                            {acceptingMatchId === match.id ? 'Accepting...' : `Accept Challenge N${match.stake.toLocaleString()}`}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-xs font-bold leading-5 text-primary">
                Challenge alerts use the phone number attached to each player account.
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
                          {player.tier || 'Bronze'} / Rank {player.rank || 1000}
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
