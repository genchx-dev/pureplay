import random
from typing import Dict, Any, Tuple, Optional
from apps.games.base.engine import AbstractGameEngine

class WhotEngine(AbstractGameEngine):
    turn_seconds = 15

    SHAPES = ['Circle', 'Triangle', 'Cross', 'Square', 'Star']

    def get_initial_state(self, player1_id: str, player2_id: str, **kwargs) -> Dict[str, Any]:
        stake = str(kwargs.get('stake', 0))
        players = {'X': player1_id}
        if player2_id:
            players['O'] = player2_id

        # Generate a standard Whot deck
        deck = []
        for s in self.SHAPES:
            for v in range(1, 15):
                deck.append({'shape': s, 'value': v})
        for _ in range(5):
            deck.append({'shape': 'Whot', 'value': 20})

        random.shuffle(deck)

        # Distribute cards (5 cards each)
        hand_x = [deck.pop(0) for _ in range(5)]
        hand_o = [deck.pop(0) for _ in range(5)]

        # Draw first pile card (must not be special card: 2, 8, 14, or Whot)
        start_idx = 0
        for idx, card in enumerate(deck):
            if card['shape'] != 'Whot' and card['value'] not in [2, 8, 14]:
                start_idx = idx
                break
        first_card = deck.pop(start_idx)

        # Initial log
        logs = ["Game started!"]

        return {
            'board': {
                'hands': {
                    'X': hand_x,
                    'O': hand_o
                },
                'pile': [first_card],
                'drawCount': len(deck),
                'neededShape': None,
                'fx': None,
                'winner': None,
                'logs': logs
            },
            'draw_pile': deck,
            'currentPlayer': 'X',
            'players': players,
            'stake': stake,
            'gameType': 'whot',
            'turnEndsAt': None,
        }

    def validate_move(self, game_state: Dict[str, Any], player_symbol: str, move: Any) -> Tuple[bool, str]:
        if game_state.get('currentPlayer') != player_symbol:
            return False, "Not your turn"

        if not isinstance(move, dict):
            return False, "Invalid move format"

        action = move.get('action')
        board = game_state.get('board', {})
        hands = board.get('hands', {})
        hand = hands.get(player_symbol, [])

        if action == 'draw':
            return True, ""

        elif action == 'play':
            card_index = move.get('card_index')
            if card_index is None or not isinstance(card_index, int):
                return False, "Card index missing or invalid"

            if card_index < 0 or card_index >= len(hand):
                return False, "Card index out of range"

            card = hand[card_index]
            top_card = board['pile'][-1]
            needed_shape = board.get('neededShape')
            fx = board.get('fx')

            # 1. Counter Pick Two
            if fx and fx.get('type') == 'pick2':
                if card['value'] != 2 and card['shape'] != 'Whot':
                    return False, f"Must counter with a 2 or a Whot, or draw {fx.get('count')} cards"
            else:
                # 2. Match Shape or Value
                if card['shape'] != 'Whot':
                    expected_shape = needed_shape if needed_shape else top_card['shape']
                    if card['shape'] != expected_shape and card['value'] != top_card['value']:
                        return False, f"Card doesn't match shape ({expected_shape}) or value ({top_card['value']})"

            # 3. Whot wildcard shape call check
            if card['shape'] == 'Whot':
                whot_shape = move.get('whot_shape')
                if whot_shape not in self.SHAPES:
                    return False, f"Must specify a valid shape to call from: {self.SHAPES}"

            return True, ""

        return False, f"Unknown action: {action}"

    def apply_move(self, game_state: Dict[str, Any], player_symbol: str, move: Any) -> Dict[str, Any]:
        new_state = game_state.copy()
        board = new_state['board'].copy()
        hands = board['hands'].copy()
        hand = list(hands[player_symbol])
        pile = list(board['pile'])
        draw_pile = list(new_state.get('draw_pile', []))
        logs = list(board.get('logs', []))

        action = move['action']

        # Map symbol to display names (or just keep X and O for frontend translation)
        player_name = player_symbol

        if action == 'draw':
            fx = board.get('fx')
            num_to_draw = 1
            if fx and fx.get('type') == 'pick2':
                num_to_draw = fx.get('count', 2)
                board['fx'] = None
                logs.append(f"{player_name} drew {num_to_draw} cards from pick-two")
            else:
                logs.append(f"{player_name} drew a card")

            for _ in range(num_to_draw):
                if not draw_pile:
                    # Recycle pile
                    if len(pile) > 1:
                        top_card = pile[-1]
                        recycled = pile[:-1]
                        random.shuffle(recycled)
                        draw_pile = recycled
                        pile = [top_card]
                if draw_pile:
                    card = draw_pile.pop(0)
                    hand.append(card)

            board['hands'] = hands
            hands[player_symbol] = hand
            board['pile'] = pile
            board['drawCount'] = len(draw_pile)
            new_state['draw_pile'] = draw_pile
            
            # Switch turn to opponent
            new_state['currentPlayer'] = self.get_opponent_symbol(player_symbol)

        elif action == 'play':
            card_index = move['card_index']
            card = hand.pop(card_index)
            pile.append(card)
            
            # Reset neededShape unless overwritten by Whot
            board['neededShape'] = None

            card_desc = f"WHOT!" if card['shape'] == 'Whot' else f"{card['value']} of {card['shape']}"
            logs.append(f"{player_name} played {card_desc}")

            # Check if won
            if len(hand) == 0:
                hands[player_symbol] = hand
                board['hands'] = hands
                board['pile'] = pile
                board['winner'] = player_symbol
                board['logs'] = logs[-10:]
                new_state['board'] = board
                new_state['winner'] = player_symbol
                return new_state

            next_player = self.get_opponent_symbol(player_symbol)

            # Special card effects
            if card['value'] == 2:
                prev_fx = board.get('fx')
                if prev_fx and prev_fx.get('type') == 'pick2':
                    board['fx'] = {'type': 'pick2', 'count': prev_fx.get('count', 0) + 2}
                else:
                    board['fx'] = {'type': 'pick2', 'count': 2}
                logs.append("Pick-two activated!")
            elif card['value'] == 8:
                # Suspension (skip opponent, same player plays again)
                next_player = player_symbol
                logs.append(f"Suspension! {player_name} goes again")
            elif card['value'] == 14:
                # General Market (opponent draws 1 card, current player turn ends)
                logs.append("General Market! Opponent draws 1")
                opp_symbol = self.get_opponent_symbol(player_symbol)
                opp_hand = list(hands[opp_symbol])
                
                # Draw 1 for opponent
                if not draw_pile:
                    if len(pile) > 1:
                        top_card = pile[-1]
                        recycled = pile[:-1]
                        random.shuffle(recycled)
                        draw_pile = recycled
                        pile = [top_card]
                if draw_pile:
                    opp_card = draw_pile.pop(0)
                    opp_hand.append(opp_card)

                hands[opp_symbol] = opp_hand
                board['drawCount'] = len(draw_pile)
                new_state['draw_pile'] = draw_pile
            elif card['shape'] == 'Whot':
                # Call shape
                whot_shape = move.get('whot_shape')
                board['neededShape'] = whot_shape
                logs.append(f"{player_name} called: {whot_shape}")

            board['hands'] = hands
            hands[player_symbol] = hand
            board['pile'] = pile
            new_state['currentPlayer'] = next_player

        board['logs'] = logs[-10:]
        new_state['board'] = board
        return new_state

    def check_game_over(self, game_state: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[Any]]:
        board = game_state.get('board', {})
        winner = board.get('winner')
        if winner:
            return True, winner, None
        return False, None, None

    def get_current_player(self, game_state: Dict[str, Any]) -> str:
        return game_state.get('currentPlayer', 'X')

    def get_opponent_symbol(self, symbol: str) -> str:
        return 'O' if symbol == 'X' else 'X'

    def skip_turn(self, game_state: Dict[str, Any]) -> Dict[str, Any]:
        """Draw a card and skip the turn of the timed-out player."""
        state = game_state.copy()
        current = self.get_current_player(state)
        # Check if pick2 is active or standard draw
        return self.apply_move(state, current, {"action": "draw"})

    def get_bot_move(self, game_state: Dict[str, Any], player_symbol: str) -> Dict[str, Any]:
        board = game_state['board']
        hand = board['hands'][player_symbol]
        top_card = board['pile'][-1]
        needed_shape = board.get('neededShape')
        fx = board.get('fx')

        # Check playable card indices
        playable_indices = []
        for idx, card in enumerate(hand):
            is_legal = False
            if fx and fx.get('type') == 'pick2':
                is_legal = (card['value'] == 2 or card['shape'] == 'Whot')
            else:
                if card['shape'] == 'Whot':
                    is_legal = True
                else:
                    expected_shape = needed_shape if needed_shape else top_card['shape']
                    is_legal = (card['shape'] == expected_shape or card['value'] == top_card['value'])
            if is_legal:
                playable_indices.append(idx)

        # Counter pick-two
        if fx and fx.get('type') == 'pick2':
            if playable_indices:
                idx = playable_indices[0]
                card = hand[idx]
                whot_shape = random.choice(self.SHAPES) if card['shape'] == 'Whot' else None
                return {"action": "play", "card_index": idx, "whot_shape": whot_shape}
            else:
                return {"action": "draw"}

        if playable_indices:
            # Bot AI heuristic options:
            # 1. Win if 1 card left
            if len(hand) == 1:
                idx = playable_indices[0]
                card = hand[idx]
                whot_shape = random.choice(self.SHAPES) if card['shape'] == 'Whot' else None
                return {"action": "play", "card_index": idx, "whot_shape": whot_shape}

            # 2. Attack with pick2 if opponent has few cards
            opp_symbol = self.get_opponent_symbol(player_symbol)
            opp_card_count = len(board['hands'][opp_symbol])
            if opp_card_count <= 3:
                for idx in playable_indices:
                    if hand[idx]['value'] == 2:
                        return {"action": "play", "card_index": idx, "whot_shape": None}

            # 3. Suspension (value 8)
            for idx in playable_indices:
                if hand[idx]['value'] == 8:
                    return {"action": "play", "card_index": idx, "whot_shape": None}

            # 4. Shape match
            expected_shape = needed_shape if needed_shape else top_card['shape']
            for idx in playable_indices:
                if hand[idx]['shape'] != 'Whot' and hand[idx]['shape'] == expected_shape:
                    return {"action": "play", "card_index": idx, "whot_shape": None}

            # 5. Value match
            for idx in playable_indices:
                if hand[idx]['shape'] != 'Whot' and hand[idx]['value'] == top_card['value']:
                    return {"action": "play", "card_index": idx, "whot_shape": None}

            # 6. General market (value 14)
            for idx in playable_indices:
                if hand[idx]['value'] == 14:
                    return {"action": "play", "card_index": idx, "whot_shape": None}

            # 7. Whot wildcard
            for idx in playable_indices:
                if hand[idx]['shape'] == 'Whot':
                    # Call the shape that bot has most of in hand
                    hand_shapes = [c['shape'] for c in hand if c['shape'] != 'Whot']
                    called_shape = max(set(hand_shapes), default=random.choice(self.SHAPES))
                    return {"action": "play", "card_index": idx, "whot_shape": called_shape}

            # Fallback
            idx = playable_indices[0]
            card = hand[idx]
            whot_shape = random.choice(self.SHAPES) if card['shape'] == 'Whot' else None
            return {"action": "play", "card_index": idx, "whot_shape": whot_shape}

        return {"action": "draw"}
