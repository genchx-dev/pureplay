from apps.games.tictactoe.engine import TicTacToeEngine
from apps.games.chess.engine import ChessEngine

ENGINES = {
    'tictactoe': TicTacToeEngine(),
    'chess': ChessEngine(),
}

def get_engine(game_type: str):
    engine = ENGINES.get(game_type)
    if not engine:
        raise ValueError(f"Unknown game type: {game_type}")
    return engine