import asyncio
import json
from datetime import datetime
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token

from .services import make_move, player_symbol, skip_expired_turn, get_match_model


class MatchConsumer(AsyncWebsocketConsumer):

    # =========================
    # CONNECT / DISCONNECT
    # =========================

    async def connect(self):
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.room_group_name = f'match_{self.match_id}'
        self.turn_task = None

        self.user = await self.authenticate()

        if not self.user:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        await self.send_match_start()
        await self.schedule_turn_timeout()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        if self.turn_task:
            self.turn_task.cancel()

    # =========================
    # RECEIVE MOVES
    # =========================

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid message')
            return

        if data.get('type') != 'MAKE_MOVE':
            await self.send_error('Unsupported event')
            return

        position = (data.get('payload') or {}).get('position')

        try:
            res = await database_sync_to_async(make_move)(
                self.match_id,
                self.user.id,
                position
            )
            # make_move returns (match, event_type)
            match = res[0]
            event_type = res[1]
        except ValueError as exc:
            await self.send_error(str(exc))
            return

        series_info = self.get_series_info(match)

        if event_type == 'GAME_OVER':
            await self.handle_game_over(match, series_info)
            return

        # Broadcast MOVE_MADE
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'move_made',
                'board': match.game_state['board'],
                'nextPlayer': match.game_state['currentPlayer'],
                'turnEndsAt': match.game_state['turnEndsAt'],
                'series': series_info,
                'gameType': match.game_state.get('gameType', 'tictactoe'),
                'boardTheme': match.game_state.get('boardTheme', 'lichess'),
                'customStyles': match.game_state.get('customStyles', {}),
                'legalMoves': match.game_state.get('legalMoves', []),
                'fen': match.game_state.get('fen'),
            }
        )

        await self.schedule_turn_timeout()

    async def handle_game_over(self, match, series_info=None):
        winner_symbol = match.game_state.get('winner')
        game_type = match.game_state.get('gameType', 'tictactoe')
        if game_type == 'chess':
            reason = 'checkmate' if winner_symbol != 'draw' else 'draw'
        elif game_type == 'whot':
            reason = 'hand_cleared' if winner_symbol != 'draw' else 'draw'
        else:
            reason = 'board_full' if winner_symbol == 'draw' else 'three_in_row'

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_over',
                'winner': winner_symbol,
                'reason': reason,
                'board': match.game_state['board'],
                'series': series_info,
                'gameType': game_type,
                'boardTheme': match.game_state.get('boardTheme', 'lichess'),
                'customStyles': match.game_state.get('customStyles', {}),
                'fen': match.game_state.get('fen'),
            }
        )

    # =========================
    # BROADCAST EVENTS
    # =========================

    async def move_made(self, event):
        await self.send_json({
            'type': 'MOVE_MADE',
            'board': event['board'],
            'nextPlayer': event['nextPlayer'],
            'turnEndsAt': event['turnEndsAt'],
            'series': event.get('series'),
            'gameType': event.get('gameType', 'tictactoe'),
            'boardTheme': event.get('boardTheme', 'lichess'),
            'customStyles': event.get('customStyles', {}),
            'legalMoves': event.get('legalMoves', []),
            'fen': event.get('fen'),
        })

    async def turn_skip(self, event):
        await self.send_json({
            'type': 'TURN_SKIP',
            'skippedPlayer': event['skippedPlayer'],
            'nextPlayer': event['nextPlayer'],
            'board': event['board'],
            'turnEndsAt': event['turnEndsAt'],
            'series': event.get('series'),
            'gameType': event.get('gameType', 'tictactoe'),
            'boardTheme': event.get('boardTheme', 'lichess'),
            'customStyles': event.get('customStyles', {}),
            'legalMoves': event.get('legalMoves', []),
            'fen': event.get('fen'),
        })

    async def game_over(self, event):
        await self.send_json({
            'type': 'GAME_OVER',
            'winner': event['winner'],
            'reason': event['reason'],
            'board': event['board'],
            'series': event.get('series'),
            'gameType': event.get('gameType', 'tictactoe'),
            'boardTheme': event.get('boardTheme', 'lichess'),
            'customStyles': event.get('customStyles', {}),
            'fen': event.get('fen'),
        })

    async def next_match_event(self, event):
        await self.send_json({
            'type': 'NEXT_MATCH',
            'matchId': event['matchId']
        })

    async def broadcast_match_start(self, event):
        """Handler for when match becomes active (second player joins)."""
        match = await self.get_match()
        symbol = player_symbol(match, self.user.id)
        state = match.game_state or {}
        await self.send_json({
            'type': 'MATCH_START',
            'matchId': event['matchId'],
            'board': event['board'],
            'currentPlayer': event['currentPlayer'],
            'playerSymbol': symbol,
            'turnEndsAt': event['turnEndsAt'],
            'player1_username': event['player1_username'],
            'player2_username': event['player2_username'],
            'player1Username': event['player1_username'],
            'player2Username': event['player2_username'],
            'series': event['series'],
            'gameType': state.get('gameType', 'tictactoe'),
            'boardTheme': state.get('boardTheme', 'lichess'),
            'customStyles': state.get('customStyles', {}),
            'legalMoves': state.get('legalMoves', []),
            'fen': state.get('fen'),
            'isTournament': state.get('isTournament', False),
            'tournamentId': state.get('tournamentId'),
        })

    # =========================
    # MATCH START (initial connect)
    # =========================

    async def send_match_start(self):
        match = await self.get_match()
        symbol = player_symbol(match, self.user.id)
        state = match.game_state or {}
        series_info = self.get_series_info(match)

        await self.send_json({
            'type': 'MATCH_START',
            'matchId': str(match.id),
            'board': state.get('board') or [None] * 9,
            'currentPlayer': state.get('currentPlayer', 'X'),
            'playerSymbol': symbol,
            'turnEndsAt': state.get('turnEndsAt'),
            'player1Username': match.player1.username,
            'player2Username': match.player2.username if match.player2 else None,
            'player1_username': match.player1.username,
            'player2_username': match.player2.username if match.player2 else None,
            'currentRound': state.get('currentRound', 1),
            'roundScores': state.get('roundScores', {'X': 0, 'O': 0}),
            'series': series_info,
            'gameType': state.get('gameType', 'tictactoe'),
            'boardTheme': state.get('boardTheme', 'lichess'),
            'customStyles': state.get('customStyles', {}),
            'legalMoves': state.get('legalMoves', []),
            'fen': state.get('fen'),
            'isTournament': state.get('isTournament', False),
            'tournamentId': state.get('tournamentId'),
            'tournamentRoundNumber': state.get('tournamentRoundNumber'),
            'isTournamentFinal': state.get('isTournamentFinal', False),
        })

        if match.status == 'completed':
            await self.send_json({
                'type': 'GAME_OVER',
                'winner': state.get('winner'),
                'reason': 'finished',
                'board': state.get('board'),
                'series': series_info,
                'gameType': state.get('gameType', 'tictactoe'),
                'boardTheme': state.get('boardTheme', 'lichess'),
                'customStyles': state.get('customStyles', {}),
                'fen': state.get('fen'),
            })
            return

        from .services import trigger_bot_move_async
        await database_sync_to_async(trigger_bot_move_async)(match)

    # =========================
    # TURN TIMEOUT
    # =========================

    async def schedule_turn_timeout(self):
        if self.turn_task:
            self.turn_task.cancel()

        match = await self.get_match()
        turn_ends_at = (match.game_state or {}).get('turnEndsAt')

        if match.status != 'active' or not turn_ends_at:
            return

        deadline = datetime.fromisoformat(turn_ends_at.replace('Z', '+00:00'))

        wait_seconds = max(
            0,
            (deadline - datetime.now(tz=deadline.tzinfo)).total_seconds() + 5.0
        )

        self.turn_task = asyncio.create_task(
            self.handle_turn_timeout(wait_seconds)
        )

    async def handle_turn_timeout(self, wait_seconds):
        await asyncio.sleep(wait_seconds)

        result = await database_sync_to_async(skip_expired_turn)(
            self.match_id
        )

        if not result:
            return

        match, skipped_player = result
        series_info = self.get_series_info(match)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'turn_skip',
                'skippedPlayer': skipped_player,
                'nextPlayer': match.game_state['currentPlayer'],
                'board': match.game_state['board'],
                'turnEndsAt': match.game_state['turnEndsAt'],
                'series': series_info,
            }
        )

        await self.schedule_turn_timeout()

    # =========================
    # HELPERS
    # =========================

    def get_series_info(self, match):
        if not match.series:
            return None
        return {
            'id': str(match.series.id),
            'player1_wins': match.series.player1_wins,
            'player2_wins': match.series.player2_wins,
            'is_complete': match.series.is_complete(),
        }

    async def send_error(self, message):
        await self.send_json({'type': 'ERROR', 'message': message})

    async def send_json(self, payload):
        await self.send(text_data=json.dumps(payload))

    async def authenticate(self):
        query = parse_qs(self.scope.get('query_string', b'').decode())
        token = (query.get('token') or [None])[0]

        if not token:
            return None

        return await self.get_user_for_token(token)

    @database_sync_to_async
    def get_user_for_token(self, token):
        try:
            return Token.objects.select_related('user').get(key=token).user
        except Token.DoesNotExist:
            return None

    @database_sync_to_async
    def get_match(self):
        return get_match_model().objects.select_related('player1', 'player2', 'series').get(id=self.match_id)
