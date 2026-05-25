from apps.games.tictactoe.engine import TicTacToeEngine

ENGINES = {
    'tictactoe': TicTacToeEngine(),
    # Add more games here
}

def get_engine(game_type: str):
    engine = ENGINES.get(game_type)
    if not engine:
        raise ValueError(f"Unknown game type: {game_type}")
    return engine