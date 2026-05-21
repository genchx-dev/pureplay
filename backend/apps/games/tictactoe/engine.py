from typing import Dict, Optional, Tuple, Any

class TicTacToeEngine:
    def initial_state(self) -> Dict:
        return {
            "board": [["", "", ""] for _ in range(3)],
            "current_turn": None,
        }
    
    def validate_move(self, state: Dict, player_id: str, move: Dict) -> Tuple[bool, str]:
        board = state["board"]
        row = move.get("row")
        col = move.get("col")
        if not (0 <= row < 3 and 0 <= col < 3):
            return False, "Invalid position"
        if board[row][col] != "":
            return False, "Cell taken"
        if state.get("current_turn") and state["current_turn"] != player_id:
            return False, "Not your turn"
        return True, ""
    
    def apply_move(self, state: Dict, move: Dict) -> Dict:
        new_state = {
            "board": [row[:] for row in state["board"]],
            "current_turn": state["current_turn"],
        }
        row, col = move["row"], move["col"]
        # Determine symbol: X for player1, O for player2 (simplified)
        # We'll let caller manage symbol via player mapping, but for MVP:
        # Just use 'X' for any move, 'O' for other – but better to pass symbol.
        # To keep simple: we store 'X' or 'O' based on player.
        # Actually, we should compute whose turn it is from state.
        # Simpler: accept symbol in move.
        symbol = move.get("symbol", "X")
        new_state["board"][row][col] = symbol
        return new_state
    
    def check_winner(self, state: Dict) -> Optional[str]:
        board = state["board"]
        # Check rows, columns, diagonals for three identical non-empty
        for i in range(3):
            if board[i][0] and board[i][0] == board[i][1] == board[i][2]:
                return board[i][0]
            if board[0][i] and board[0][i] == board[1][i] == board[2][i]:
                return board[0][i]
        if board[0][0] and board[0][0] == board[1][1] == board[2][2]:
            return board[0][0]
        if board[0][2] and board[0][2] == board[1][1] == board[2][0]:
            return board[0][2]
        return None
    
    def is_draw(self, state: Dict) -> bool:
        return all(cell != "" for row in state["board"] for cell in row) and not self.check_winner(state)