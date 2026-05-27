import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/game.store';
import { useGameSocket } from '../../hooks/useGameSocket';
import { RotateCw, Award } from 'lucide-react';

const BOARD_THEMES: Record<string, { light: string; dark: string; name: string }> = {
  lichess: { light: '#f0d9b5', dark: '#b58863', name: 'Lichess Sand' },
  chesscom: { light: '#eeeed2', dark: '#769656', name: 'Chess.com Green' },
  midnight: { light: '#475569', dark: '#1e293b', name: 'Midnight Slate' },
  blue: { light: '#93c5fd', dark: '#1e40af', name: 'Cobalt Blue' },
};

interface ChessBoardProps {
  board?: Record<string, string>;
  currentPlayer?: 'X' | 'O';
  playerSymbol?: 'X' | 'O' | null;
  status?: string;
  legalMoves?: string[];
  boardTheme?: string;
  customStyles?: Record<string, any>;
  sendMove?: (move: string) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board: propBoard,
  currentPlayer: propCurrentPlayer,
  playerSymbol: propPlayerSymbol,
  status: propStatus,
  legalMoves: propLegalMoves,
  boardTheme: propBoardTheme,
  customStyles: propCustomStyles,
  sendMove: propSendMove,
}) => {
  const store = useGameStore();
  const socket = useGameSocket();

  const board = propBoard !== undefined ? propBoard : store.board;
  const currentPlayer = propCurrentPlayer !== undefined ? propCurrentPlayer : store.currentPlayer;
  const playerSymbol = propPlayerSymbol !== undefined ? propPlayerSymbol : store.playerSymbol;
  const status = propStatus !== undefined ? propStatus : store.status;
  const legalMoves = propLegalMoves !== undefined ? propLegalMoves : store.legalMoves;
  const boardTheme = propBoardTheme !== undefined ? propBoardTheme : store.boardTheme;
  const customStyles = propCustomStyles !== undefined ? propCustomStyles : store.customStyles;
  const sendMove = propSendMove !== undefined ? propSendMove : socket.sendMove;

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);

  // Initialize board flip state based on player side (Black starts flipped)
  useEffect(() => {
    if (playerSymbol === 'O') {
      setIsFlipped(true);
    } else {
      setIsFlipped(false);
    }
  }, [playerSymbol]);

  // Map backend board (Record<string, string>) safely
  const boardMap = (board && typeof board === 'object' && !Array.isArray(board))
    ? (board as Record<string, string>)
    : {};

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Resolve pieces sets
  const player1Customs = customStyles?.player1 || {};
  const player2Customs = customStyles?.player2 || {};

  const wSet = player1Customs.pieceSet || 'fantasy';
  const bSet = player2Customs.pieceSet || 'fantasy';

  // Customize dynamic styling for each SVG piece embed element
  const handlePieceLoad = (e: React.SyntheticEvent<HTMLEmbedElement, Event>, pieceCode: string) => {
    const embedEl = e.currentTarget;
    try {
      const svgDoc = embedEl.getSVGDocument();
      if (!svgDoc) return;
      const svg = svgDoc.querySelector('svg');
      if (!svg) return;

      const isWhite = pieceCode.startsWith('w');
      const styles = isWhite ? player1Customs : player2Customs;

      const fill1 = styles.gradStart || (isWhite ? '#ffffff' : '#7f899b');
      const fill2 = styles.gradEnd || (isWhite ? '#bfd3d7' : '#1c1c2f');
      const strokeCol = styles.stroke || '#000000';
      const shadowColor = styles.shadow || (isWhite ? '#101216' : '#000000');

      // Stop colors for linear gradients inside SVG
      const stop0 = svg.querySelector('#fillGradient #stop0');
      const stop1 = svg.querySelector('#fillGradient #stop1');
      if (stop0) (stop0 as any).style.stopColor = fill1;
      if (stop1) (stop1 as any).style.stopColor = fill2;

      // Inject custom styling
      const styleFill = svg.querySelector('#fill-color');
      const styleStroke = svg.querySelector('#stroke-color');
      const styleMedium = svg.querySelector('#stroke-medium');
      const styleBoundary = svg.querySelector('#stroke-boundary');

      // Default stroke weights matching sandbox testing config
      const strokeSize = 18;
      const boundarySize = 30;

      if (styleFill) styleFill.textContent = `.fill-color { fill: ${fill1}; }`;
      if (styleStroke) styleStroke.textContent = `.stroke-color { stroke: ${strokeCol}; }`;
      if (styleMedium) styleMedium.textContent = `.stroke-medium { stroke-width: ${strokeSize}; }`;
      if (styleBoundary) styleBoundary.textContent = `.stroke-boundary { stroke-width: ${boundarySize}; }`;

      // Soft drop shadows
      const shadowPath = svg.querySelector('#shadow');
      const blurFilter = svg.querySelector('#filterBlur');

      if (shadowPath) {
        (shadowPath as any).style.display = '';
        (shadowPath as any).style.fill = shadowColor;
      }

      // 3D projection parameters from sandbox configuration
      const slant = 5;
      const flatten = 7;
      const blur = 25;
      const diag = 40;

      const svgSize = 933.333;
      const margin = 80;
      const figSize = svgSize - 2 * margin;
      const slantRatio = Math.tan((slant * Math.PI) / 180);
      const shadowRelYscale = (100 - flatten) / 100;
      const effectiveBlur = blur * 0.5;
      const effectiveFigSize = figSize * 0.5;
      const xOff = figSize * shadowRelYscale * slantRatio + 2 * effectiveBlur + diag;
      const yOff = 2 * effectiveBlur + diag;
      const scale = Math.min(svgSize / (figSize + Math.max(xOff, yOff)), figSize / (figSize + diag));
      const dy1 = margin - margin * scale;
      const dy2 = svgSize - margin - (margin + figSize + diag) * scale;
      const dx1 = margin - margin * scale;
      const dx2 = svgSize - margin - (margin + figSize + diag + effectiveFigSize * slantRatio) * scale;
      const dy = (dy1 + dy2) / 2;
      const dx = (dx1 + dx2) / 2;
      const shadowYscale = shadowRelYscale * scale;

      svg.querySelectorAll('path, rect, ellipse').forEach((p) => {
        if (p.id === 'shadow') {
          const bb = (p as any).getBBox();
          const test_y = bb.y + bb.height;
          const new_x = -slantRatio * test_y;
          const new_y = shadowYscale * test_y;
          const sdx = dx - new_x + diag;
          const sdy = dy + scale * test_y - new_y + diag;
          p.setAttribute('transform', `matrix(${scale}, 0, ${-slantRatio}, ${shadowYscale}, ${sdx}, ${sdy})`);
        } else {
          p.setAttribute('transform', `matrix(${scale}, 0, 0, ${scale}, ${dx}, ${dy})`);
        }
      });

      if (blurFilter) {
        const blurEl = blurFilter.querySelector('feGaussianBlur');
        if (blurEl) blurEl.setAttribute('stdDeviation', `${blur} ${blur}`);
      }
    } catch (err) {
      console.warn('SVG piece styling load warning:', err);
    }
  };

  const isMyTurn = status === 'playing' && (!playerSymbol || currentPlayer === playerSymbol);

  // Check if piece belongs to current player
  const isOwnPiece = (pieceCode: string) => {
    if (!pieceCode) return false;
    const isPieceWhite = pieceCode.startsWith('w');
    return playerSymbol === 'X' ? isPieceWhite : !isPieceWhite;
  };

  // Find legal moves starting from the selected square
  const getDestinations = (sq: string) => {
    return legalMoves
      ?.filter((m) => m.startsWith(sq))
      ?.map((m) => ({
        dest: m.substring(2, 4),
        isPromotion: m.length >= 5,
      })) || [];
  };

  const dests = selectedSquare ? getDestinations(selectedSquare) : [];

  const handleSquareClick = (sqId: string) => {
    if (!isMyTurn) return;

    const piece = boardMap[sqId];

    // Select piece
    if (piece && isOwnPiece(piece)) {
      setSelectedSquare(sqId);
      return;
    }

    // Make move if clicking a highlighted destination
    const destination = dests.find((d) => d.dest === sqId);
    if (selectedSquare && destination) {
      if (destination.isPromotion) {
        setPromotionMove({ from: selectedSquare, to: sqId });
      } else {
        sendMove(selectedSquare + sqId);
        setSelectedSquare(null);
      }
    } else {
      setSelectedSquare(null);
    }
  };

  const handlePromotionSelect = (pieceChar: string) => {
    if (promotionMove) {
      sendMove(promotionMove.from + promotionMove.to + pieceChar);
      setPromotionMove(null);
      setSelectedSquare(null);
    }
  };

  const themeColors = BOARD_THEMES[boardTheme || 'lichess'] || BOARD_THEMES.lichess;

  // Generate board squares layout (flipped or normal)
  const orderedRanks = isFlipped ? [...ranks].reverse() : ranks;
  const orderedFiles = isFlipped ? [...files].reverse() : files;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Board Controls */}
      <div className="w-full flex justify-between items-center mb-4 px-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-full border border-zinc-800">
          Theme: <span className="text-primary font-bold">{themeColors.name}</span>
        </span>
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors"
        >
          <RotateCw size={12} className="text-zinc-500" />
          Flip Board
        </button>
      </div>

      {/* Main Board Container */}
      <div className="relative w-full aspect-square bg-zinc-950 border border-zinc-800/80 rounded-2xl p-2 shadow-2xl overflow-hidden">
        
        {/* Promotion Selection Modal */}
        {promotionMove && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <Award className="text-primary mb-2 animate-bounce" size={32} />
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Pawn Promotion</h3>
            <p className="text-[10px] text-zinc-500 mb-6 font-medium">Select a piece to promote your pawn into:</p>
            <div className="grid grid-cols-4 gap-3 max-w-xs w-full">
              {[
                { label: 'Queen', char: 'q', type: 'q' },
                { label: 'Rook', char: 'r', type: 'r' },
                { label: 'Bishop', char: 'b', type: 'b' },
                { label: 'Knight', char: 'n', type: 'n' },
              ].map((p) => {
                const isWhite = playerSymbol === 'X';
                const pSet = isWhite ? wSet : bSet;
                return (
                  <button
                    key={p.char}
                    onClick={() => handlePromotionSelect(p.char)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-primary/40 active:scale-95 transition-all group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-zinc-950/60 rounded-xl mb-1.5 group-hover:scale-105 transition-transform overflow-hidden">
                      <embed
                        src={`/chess-assets/${pSet}/${p.type}.svg`}
                        className="w-10 h-10 object-contain pointer-events-none"
                        onLoad={(e) => handlePieceLoad(e, `${isWhite ? 'w' : 'b'}${p.char}`)}
                      />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 8x8 Grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden border border-black/50 shadow-inner">
          {orderedRanks.map((rank, rIdx) =>
            orderedFiles.map((file, fIdx) => {
              const sqId = file + rank;
              const isDark = (rIdx + fIdx) % 2 !== 0;
              const squareColor = isDark ? themeColors.dark : themeColors.light;
              const piece = boardMap[sqId]; // e.g. "wr"
              
              const isSelected = selectedSquare === sqId;
              const isDest = dests.some((d) => d.dest === sqId);
              const isCapture = isDest && !!piece;

              return (
                <div
                  key={sqId}
                  onClick={() => handleSquareClick(sqId)}
                  className="relative w-full h-full flex items-center justify-center cursor-pointer select-none group aspect-square"
                  style={{ backgroundColor: squareColor }}
                >
                  {/* Coordinates labels: show on board edges */}
                  {/* File labels on bottom rank */}
                  {rIdx === 7 && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[8px] font-black pointer-events-none"
                      style={{ color: isDark ? themeColors.light : themeColors.dark }}
                    >
                      {file}
                    </span>
                  )}
                  {/* Rank labels on left file */}
                  {fIdx === 0 && (
                    <span
                      className="absolute top-0.5 left-1 text-[8px] font-black pointer-events-none"
                      style={{ color: isDark ? themeColors.light : themeColors.dark }}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Highlight states */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 border-2 border-primary shadow-[inset_0_0_12px_rgba(255,204,51,0.25)] z-10" />
                  )}

                  {/* Piece element */}
                  {piece && (
                    <div
                      className={`w-[85%] h-[85%] flex items-center justify-center transition-transform duration-200 z-10 ${
                        isSelected ? 'scale-[1.08] drop-shadow-2xl' : 'hover:scale-[1.03]'
                      }`}
                    >
                      <embed
                        src={`/chess-assets/${piece.startsWith('w') ? wSet : bSet}/${piece[1]}.svg`}
                        className="w-full h-full object-contain pointer-events-none"
                        onLoad={(e) => handlePieceLoad(e, piece)}
                      />
                    </div>
                  )}

                  {/* Ghost hover/Legal move indicators */}
                  {isDest && (
                    <>
                      {isCapture ? (
                        // Red Ring for Captures
                        <div className="absolute w-[80%] h-[80%] border-4 border-destructive/60 rounded-full animate-pulse z-20 pointer-events-none" />
                      ) : (
                        // Standard Dot for Empty cells
                        <div className="absolute w-3 h-3 bg-primary/80 rounded-full shadow-[0_0_8px_rgba(255,204,51,0.5)] z-20 pointer-events-none" />
                      )}
                    </>
                  )}

                  {/* Ghost piece preview on hover for own turn empty cells */}
                  {!piece && isMyTurn && !isDest && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity duration-150 pointer-events-none z-10">
                      {/* Subtly show the pawn of your color as a hover guide */}
                      <embed
                        src={`/chess-assets/${playerSymbol === 'X' ? wSet : bSet}/p.svg`}
                        className="w-[80%] h-[80%] object-contain"
                        onLoad={(e) => handlePieceLoad(e, `${playerSymbol === 'X' ? 'w' : 'b'}p`)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
