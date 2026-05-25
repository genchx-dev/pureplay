import { useEffect, useState } from 'react';
import { ticTacToeEngine } from '../components/game/tictactoeEngine';
import type { BoardState, PlayerSymbol } from '../types/game.types';

export const useTicTacToeDemo = () => {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSymbol>('X');
  const [winner, setWinner] = useState<PlayerSymbol | 'draw' | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);

  const status = winner ? (winner === 'draw' ? 'draw' : 'finished') : 'playing';

  useEffect(() => {
    if (status !== 'playing') return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value > 1) return value - 1;
        setCurrentPlayer((player) => (player === 'X' ? 'O' : 'X'));
        return 10;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const sendMove = (position: number) => {
    if (status !== 'playing' || board[position] !== null) return;

    const nextBoard = ticTacToeEngine.makeMove(board, position, currentPlayer);
    const result = ticTacToeEngine.checkWinner(nextBoard);

    setBoard(nextBoard);
    setTimeLeft(10);

    if (result === 'Draw') {
      setWinner('draw');
      return;
    }

    if (result) {
      setWinner(result);
      return;
    }

    setCurrentPlayer((player) => (player === 'X' ? 'O' : 'X'));
  };

  const reconnect = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setTimeLeft(10);
  };

  return {
    board,
    timeLeft,
    status,
    currentPlayer,
    playerSymbol: currentPlayer,
    winner,
    error: null,
    payout: null,
    series: null,
    sendMove,
    reconnect,
  };
};
