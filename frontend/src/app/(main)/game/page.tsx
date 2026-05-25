import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { X, User, Circle, Trophy, Wifi, WifiOff, RotateCcw, Swords } from 'lucide-react';
import { useGameSocket } from '../../../hooks/useGameSocket';
import { useTicTacToeDemo } from '../../../hooks/useTicTacToeDemo';
import { comingSoonGames, ticTacToeGame } from '../../../data/games';
import { useWalletStore } from '../../../store/wallet.store';

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
    sendMove,
    reconnect,
  } = isDemoMode ? demoGame : liveGame;

  const isMyTurn = status === 'playing' && (!playerSymbol || currentPlayer === playerSymbol);
  const winningLine = getWinningLine(board);

  const handleMove = (index: number) => {
    if (board[index] === null && isMyTurn) {
      sendMove(index);
    }
  };

  useEffect(() => {
    if (!isDemoMode && (status === 'finished' || status === 'draw')) {
      fetchBalance();
      fetchTransactions();
    }
  }, [fetchBalance, fetchTransactions, isDemoMode, status]);

  const statusLabel =
    status === 'playing'
      ? 'LIVE'
      : status === 'finished' || status === 'draw'
      ? 'GAME OVER'
      : 'CONNECTING...';

  const didWin = winner && winner !== 'draw' && playerSymbol === winner;

  const resultTitle =
    winner === 'draw' ? 'Draw Match' : didWin ? 'You Won' : 'Match Complete';

  const resultDescription =
    winner === 'draw'
      ? 'Both players held the board. Stakes are returned for this round.'
      : didWin
      ? 'Clean finish. Your wallet will update with the match payout.'
      : `${winner || 'Opponent'} wins this round.`;

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

        {(status === 'finished' || status === 'draw') && (
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
              onClick={reconnect}
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
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Player 1</span>
              <span className="text-sm font-bold">YOU ({playerSymbol || '...'})</span>
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
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Player 2</span>
              <span className="text-sm font-bold text-zinc-500">OPPONENT</span>
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
                disabled={cell !== null || !isMyTurn || status !== 'playing'}
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
                {cell === null && isMyTurn && status === 'playing' && (
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
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Match</div>
            <div className="text-xl font-black text-zinc-500">{matchId ? matchId.slice(0, 4) : '-'}</div>
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
