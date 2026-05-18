# PurePlay API Contract

This is the frontend/backend integration contract for the PurePlay MVP.

## Environment

Frontend reads these variables from `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

## Auth REST API

### Register

`POST /api/auth/register/`

Request:

```json
{
  "username": "player1",
  "email": "player@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "username": "player1",
    "email": "player@example.com",
    "tier": "Bronze",
    "rank": 1000,
    "avatar": null
  },
  "token": "access-jwt",
  "refresh": "refresh-jwt"
}
```

### Login

`POST /api/auth/login/`

Request:

```json
{
  "username": "player@example.com",
  "password": "password123"
}
```

The `username` field may contain either username or email.

Response shape is the same as register.

### Current User

`GET /api/auth/profile/`

Headers:

```http
Authorization: Bearer access-jwt
```

Response:

```json
{
  "id": 1,
  "username": "player1",
  "email": "player@example.com",
  "tier": "Bronze",
  "rank": 1000,
  "avatar": null
}
```

## Wallet REST API

All wallet endpoints require:

```http
Authorization: Bearer access-jwt
```

### Balance

`GET /api/wallet/balance/`

Response:

```json
{
  "balance": 2500
}
```

### Transactions

`GET /api/wallet/transactions/`

Response:

```json
[
  {
    "id": "tx_123",
    "type": "deposit",
    "amount": 2500,
    "status": "completed",
    "createdAt": "2026-05-18T12:00:00Z"
  }
]
```

### Deposit

`POST /api/wallet/deposit/`

Request:

```json
{
  "amount": 2500
}
```

Response:

```json
{
  "balance": 2500,
  "transactionId": "tx_123"
}
```

### Withdraw

`POST /api/wallet/withdraw/`

Request:

```json
{
  "amount": 1000,
  "bankDetails": {
    "bankName": "Bank",
    "accountNumber": "0000000000",
    "accountName": "Player One"
  }
}
```

Response:

```json
{
  "balance": 1500,
  "transactionId": "tx_124"
}
```

### Lock Stake

`POST /api/wallet/lock-stake/`

Request:

```json
{
  "matchId": "match_123",
  "amount": 500
}
```

Response:

```json
{
  "matchId": "match_123",
  "lockedAmount": 500,
  "balance": 1000
}
```

## Matchmaking REST API

The Tic Tac Toe entry flow now has three frontend modes:

- `Practice Bot`: frontend-only demo mode, no backend endpoint required for MVP.
- `Quick Match`: queue for any available player.
- `Challenge Player`: load online players and send a direct challenge.

### Quick Match

`POST /api/matchmaking/queue/`

Request:

```json
{
  "gameType": "tictactoe",
  "stake": 500,
  "mode": "quick_match"
}
```

Response when waiting:

```json
{
  "status": "waiting"
}
```

Response when matched:

```json
{
  "status": "matched",
  "matchId": "match_123"
}
```

### Available Players

`GET /api/matchmaking/available-players/?gameType=tictactoe&stake=500`

Response:

```json
[
  {
    "id": "user_123",
    "username": "ShadowMaster",
    "tier": "Gold",
    "rank": 1240,
    "preferredStake": 500,
    "status": "online"
  }
]
```

### Challenge Player

`POST /api/matchmaking/challenge/`

Request:

```json
{
  "gameType": "tictactoe",
  "stake": 500,
  "opponentId": "user_123"
}
```

Response when pending:

```json
{
  "status": "pending",
  "challengeId": "challenge_123"
}
```

Response when immediately matched:

```json
{
  "status": "matched",
  "matchId": "match_123"
}
```

## Match WebSocket

Connect to:

```text
{VITE_WS_URL}/matches/{matchId}/?token={access-jwt}
```

Example:

```text
ws://localhost:8000/ws/matches/match_123/?token=access-jwt
```

### Client Events

#### Make Move

```json
{
  "type": "MAKE_MOVE",
  "payload": {
    "position": 4
  }
}
```

`position` is zero-based and must be from `0` to `8`.

### Server Events

#### Match Start

```json
{
  "type": "MATCH_START",
  "matchId": "match_123",
  "board": [null, null, null, null, null, null, null, null, null],
  "currentPlayer": "X",
  "playerSymbol": "X",
  "turnEndsAt": "2026-05-18T12:00:10Z"
}
```

#### Move Made

```json
{
  "type": "MOVE_MADE",
  "board": [null, null, null, null, "X", null, null, null, null],
  "nextPlayer": "O",
  "turnEndsAt": "2026-05-18T12:00:20Z"
}
```

#### Turn Skip

The backend should emit this if a player does not move within 10 seconds.

```json
{
  "type": "TURN_SKIP",
  "skippedPlayer": "X",
  "nextPlayer": "O",
  "board": [null, null, null, null, "X", null, null, null, null],
  "turnEndsAt": "2026-05-18T12:00:20Z"
}
```

#### Game Over

```json
{
  "type": "GAME_OVER",
  "winner": "X",
  "reason": "three_in_row",
  "board": ["X", "X", "X", null, "O", null, null, null, "O"],
  "payout": {
    "winnerAmount": 950,
    "platformFee": 50
  }
}
```

For a draw:

```json
{
  "type": "GAME_OVER",
  "winner": "draw",
  "reason": "board_full",
  "board": ["X", "O", "X", "X", "O", "O", "O", "X", "X"]
}
```

#### Error

```json
{
  "type": "ERROR",
  "message": "Invalid move"
}
```

## Backend Requirements For Current Frontend

- Validate the JWT passed in the WebSocket query string.
- Keep match state server-side, not only in memory on the frontend.
- Enforce a 10-second turn timer on the server.
- On timeout, emit `TURN_SKIP` and pass the turn to the other player.
- Do not reset the board on reconnect.
- Keep payloads small and stable.
- Support `Quick Match` with `POST /matchmaking/queue/`.
- Support `Challenge Player` with `GET /matchmaking/available-players/` and `POST /matchmaking/challenge/`.
- `Practice Bot` is frontend-only for now and does not require backend work for MVP.
