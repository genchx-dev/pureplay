import os

def fix_game_page():
    path = r"c:\Users\USER\pureplay\frontend\src\app\(main)\game\page.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    content_norm = content.replace("\r\n", "\n")

    # 1. Import WhotBoard
    import_target = "import { ChessBoard } from '../../../components/game/ChessBoard';"
    import_replacement = "import { ChessBoard } from '../../../components/game/ChessBoard';\nimport { WhotBoard } from '../../../components/game/WhotBoard';"

    # 2. Render WhotBoard
    render_target = """        {gameType === 'chess' ? (
          <div className="mb-10 w-full">
            <ChessBoard
              board={board as Record<string, string>}
              currentPlayer={currentPlayer}
              playerSymbol={playerSymbol}
              status={status}
              legalMoves={isDemoMode ? chessDemoGame?.legalMoves : undefined}
              boardTheme={isDemoMode ? chessDemoGame?.boardTheme : undefined}
              customStyles={isDemoMode ? chessDemoGame?.customStyles : undefined}
              sendMove={sendMove as (move: string) => void}
            />
          </div>
        ) : (
          <div
            className="p-6 rounded-[2.5rem] border border-zinc-800/80 shadow-2xl mb-10 bg-cover bg-center"
            style={{ backgroundImage: 'url(/tictactoe-assets/oak-wood.svg)' }}
          >"""

    render_replacement = """        {gameType === 'chess' ? (
          <div className="mb-10 w-full">
            <ChessBoard
              board={board as Record<string, string>}
              currentPlayer={currentPlayer}
              playerSymbol={playerSymbol}
              status={status}
              legalMoves={isDemoMode ? chessDemoGame?.legalMoves : undefined}
              boardTheme={isDemoMode ? chessDemoGame?.boardTheme : undefined}
              customStyles={isDemoMode ? chessDemoGame?.customStyles : undefined}
              sendMove={sendMove as (move: string) => void}
            />
          </div>
        ) : gameType === 'whot' ? (
          <div className="mb-10 w-full">
            <WhotBoard
              board={board}
              playerSymbol={playerSymbol}
              currentPlayer={currentPlayer}
              status={status}
              sendMove={sendMove}
              player1Username={player1Username}
              player2Username={player2Username}
            />
          </div>
        ) : (
          <div
            className="p-6 rounded-[2.5rem] border border-zinc-800/80 shadow-2xl mb-10 bg-cover bg-center"
            style={{ backgroundImage: 'url(/tictactoe-assets/oak-wood.svg)' }}
          >"""

    # 3. Format/Round display
    round_target = """          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-bold">
              {gameType === 'chess' ? 'Format' : 'Round'}
            </div>
            <div className="text-sm font-black text-primary uppercase mt-0.5">
              {gameType === 'chess' ? 'Single' : (isDemoMode ? demoRound : currentRound)}
            </div>
          </div>"""
    
    # Wait, in the source code it is:
    # <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
    # (without double font-bold)
    # Let's search exactly for what is in lines 641 to 648:
    # 641:           <div className="bg-card rounded-2xl p-3 border border-border text-center">
    # 642:             <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
    # 643:               {gameType === 'chess' ? 'Format' : 'Round'}
    # 644:             </div>
    # 645:             <div className="text-sm font-black text-primary uppercase mt-0.5">
    # 646:               {gameType === 'chess' ? 'Single' : (isDemoMode ? demoRound : currentRound)}
    # 647:             </div>
    # 648:           </div>
    
    round_target_exact = """          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              {gameType === 'chess' ? 'Format' : 'Round'}
            </div>
            <div className="text-sm font-black text-primary uppercase mt-0.5">
              {gameType === 'chess' ? 'Single' : (isDemoMode ? demoRound : currentRound)}
            </div>
          </div>"""

    round_replacement = """          <div className="bg-card rounded-2xl p-3 border border-border text-center">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              {(gameType === 'chess' || gameType === 'whot') ? 'Format' : 'Round'}
            </div>
            <div className="text-sm font-black text-primary uppercase mt-0.5">
              {(gameType === 'chess' || gameType === 'whot') ? 'Single' : (isDemoMode ? demoRound : currentRound)}
            </div>
          </div>"""

    changed = False
    if import_target in content_norm:
        content_norm = content_norm.replace(import_target, import_replacement)
        changed = True
        print("Imported WhotBoard in page.tsx")

    render_target_norm = render_target.replace("\r\n", "\n")
    if render_target_norm in content_norm:
        content_norm = content_norm.replace(render_target_norm, render_replacement)
        changed = True
        print("Patched WhotBoard rendering in page.tsx")
    else:
        print("Render target not found in page.tsx!")

    round_target_exact_norm = round_target_exact.replace("\r\n", "\n")
    if round_target_exact_norm in content_norm:
        content_norm = content_norm.replace(round_target_exact_norm, round_replacement)
        changed = True
        print("Patched Format/Round panel in page.tsx")
    else:
        print("Round target not found in page.tsx!")

    if changed:
        with open(path, "w", encoding="utf-8", newline="\r\n") as f:
            f.write(content_norm)
        print("Successfully saved page.tsx!")

if __name__ == "__main__":
    fix_game_page()
