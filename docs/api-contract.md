# PurePlay API Contract

This is the integration contract between the active frontend at `frontend/` and the active backend at `pureplay-main/backend/`.

## Environment

Frontend reads these variables from `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

Authenticated REST requests use DRF token auth:

```http
Authorization: Token <token>
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

Frontend note: the registration screen now collects a phone number for future challenge notifications, but the active backend register endpoint does not yet accept or persist `phone`.

Response:

```json
{
  "token": "drf-token",
  "user": {
    "id": "1",
    "username": "player1",
    "email": "player@example.com",
    "tier": "Bronze",
    "rank": 1000,
    "avatar": null
  }
}
```

### Login

`POST /api/auth/login/`

Request:

```json
{
  "username": "player1",
  "password": "password123"
}
```

The `username` field may contain either username or email.

Response shape is the same as register.

### Current User

`GET /api/auth/profile/`

Headers:

```http
Authorization: Token <token>
```

Response:

```json
{
  "id": "1",
  "username": "player1",
  "email": "player@example.com",
  "tier": "Bronze",
  "rank": 1000,
  "avatar": null
}
```

## Wallet REST API

Current active backend wallet endpoints are MVP placeholders.

### Balance

`GET /api/wallet/balance/`

Response:

```json
{
  "balance": 1000,
  "currency": "PP"
}
```

### Transactions

`GET /api/wallet/transactions/`

Response:

```json
[]
```

Planned but not implemented in the active backend:

- `POST /api/wallet/deposit/`
- `POST /api/wallet/withdraw/`
- `POST /api/wallet/lock-stake/`

## Tournament REST API

Tournament UI is currently frontend-only. The home dashboard displays a headline tournament flyer with countdown, entry fee, joined users, total prize pool, and top-5 prize preview.

Planned backend endpoints:

- `GET /api/tournaments/featured/`
- `POST /api/tournaments/{tournamentId}/join/`
- `GET /api/tournaments/{tournamentId}/prizes/`

Suggested featured tournament response:

```json
{
  "id": "tournament_1",
  "name": "Ultimate Tic Tac Toe Cup",
  "gameType": "tictactoe",
  "entryFee": 500,
  "joinedUsers": 128,
  "maxParticipants": 256,
  "totalPrize": 50000,
  "startsAt": "2026-05-22T18:00:00Z",
  "prizes": [
    { "rank": "1ST PLACE", "prize": 25000 },
    { "rank": "2ND PLACE", "prize": 12500 },
    { "rank": "3RD PLACE", "prize": 7500 },
    { "rank": "4TH PLACE", "prize": 3500 },
    { "rank": "5TH PLACE", "prize": 1500 }
  ]
}
```

## Matchmaking REST API

The Tic Tac Toe entry flow has three frontend modes:

- `Practice Bot`: frontend-only demo mode.
- `Quick Match`: publish a stake and accept open challenges.
- `Challenge Player`: load available players and immediately create a match for MVP testing.

### Join Quick Match

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
  "matchId": "1"
}
```

### Cancel Queue

`POST /api/matchmaking/queue/cancel/`

Response:

```json
{
  "status": "cancelled"
}
```

### Open Matches

`GET /api/matchmaking/open-matches/?gameType=tictactoe&stake=500`

Response:

```json
[
  {
    "id": "1:tictactoe:500",
    "gameType": "tictactoe",
    "stake": 500,
    "player": {
      "id": "1",
      "username": "player1",
      "tier": "Bronze",
      "rank": 1000
    }
  }
]
```

### Accept Open Match

`POST /api/matchmaking/open-matches/accept/`

Request:

```json
{
  "queueId": "1:tictactoe:500"
}
```

Response:

```json
{
  "status": "matched",
  "matchId": "1"
}
```

### Available Players

`GET /api/matchmaking/available-players/?gameType=tictactoe&stake=500`

Response:

```json
[
  {
    "id": "2",
    "username": "opponent",
    "tier": "Bronze",
    "rank": 1000,
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
  "opponentId": "2"
}
```

Response:

```json
{
  "status": "matched",
  "matchId": "1"
}
```

## Match WebSocket

Connect to:

```text
{VITE_WS_URL}/matches/{matchId}/?token={token}
```

Example:

```text
ws://localhost:8000/ws/matches/1/?token=drf-token
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
  "matchId": "1",
  "board": [null, null, null, null, null, null, null, null, null],
  "currentPlayer": "X",
  "playerSymbol": "X",
  "turnEndsAt": "2026-05-22T12:00:10Z"
}
```

#### Move Made

```json
{
  "type": "MOVE_MADE",
  "board": [null, null, null, null, "X", null, null, null, null],
  "nextPlayer": "O",
  "turnEndsAt": "2026-05-22T12:00:20Z"
}
```

#### Turn Skip

```json
{
  "type": "TURN_SKIP",
  "skippedPlayer": "X",
  "nextPlayer": "O",
  "board": [null, null, null, null, "X", null, null, null, null],
  "turnEndsAt": "2026-05-22T12:00:20Z"
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
    "winnerAmount": 0,
    "platformFee": 0
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

## Maintenance Rule

When route paths, payload shapes, auth method, environment variables, or websocket event names change, update this contract and the root `README.md` in the same change.
