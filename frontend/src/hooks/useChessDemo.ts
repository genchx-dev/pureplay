import { useEffect, useState, useRef } from 'react';
import { Chess } from 'chess.js';

// Serialize chess.js board to our Record<string, string> board format
const serializeChessBoard = (chess: Chess): Record<string, string> => {
  const boardMap: Record<string, string> = {};
  const board = chess.board();
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const square = board[r][f];
      if (square) {
        const sqName = files[f] + ranks[r];
        const color = square.color; // 'w' or 'b'
        const type = square.type;   // 'p', 'r', 'n', 'b', 'q', 'k'
        boardMap[sqName] = color + type;
      }
    }
  }
  return boardMap;
};

export const useChessDemo = () => {
  const chessRef = useRef<Chess>(new Chess());
  
  const [board, setBoard] = useState<Record<string, string>>({});
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X'); // X = White, O = Black
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [status, setStatus] = useState<'playing' | 'finished' | 'draw'>('playing');

  // Load initial board state
  useEffect(() => {
    setBoard(serializeChessBoard(chessRef.current));
  }, []);

  // Timer logic
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value > 1) return value - 1;
        // Swap turn on timeout
        setCurrentPlayer((player) => (player === 'X' ? 'O' : 'X'));
        return 20;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  // Trigger bot move if it is Black's (O) turn in demo mode
  useEffect(() => {
    if (status !== 'playing' || currentPlayer !== 'O') return;

    const botTimer = setTimeout(() => {
      const chess = chessRef.current;
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) {
        checkGameStatus();
        return;
      }

      // Simple AI: pick a random legal move
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      
      // Apply bot move
      chess.move({
        from: randomMove.from,
        to: randomMove.to,
        promotion: randomMove.promotion, // e.g. 'q' if available
      });

      setBoard(serializeChessBoard(chess));
      setTimeLeft(20);
      
      if (chess.isGameOver()) {
        checkGameStatus();
      } else {
        setCurrentPlayer('X');
      }
    }, 1000);

    return () => clearTimeout(botTimer);
  }, [currentPlayer, status]);

  const checkGameStatus = () => {
    const chess = chessRef.current;
    if (chess.isCheckmate()) {
      // If active turn was White (X) when checkmated -> Black (O) won
      setWinner(chess.turn() === 'w' ? 'O' : 'X');
      setStatus('finished');
    } else if (chess.isGameOver()) {
      setWinner('draw');
      setStatus('draw');
    }
  };

  const sendMove = (uciMove: string | number) => {
    if (status !== 'playing' || currentPlayer !== 'X') return;
    
    const moveStr = String(uciMove);
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length >= 5 ? moveStr.charAt(4) : undefined;

    const chess = chessRef.current;
    
    try {
      // Validate and apply user move
      const moveResult = chess.move({
        from,
        to,
        promotion,
      });

      if (moveResult) {
        setBoard(serializeChessBoard(chess));
        setTimeLeft(20);

        if (chess.isGameOver()) {
          checkGameStatus();
        } else {
          setCurrentPlayer('O');
        }
      }
    } catch (err) {
      console.warn("Invalid demo chess move:", err);
    }
  };

  const reconnect = () => {
    chessRef.current = new Chess();
    setBoard(serializeChessBoard(chessRef.current));
    setCurrentPlayer('X');
    setWinner(null);
    setTimeLeft(20);
    setStatus('playing');
  };

  // Map moves back to UCI strings list (e.g. ["e2e4"]) for ChessBoard highlights
  const uciLegalMoves = chessRef.current.moves({ verbose: true }).map(m => {
    return m.from + m.to + (m.promotion || '');
  });

  return {
    board,
    timeLeft,
    status,
    currentPlayer,
    playerSymbol: 'X' as const, // User plays as White
    winner,
    error: null,
    payout: null,
    series: null,
    sendMove,
    reconnect,
    legalMoves: uciLegalMoves,
    gameType: 'chess' as const,
    boardTheme: 'lichess',
    customStyles: {
      player1: { pieceSet: 'fantasy', gradStart: '#ffffff', gradEnd: '#bfd3d7', stroke: '#000000', shadow: '#101216' },
      player2: { pieceSet: 'fantasy', gradStart: '#7f899b', gradEnd: '#1c1c2f', stroke: '#000000', shadow: '#000000' }
    }
  };
};
