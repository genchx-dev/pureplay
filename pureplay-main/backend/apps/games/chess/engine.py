from typing import Dict, Any, Tuple, Optional
import chess
from apps.games.base.engine import AbstractGameEngine

def serialize_board(board: chess.Board) -> Dict[str, str]:
    board_dict = {}
    for sq in chess.SQUARES:
        piece = board.piece_at(sq)
        if piece:
            color = 'w' if piece.color == chess.WHITE else 'b'
            symbol = piece.symbol().lower()
            board_dict[chess.square_name(sq)] = color + symbol
    return board_dict

class ChessEngine(AbstractGameEngine):
    turn_seconds = 20

    def get_initial_state(self, player1_id: str, player2_id: str, **kwargs) -> Dict[str, Any]:
        stake = str(kwargs.get('stake', 0))
        players = {'X': player1_id}
        if player2_id:
            players['O'] = player2_id
            
        board = chess.Board()
        
        return {
            'board': serialize_board(board),
            'fen': board.fen(),
            'currentPlayer': 'X',  # X represents White
            'players': players,
            'stake': stake,
            'gameType': 'chess',
            'turnEndsAt': None,
            'legalMoves': [m.uci() for m in board.legal_moves]
        }

    def validate_move(self, game_state: Dict[str, Any], player_symbol: str, move: str) -> Tuple[bool, str]:
        if game_state.get('currentPlayer') != player_symbol:
            return False, "Not your turn"
            
        fen = game_state.get('fen', chess.STARTING_FEN)
        board = chess.Board(fen)
        
        try:
            chess_move = chess.Move.from_uci(str(move))
        except ValueError:
            return False, "Invalid move format (UCI expected)"
            
        if chess_move not in board.legal_moves:
            return False, "Illegal chess move"
            
        return True, ""

    def apply_move(self, game_state: Dict[str, Any], player_symbol: str, move: str) -> Dict[str, Any]:
        new_state = game_state.copy()
        
        fen = game_state.get('fen', chess.STARTING_FEN)
        board = chess.Board(fen)
        
        chess_move = chess.Move.from_uci(str(move))
        board.push(chess_move)
        
        new_state['fen'] = board.fen()
        new_state['board'] = serialize_board(board)
        
        # Switch turn
        new_state['currentPlayer'] = self.get_opponent_symbol(player_symbol)
        
        # Recalculate legal moves
        new_state['legalMoves'] = [m.uci() for m in board.legal_moves]
        
        return new_state

    def check_game_over(self, game_state: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Any]]:
        fen = game_state.get('fen', chess.STARTING_FEN)
        board = chess.Board(fen)
        
        if board.is_checkmate():
            # If White (X) turn is active, White is checkmated -> Black (O) wins
            winner = 'O' if board.turn == chess.WHITE else 'X'
            return True, winner, None
            
        if board.is_game_over():
            return True, 'draw', None
            
        return False, None, None

    def get_current_player(self, game_state: Dict[str, Any]) -> str:
        return game_state['currentPlayer']

    def get_opponent_symbol(self, symbol: str) -> str:
        return 'O' if symbol == 'X' else 'X'

    def skip_turn(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        state = game_state.copy()
        fen = state.get('fen', chess.STARTING_FEN)
        board = chess.Board(fen)
        board.turn = not board.turn
        state['fen'] = board.fen()
        state['board'] = serialize_board(board)
        state['currentPlayer'] = self.get_opponent_symbol(state['currentPlayer'])
        state['legalMoves'] = [m.uci() for m in board.legal_moves]
        return state
