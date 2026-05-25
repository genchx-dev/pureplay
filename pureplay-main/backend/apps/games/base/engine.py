from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional

class AbstractGameEngine(ABC):
    @abstractmethod
    def get_initial_state(self, player1_id: str, player2_id: str, **kwargs) -> Dict[str, Any]:
        """Return initial game_state dict with board, currentPlayer, players mapping, etc."""
        pass

    @abstractmethod
    def validate_move(self, game_state: Dict[str, Any], player_symbol: str, move: Any) -> Tuple[bool, str]:
        """Return (is_valid, error_message)."""
        pass

    @abstractmethod
    def apply_move(self, game_state: Dict[str, Any], player_symbol: str, move: Any) -> Dict[str, Any]:
        """Return new game_state after applying move (no side effects)."""
        pass

    @abstractmethod
    def check_game_over(self, game_state: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Any]]:
        """Return (is_over, winner_symbol_or_draw, extra_data)."""
        pass

    @abstractmethod
    def get_current_player(self, game_state: Dict[str, Any]) -> str:
        """Return symbol of player whose turn it is (e.g., 'X' or 'O')."""
        pass

    def get_opponent_symbol(self, symbol: str) -> str:
        """Return the opponent's symbol. Override if not 'X'/'O'."""
        return 'O' if symbol == 'X' else 'X'