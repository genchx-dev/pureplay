from typing import Dict, Any, Tuple, Optional
from apps.games.base.engine import AbstractGameEngine

class TicTacToeEngine(AbstractGameEngine):
    WIN_LINES = (
        (0, 1, 2), (3, 4, 5), (6, 7, 8),
        (0, 3, 6), (1, 4, 7), (2, 5, 8),
        (0, 4, 8), (2, 4, 6),
    )

    def get_initial_state(self, player1_id: str, player2_id: str, **kwargs) -> Dict[str, Any]:
        stake = str(kwargs.get('stake', 0))
        players = {'X': player1_id}
        if player2_id:
            players['O'] = player2_id
        return {
            'board': [None] * 9,
            'currentPlayer': 'X',
            'players': players,
            'stake': stake,
            'gameType': 'tictactoe',
            'turnEndsAt': None,
        }

    def validate_move(self, game_state: Dict[str, Any], player_symbol: str, move: int) -> Tuple[bool, str]:
        if not isinstance(move, int) or move < 0 or move > 8:
            return False, "Invalid move position"
        board = game_state['board']
        if board[move] is not None:
            return False, "Cell already taken"
        if game_state.get('currentPlayer') != player_symbol:
            return False, "Not your turn"
        return True, ""

    def apply_move(self, game_state: Dict[str, Any], player_symbol: str, move: int) -> Dict[str, Any]:
        new_state = game_state.copy()
        new_board = game_state['board'].copy()
        new_board[move] = player_symbol
        new_state['board'] = new_board
        # Switch turn
        new_state['currentPlayer'] = self.get_opponent_symbol(player_symbol)
        return new_state

    def check_game_over(self, game_state: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Any]]:
        board = game_state['board']
        for a, b, c in self.WIN_LINES:
            if board[a] and board[a] == board[b] == board[c]:
                return True, board[a], None
        if all(cell is not None for cell in board):
            return True, 'draw', None
        return False, None, None

    def get_current_player(self, game_state: Dict[str, Any]) -> str:
        return game_state['currentPlayer']

    def get_opponent_symbol(self, symbol: str) -> str:
        return 'O' if symbol == 'X' else 'X'