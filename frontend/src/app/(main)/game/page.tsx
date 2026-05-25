import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { X, User, Circle, Trophy, Wifi, WifiOff, RotateCcw, Swords, Coins } from 'lucide-react';
import { useGameSocket } from '../../../hooks/useGameSocket';
import { useTicTacToeDemo } from '../../../hooks/useTicTacToeDemo';
import { comingSoonGames, ticTacToeGame } from '../../../data/games';
import { useWalletStore } from '../../../store/wallet.store';
import { useAuth } from '../../../hooks/useAuth';
import { useRankingStore } from '../../../store/ranking.store';
import { useGameStore } from '../../../store/game.store';

const OPPONENTS = ['QuantumKing', 'ShadowMaster', 'ProGamerX', 'NightOwl', 'CryptoChamp', 'BlitzKing', 'TacticsGod', 'Dominator99', 'FlashPoint', 'XcelPlayer'];
const getRandomOpponent = (excludeUsername?: string) => {
  const filtered = OPPONENTS.filter(name => name !== excludeUsername);
  return filtered[Math.floor(Math.random() * filtered.length)];
};

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
];

const getWinningLine = (board: (string | null)[]): number[] | null => {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }
  return null;
};

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

export const GamePage = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === '1';
  
  // Parse stake from matchId or fallback to 500
  let calculatedStake = 500;
  if (matchId) {
    const parts = matchId.split(':');
    if (parts.length >= 3) {
      const parsedStake = Number(parts[2]);
      if (!Number.isNaN(parsedStake) && parsedStake > 0) {
        calculatedStake = parsedStake;
      }
    }
  }
  const totalPot = isDemoMode ? 0 : calculatedStake * 2;
  const estWinPot = isDemoMode ? 0 : Math.round(totalPot * 0.95);
  const fetchBalance = useWalletStore((state) => state.fetchBalance);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);

  const liveGame = useGameSocket(isDemoMode ? undefined : matchId);
  const demoGame = useTicTacToeDemo();
  const {
    board,
    timeLeft,
    status,
    currentPlayer,
    playerSymbol,
    winner,
    error,
    payout,
    series,
    sendMove,
    reconnect,
  } = isDemoMode ? demoGame : liveGame;

  // Retrieve state and usernames from global store
  const {
    player1Username,
    player2Username,
    currentRound,
    roundScores,
    roundWinner,
    setRoundWinner,
    setBoard,
  } = useGameStore();

  // Demo round tracking state
  const [demoRound, setDemoRound] = useState(1);
  const [demoScores, setDemoScores] = useState<Record<string, number>>({ X: 0, O: 0 });
  const [demoRoundWinner, setDemoRoundWinner] = useState<string | null>(null);
  const [demoIsGameOver, setDemoIsGameOver] = useState(false);
  const [demoFinalWinner, setDemoFinalWinner] = useState<string | null>(null);

  // For series: map wins to local 'You' and 'Opponent'
  const myWins = isDemoMode
    ? (playerSymbol === 'X' ? demoScores.X : demoScores.O)
    : (playerSymbol === 'X' ? (roundScores?.X || 0) : (roundScores?.O || 0));
  const opponentWins = isDemoMode
    ? (playerSymbol === 'X' ? demoScores.O : demoScores.X)
    : (playerSymbol === 'X' ? (roundScores?.O || 0) : (roundScores?.X || 0));
  const isSeriesComplete = isDemoMode
    ? demoIsGameOver
    : ((roundScores?.X || 0) >= 2 || (roundScores?.O || 0) >= 2);

  const isMyTurn = status === 'playing' && (!playerSymbol || currentPlayer === playerSymbol);
  const winningLine = getWinningLine(board);

  const handleMove = (index: number) => {
    if (board[index] === null && isMyTurn) {
      sendMove(index);
    }
  };

  const didWin = winner && winner !== 'draw' && playerSymbol === winner;

  const { user, checkAuth } = useAuth();
  const addMatchResult = useRankingStore((state) => state.addMatchResult);


  // Demo mode best-of-three engine simulation
  useEffect(() => {
    if (isDemoMode && winner && !demoIsGameOver) {
      setDemoRoundWinner(winner);
      
      let nextScores = { ...demoScores };
      if (winner !== 'draw') {
        nextScores = {
          ...demoScores,
          [winner]: (demoScores[winner] || 0) + 1
        };
        setDemoScores(nextScores);
      }

      // Check if someone reached 2 wins
      if (nextScores.X >= 2 || nextScores.O >= 2) {
        setDemoIsGameOver(true);
        setDemoFinalWinner(nextScores.X >= 2 ? 'X' : 'O');
        
        // Final game-over cleanup
        const timer = setTimeout(() => {
          setDemoRoundWinner(null);
        }, 3500);
        return () => clearTimeout(timer);
      } else {
        // Prepare next round
        const timer = setTimeout(() => {
          setDemoRoundWinner(null);
          reconnect(); // Reset local board
          setDemoRound(prev => prev + 1);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [winner, isDemoMode]);

  // Live mode best-of-three round transition effect
  useEffect(() => {
    if (!isDemoMode && roundWinner) {
      const timer = setTimeout(() => {
        setRoundWinner(null);
        setBoard(Array(9).fill(null));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [roundWinner, isDemoMode, setRoundWinner, setBoard]);

  const handleDemoReset = () => {
    reconnect();
    setDemoRound(1);
    setDemoScores({ X: 0, O: 0 });
    setDemoRoundWinner(null);
    setDemoIsGameOver(false);
    setDemoFinalWinner(null);
  };

  useEffect(() => {
    // If it's a series, only update ranking/balance when the WHOLE series is finished
    const shouldReport = isSeriesComplete || (!series && (status === 'finished' || status === 'draw'));

    if (!isDemoMode && shouldReport) {
      fetchBalance();
      fetchTransactions();
      
      if (user?.username) {
        const result = winner === 'draw' ? 'DRAW' : didWin ? 'WIN' : 'LOSS';
        const matchStake = payout ? ((payout.winnerAmount || 0) + (payout.platformFee || 0)) / 2 : 500;
        const opponentName = getRandomOpponent(user.username);
        
        addMatchResult(user.username, 'Tic Tac Toe', opponentName, result, matchStake);
      }
      
      checkAuth();
    }
  }, [fetchBalance, fetchTransactions, checkAuth, isDemoMode, status, user?.username, winner, didWin, payout, addMatchResult, isSeriesComplete, series]);

  const statusLabel =
    status === 'playing'
      ? 'LIVE'
      : (isDemoMode ? demoIsGameOver : (status === 'finished' || status === 'draw'))
      ? 'GAME OVER'
      : 'CONNECTING...';

  // Compute values dynamically
  const authUser = user?.username || 'YOU';
  const player1Name = isDemoMode ? authUser : (player1Username || 'Player 1');
  const player2Name = isDemoMode ? 'ShadowMaster' : (player2Username || 'Player 2');
  const currentRoundNum = isDemoMode ? demoRound : currentRound;
  const currentRoundScores = isDemoMode ? demoScores : roundScores;
  const activeRoundWinner = isDemoMode ? demoRoundWinner : roundWinner;

  const finalWinnerSymbol = isDemoMode ? demoFinalWinner : winner;
  const didFinalWin = finalWinnerSymbol && finalWinnerSymbol !== 'draw' && playerSymbol === finalWinnerSymbol;

  const resultTitle =
    finalWinnerSymbol === 'draw' ? 'Draw Match' : didFinalWin ? 'You Won' : 'Match Complete';

  const resultDescription = isDemoMode
    ? (finalWinnerSymbol === 'draw'
        ? 'Both players held the board.'
        : didFinalWin
        ? 'Great game! You won the practice series.'
        : 'Good try! Opponent won the practice series.')
    : (winner === 'draw'
        ? 'Both players held the board. Stakes are returned.'
        : didWin
        ? 'Clean finish. Your wallet will update with the match payout.'
        : `${winner || 'Opponent'} wins the match.`);

  const getCellClasses = (idx: number, cell: string | null) => {
    const isWinner = winningLine?.includes(idx);
    const base =
      'group relative rounded-2xl border-2 flex items-center justify-center transition-all duration-200 active:scale-95 disabled:cursor-default aspect-square';

    if (isWinner) {
      return `${base} border-primary bg-primary/10 shadow-[0_0_18px_2px_rgba(255,204,51,0.35)] scale-[1.04]`;
    }
    if (cell === null && isMyTurn) {
      return `${base} bg-background border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer`;
    }
    return `${base} bg-background border-border`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col p-4 min-h-screen">

        <header className="flex justify-between items-center mb-8 pt-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="text-zinc-500" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <img src={ticTacToeGame.image} alt="Logo" className="h-6 w-6 object-contain" />
            </div>
            {status === 'playing' ? (
              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <Wifi size={10} /> {statusLabel}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-bold">
                <WifiOff size={10} /> {statusLabel}
              </div>
            )}
          </div>

          <div className="bg-card px-4 py-1.5 rounded-full border border-border flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                timeLeft < 5 ? 'bg-destructive animate-pulse' : 'bg-primary'
              }`}
            />
            <span className="font-mono font-bold text-sm">{timeLeft}s</span>
          </div>
        </header>

        {/* Series Progress */}
        {(status === 'playing' || status === 'finished' || status === 'draw') && (
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">You</span>
              <div className="mt-1 flex gap-1">
                {[0, 1].map((i) => (
                  <div key={i} className={`h-1.5 w-8 rounded-full ${i < myWins ? 'bg-primary shadow-[0_0_8px_rgba(255,204,51,0.4)]' : 'bg-zinc-800'}`} />
                ))}
              </div>
            </div>
            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/50">
              Best of 3
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Opponent</span>
              <div className="mt-1 flex gap-1">
                {[0, 1].map((i) => (
                  <div key={i} className={`h-1.5 w-8 rounded-full ${i < opponentWins ? 'bg-primary shadow-[0_0_8px_rgba(255,204,51,0.4)]' : 'bg-zinc-800'}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Match Pot Badge */}
        <div className="mb-6 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-lg shadow-black/30 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Coins className="text-primary animate-pulse" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Match Stake</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            {isDemoMode ? (
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Practice Match (Free)</span>
            ) : (
              <>
                <span className="text-[10px] font-bold text-zinc-500 mr-2 uppercase">Est. Payout: NGN {estWinPot.toLocaleString()}</span>
                <span className="text-sm font-black text-primary">NGN {totalPot.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm font-bold text-red-300">
            {error}
            <button
              onClick={reconnect}
              className="mt-3 block w-full rounded-xl bg-red-500/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-100 transition-colors hover:bg-red-500/30"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Round Over Transition Overlay */}
        {activeRoundWinner && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="text-center max-w-sm flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 animate-bounce">
                <Trophy className="text-primary" size={32} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-widest text-primary mb-2">
                Round {currentRoundNum} Over
              </h2>
              <p className="text-base font-bold text-zinc-200 mb-6">
                {activeRoundWinner === 'draw'
                  ? 'Round ended in a Draw!'
                  : activeRoundWinner === playerSymbol
                  ? '🎉 YOU WON THE ROUND!'
                  : '❌ OPPONENT WON THE ROUND'}
              </p>
              
              <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 px-6 mb-8">
                <div className="text-center">
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[80px]">{player1Name}</div>
                  <div className="text-xl font-black text-primary mt-1">{currentRoundScores.X}</div>
                </div>
                <div className="text-zinc-700 font-bold text-lg">:</div>
                <div className="text-center">
                  <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest truncate max-w-[80px]">{player2Name}</div>
                  <div className="text-xl font-black text-zinc-100 mt-1">{currentRoundScores.O}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                Preparing Next Round...
              </div>
            </div>
          </div>
        )}

        {/* Round Scoreboard */}
        <div className="flex justify-between items-center mb-6 bg-zinc-950/60 border border-zinc-900 rounded-2xl py-3 px-4 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Round {currentRoundNum}</span>
            <span className="text-xs text-zinc-700">|</span>
            <span className="text-[9px] font-black uppercase tracking-wider text-primary">Best of 3</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-zinc-500 mr-1">X</span>
              {[1, 2].map((roundIndex) => (
                <div
                  key={roundIndex}
                  className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                    currentRoundScores.X >= roundIndex
                      ? 'bg-primary border-primary shadow-[0_0_8px_rgba(255,204,51,0.6)]'
                      : 'border-zinc-800 bg-zinc-950'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-zinc-500 mr-1">O</span>
              {[1, 2].map((roundIndex) => (
                <div
                  key={roundIndex}
                  className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                    currentRoundScores.O >= roundIndex
                      ? 'bg-foreground border-foreground shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                      : 'border-zinc-800 bg-zinc-950'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {(isDemoMode ? demoIsGameOver : (status === 'finished' || status === 'draw')) && (
          <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-black">
              <Trophy size={26} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest text-primary">
              {resultTitle}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-300">{resultDescription}</p>
            {payout && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-primary/20 bg-black/30 p-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Winner Payout</div>
                  <div className="mt-1 text-sm font-black text-primary">{formatMoney(payout.winnerAmount || 0)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Platform Fee</div>
                  <div className="mt-1 text-sm font-black text-zinc-300">{formatMoney(payout.platformFee || 0)}</div>
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/matchmaking')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-black"
              >
                <Swords size={15} />
                Rematch
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-xs font-black uppercase tracking-widest text-zinc-300"
              >
                <RotateCcw size={15} />
                Home
              </button>
            </div>
          </div>
        )}

        {isDemoMode && (
          <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center text-xs font-black uppercase tracking-widest text-primary">
            Demo Mode
            <button
              onClick={handleDemoReset}
              className="mt-3 block w-full rounded-xl bg-primary px-4 py-2 text-xs font-black text-black transition-transform hover:scale-[1.01]"
            >
              Reset Board
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-20 h-20 rounded-2xl bg-card border-2 ${
                isMyTurn ? 'border-primary shadow-[0_0_16px_2px_rgba(255,204,51,0.2)]' : 'border-border'
              } shadow-xl flex items-center justify-center transition-all duration-300`}
            >
              <User className="text-primary" size={40} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">PLAYER 1 (X)</span>
              <span className="text-sm font-bold truncate max-w-[120px]">
                {player1Name} {playerSymbol === 'X' && <span className="text-[9px] text-primary font-black">(YOU)</span>}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-full font-black uppercase tracking-widest border border-primary/20">
              VS
            </div>
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-20 h-20 rounded-2xl bg-card border-2 ${
                !isMyTurn && status === 'playing'
                  ? 'border-primary/60 shadow-[0_0_16px_2px_rgba(255,204,51,0.1)]'
                  : 'border-border'
              } shadow-xl flex items-center justify-center transition-all duration-300`}
            >
              <User className="text-zinc-600" size={40} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">PLAYER 2 (O)</span>
              <span className="text-sm font-bold text-zinc-300 truncate max-w-[120px]">
                {player2Name} {playerSymbol === 'O' && <span className="text-[9px] text-primary font-black">(YOU)</span>}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
          {status === 'playing'
            ? isMyTurn
              ? 'Your Turn'
              : `${currentPlayer}'s Turn`
            : 'Waiting for match state'}
        </div>

        <div className="bg-card p-4 rounded-[2.5rem] border border-border shadow-2xl mb-10">
          <div className="grid grid-cols-3 gap-3">
            {board.map((cell, idx) => (
              <button
                key={idx}
                disabled={cell !== null || !isMyTurn || status !== 'playing' || !!activeRoundWinner}
                onClick={() => handleMove(idx)}
                className={getCellClasses(idx, cell)}
              >
                {/* Placed piece */}
                {cell === 'X' && (
                  <span className="animate-pop">
                    <X
                      className={winningLine?.includes(idx) ? 'text-primary' : 'text-primary'}
                      size={48}
                      strokeWidth={3}
                    />
                  </span>
                )}
                {cell === 'O' && (
                  <span className="animate-pop">
                    <Circle
                      className={winningLine?.includes(idx) ? 'text-foreground' : 'text-foreground'}
                      size={40}
                      strokeWidth={3}
                    />
                  </span>
                )}

                {/* Ghost hover preview only on empty cells when it is your turn */}
                {cell === null && isMyTurn && status === 'playing' && !activeRoundWinner && (
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity duration-150 pointer-events-none">
                    {playerSymbol === 'X' ? (
                      <X size={48} strokeWidth={3} className="text-primary" />
                    ) : (
                      <Circle size={40} strokeWidth={3} className="text-foreground" />
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">You</div>
            <div className="text-xl font-black text-primary">{playerSymbol || '-'}</div>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Turn</div>
            <div className="text-xl font-black">{currentPlayer}</div>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Round</div>
            <div className="text-xl font-black text-primary">{currentRoundNum}</div>
          </div>
        </div>

        <div className="mt-auto pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-primary" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Coming Soon</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {comingSoonGames.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center border border-border overflow-hidden cursor-not-allowed opacity-70">
                  <img src={item.image} alt={item.label} className="h-full w-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

