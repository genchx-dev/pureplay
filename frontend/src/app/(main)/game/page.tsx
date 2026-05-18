import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { X, User, Dice5, Zap, Sparkles, Target, Circle, Trophy, Wifi, WifiOff } from 'lucide-react';
import { useGameSocket } from '../../../hooks/useGameSocket';
import { useTicTacToeDemo } from '../../../hooks/useTicTacToeDemo';

import tictactoeLogo from '../../../assets/games/tic-tac-toe 2.svg';

export const GamePage = () => {
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [searchParams] = useSearchParams();
  const isDemoMode = searchParams.get('demo') === '1';
  const liveGame = useGameSocket(isDemoMode ? undefined : matchId);
  const demoGame = useTicTacToeDemo();
  const { board, timeLeft, status, currentPlayer, playerSymbol, winner, error, sendMove, reconnect } = isDemoMode ? demoGame : liveGame;
  const isMyTurn = status === 'playing' && (!playerSymbol || currentPlayer === playerSymbol);

  const handleMove = (index: number) => {
    if (board[index] === null && isMyTurn) {
      sendMove(index);
    }
  };

  const statusLabel = status === 'playing' ? 'LIVE' : status === 'finished' || status === 'draw' ? 'GAME OVER' : 'CONNECTING...';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col p-4 min-h-screen">
        <header className="flex justify-between items-center mb-8 pt-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="text-zinc-500" />
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <img src={tictactoeLogo} alt="Logo" className="w-6 h-6" />
              <h1 className="text-xl font-shrikhand text-primary tracking-widest uppercase">Tic Tac Toe</h1>
            </div>
            <div className="flex items-center gap-1 mt-1">
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
          </div>
          <div className="bg-card px-4 py-1.5 rounded-full border border-border flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${timeLeft < 5 ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
            <span className="font-mono font-bold text-sm">{timeLeft}s</span>
          </div>
        </header>

        {(error || status === 'finished' || status === 'draw') && (
          <div className={`mb-6 rounded-2xl border p-4 text-center text-sm font-bold ${
            error ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-primary/30 bg-primary/10 text-primary'
          }`}>
            {error || (winner === 'draw' ? 'Match ended in a draw' : `${winner || 'Winner'} wins the match`)}
            {error && (
              <button
                onClick={reconnect}
                className="mt-3 block w-full rounded-xl bg-red-500/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-100 transition-colors hover:bg-red-500/30"
              >
                Reconnect
              </button>
            )}
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
            <div className={`w-20 h-20 rounded-2xl bg-card border-2 ${isMyTurn ? 'border-primary shadow-primary/10' : 'border-border'} shadow-xl flex items-center justify-center transition-all`}>
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
            <div className={`w-20 h-20 rounded-2xl bg-card border-2 ${!isMyTurn && status === 'playing' ? 'border-primary/60' : 'border-border'} shadow-xl flex items-center justify-center transition-all`}>
              <User className="text-zinc-600" size={40} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">Player 2</span>
              <span className="text-sm font-bold text-zinc-500">OPPONENT</span>
            </div>
          </div>
        </div>

        <div className="mb-4 text-center text-xs font-black uppercase tracking-widest text-zinc-500">
          {status === 'playing' ? (isMyTurn ? 'Your Turn' : `${currentPlayer}'s Turn`) : 'Waiting for match state'}
        </div>

        <div className="bg-card p-4 rounded-[2.5rem] border border-border shadow-2xl mb-10">
          <div className="grid grid-cols-3 gap-3 aspect-square">
            {board.map((cell, idx) => (
              <button
                key={idx}
                disabled={cell !== null || !isMyTurn}
                onClick={() => handleMove(idx)}
                className="group relative bg-background rounded-2xl border-2 border-border flex items-center justify-center transition-all hover:border-primary/50 active:scale-95 disabled:cursor-default"
              >
                {cell === 'X' && (
                  <div className="animate-in zoom-in duration-300">
                    <X className="text-primary" size={48} strokeWidth={3} />
                  </div>
                )}
                {cell === 'O' && (
                  <div className="animate-in zoom-in duration-300">
                    <Circle className="text-foreground" size={40} strokeWidth={3} />
                  </div>
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
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Play More & Win Big</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { icon: <Dice5 />, label: 'Dice' },
              { icon: <Sparkles />, label: 'Spin' },
              { icon: <Zap />, label: 'Cards' },
              { icon: <Target />, label: 'Darts' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-zinc-600 border border-border hover:border-primary/30 hover:text-primary transition-all cursor-not-allowed">
                  {item.icon}
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
