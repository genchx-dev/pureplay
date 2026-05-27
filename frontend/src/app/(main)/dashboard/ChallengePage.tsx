import { useState, useEffect } from 'react';
import { Bell, Send, Swords, Play, Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChallengeStore } from '../../../store/challenge.store';
import { useRankingStore } from '../../../store/ranking.store';
import { useAuthStore } from '../../../store/auth.store';
import { useWalletStore } from '../../../store/wallet.store';
import { TierBadge } from './LeaderboardPage';
import { PlayerProfileModal } from './PlayerProfileModal';
import type { LeaderboardPlayer } from '../../../types/ranking.types';

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

export const ChallengePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const simulateIncoming = useChallengeStore((state) => state.simulateIncoming);
  const sendChallenge = useChallengeStore((state) => state.sendChallenge);
  
  const {
    incomingChallenges,
    acceptChallenge,
    declineChallenge,
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

  const {
    searchResults,
    searchLoading,
    searchPlayers,
    clearSearch,
  } = useRankingStore();

  const [query, setQuery] = useState('');
  const [stake, setStake] = useState(500);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      clearSearch();
      return;
    }
    const timer = setTimeout(() => {
      searchPlayers(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchPlayers, clearSearch]);

  const handleChallenge = (opponentId: string, opponentName: string) => {
    sendChallenge(opponentId, opponentName, stake);
  };

  const handleSimulate = () => {
    const names = ['AlphaGamer', 'ShadowSniper', 'NaijaPro', 'VortexPlay', 'DeltaSquad'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomStake = [100, 500, 1000][Math.floor(Math.random() * 3)];
    simulateIncoming(randomName, randomStake);
  };

  const stakeOptions = [100, 500, 1000];

  return (
    <div className="px-4 pb-24 pt-6 md:px-6 space-y-6 max-w-2xl mx-auto w-full">
      {/* Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          player={selectedPlayer}
          isMe={selectedPlayer.username === user?.username}
          onClose={() => setSelectedPlayer(null)}
          onChallenge={() => {
            const opponent = selectedPlayer;
            setSelectedPlayer(null);
            handleChallenge(opponent.username, opponent.username);
          }}
        />
      )}

      {/* Pending Challenges Section */}
      {incomingChallenges.length > 0 && (
        <section className="rounded-3xl border border-red-500/20 bg-zinc-950 p-5 sm:p-6 shadow-xl shadow-red-500/5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <Bell size={18} className="animate-pulse" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-red-400">
                Pending Invitations ({incomingChallenges.length})
              </h2>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {incomingChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-2xl border border-zinc-800 bg-black/40 p-4 flex flex-col justify-between gap-4 hover:border-zinc-700/60 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-widest text-white truncate">
                      {challenge.challenger.username}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <TierBadge tierName={challenge.challenger.tier} xp={100} />
                      <span className="text-zinc-500 text-[10px] font-bold font-mono">Rank {challenge.challenger.rank}</span>
                    </div>
                    <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Game: <span className="text-primary">{challenge.gameType === 'chess' ? 'Chess' : 'Tic Tac Toe'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Stake</div>
                    <div className="text-sm font-black text-primary font-mono mt-0.5">
                      {formatMoney(challenge.stake)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDecline(challenge.id)}
                    className="rounded-xl border border-zinc-800 bg-card py-2 text-xs font-black uppercase tracking-widest text-zinc-400 transition-all hover:border-red-500/40 hover:text-red-400 active:scale-95 flex items-center justify-center gap-1"
                  >
                    <X size={12} />
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(challenge.id)}
                    className="rounded-xl bg-primary py-2 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-primary/10 transition-all hover:brightness-110 active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Swords size={12} strokeWidth={2.5} />
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Challenge Card */}
      <section className="rounded-3xl border border-primary/20 bg-zinc-950 p-5 sm:p-6 shadow-xl shadow-primary/5">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-black">
          <Swords size={24} strokeWidth={2.5} />
        </div>

        <h1 className="text-xl font-shrikhand uppercase tracking-widest text-primary">
          Challenge Center
        </h1>
        <p className="mt-2 text-xs font-semibold leading-5 text-zinc-400">
          Find opponents by username, select your stake, and send direct live match challenges instantly.
        </p>

        {/* Stake Selector */}
        <div className="mt-6">
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Select Stake</div>
          <div className="grid grid-cols-3 gap-2.5 max-w-xs">
            {stakeOptions.map((option) => (
              <button
                key={option}
                onClick={() => setStake(option)}
                className={`rounded-xl border py-2.5 text-xs font-black transition-all ${
                  stake === option
                    ? 'border-primary bg-primary text-black'
                    : 'border-zinc-800 bg-black text-zinc-400 hover:border-primary/40'
                }`}
              >
                {formatMoney(option)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Search Opponent</div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-primary transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter opponent's username..."
              className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-10 pr-9 text-xs font-semibold placeholder:text-zinc-500 text-white focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search Results Grid */}
      {query.trim() !== '' && (
        <div className="space-y-3">
          <div className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500">Search Results</div>
          
          {searchLoading ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-8 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Searching players...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 text-center text-xs font-bold text-zinc-500">
              No players found matching "{query}".
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {searchResults.map((player) => {
                const total = player.wins + player.losses + player.draws;
                const winRate = total > 0 ? Math.round((player.wins / total) * 100) : 0;
                return (
                  <div
                    key={player.username}
                    onClick={() => setSelectedPlayer(player)}
                    className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 cursor-pointer hover:bg-zinc-900/10 hover:border-zinc-700/60 transition-all relative group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors truncate">
                          {player.username}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <TierBadge tierName={player.tier} xp={player.xp} />
                        </div>
                        <div className="mt-3 text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-tighter">
                          Win Rate: <span className="text-zinc-300">{winRate}%</span> · Wins: <span className="text-green-500">{player.wins}</span>
                        </div>
                      </div>
                      <div className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-green-400 shrink-0">
                        Online
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChallenge(player.username, player.username);
                      }}
                      className="mt-4 w-full rounded-xl bg-primary py-2.5 text-xs font-black uppercase tracking-widest text-black transition-transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Swords size={12} />
                      Challenge ({formatMoney(stake)})
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info and Simulators Section */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Send size={12} />
            Send Direct Challenges
          </div>
          <p className="text-xs leading-5 text-zinc-500">
            Type any player's name above to challenge them. In production, invitations expire after 60 seconds.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Bell size={12} />
            Invite Alerts
          </div>
          <p className="text-xs leading-5 text-zinc-500">
            Phone notifications will trigger SMS alerts when another user challenges your profile.
          </p>
        </div>
      </div>

      {/* Navigation Shortcut & Simulator Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => navigate('/matchmaking')}
          className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 px-6 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 hover:border-zinc-700 sm:w-auto"
        >
          Open Tic Tac Toe Lobby
        </button>
        
        <button
          onClick={handleSimulate}
          className="w-full rounded-2xl border-2 border-primary/20 bg-primary/5 px-6 py-4 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/10 active:scale-[0.98] sm:w-auto flex items-center justify-center gap-1.5"
        >
          <Play size={14} strokeWidth={3} className="text-primary" />
          Simulate Incoming Challenge
        </button>
      </div>
    </div>
  );
};
