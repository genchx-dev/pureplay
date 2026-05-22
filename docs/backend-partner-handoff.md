# Backend Partner Handoff

This document is for the backend owner working with the active frontend in `frontend/`.
The full route and payload contract is in `docs/api-contract.md`.

## Current Working Status

The frontend has been integrated with the Django backend at `pureplay-main/backend`.

Verified frontend flows:

- Register, login, logout, and session restore through DRF token auth.
- Registration UI now collects a phone number for future challenge notifications. The current frontend keeps the active backend payload compatible by still sending username, email, and password only.
- Dashboard navigation: Home, Challenge, Tournament, Leaderboard, and Me.
- Home dashboard has a headline tournament flyer with countdown, entry fee, joined users, live prize pool, and top-5 prize preview.
- Wallet balance is shown inside the Me tab.
- Practice Bot works as a frontend-only demo.
- Quick Match works with the current matchmaking endpoints.
- Challenge Player works with the current MVP endpoint.
- Live Tic Tac Toe works over the match WebSocket.

## Backend Runtime Expected By Frontend

Frontend environment:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

REST auth header:

```http
Authorization: Token <token>
```

Match WebSocket:

```text
ws://localhost:8000/ws/matches/{matchId}/?token={token}
```

## Backend Priorities

1. Wallet ledger

The current wallet endpoints are placeholders. The frontend intentionally disables deposit and withdrawal actions until backend money movement is real.

Needed endpoints:

```text
POST /api/wallet/deposit/
POST /api/wallet/withdraw/
POST /api/wallet/lock-stake/
POST /api/wallet/settle-match/
GET  /api/wallet/balance/
GET  /api/wallet/transactions/
```

Suggested minimum response shapes:

```json
{
  "balance": 1000,
  "lockedBalance": 500
}
```

```json
{
  "id": "tx_123",
  "type": "stake",
  "amount": -500,
  "status": "completed",
  "description": "Tic Tac Toe stake locked",
  "createdAt": "2026-05-22T12:00:00Z"
}
```

2. Real challenge lifecycle

The current Challenge Player endpoint creates a match immediately. Later, replace this with a real challenge lifecycle:

```text
POST /api/matchmaking/challenge/
GET  /api/matchmaking/challenges/incoming/
POST /api/matchmaking/challenges/{challengeId}/accept/
POST /api/matchmaking/challenges/{challengeId}/decline/
```

Challenge notifications should use the phone number stored on each player account.

3. Auth phone number support

Persist phone numbers during registration and return them from the current-user profile endpoint.

Suggested register request:

```json
{
  "username": "player1",
  "email": "player@example.com",
  "phone": "+2348012345678",
  "password": "password123"
}
```

Suggested user response addition:

```json
{
  "phone": "+2348012345678"
}
```

4. Tournament backend

The home dashboard is ready for a featured tournament API. Users should be able to see the current prize pool and top-5 prizes before joining.

Needed endpoints:

```text
GET  /api/tournaments/featured/
POST /api/tournaments/{tournamentId}/join/
GET  /api/tournaments/{tournamentId}/prizes/
```

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

5. Matchmaking persistence

Current matchmaking uses local cache state. That is fine for local MVP testing but should move to persistent/shared storage before production or multi-server testing.

6. WebSocket resilience

The frontend expects reconnects to restore current match state without resetting the board. Keep match state server-owned and replay the latest state on socket connect.

7. Tests

Add backend tests around:

- Auth register/login/profile.
- Phone number persistence once implemented.
- Queue join/cancel/open-match accept.
- Challenge Player MVP behavior.
- Challenge invite accept/decline and phone notification once implemented.
- Tic Tac Toe legal move, invalid move, win, draw, and turn skip.
- Wallet ledger once implemented.
- Tournament featured response, join/payment, and top-5 prize calculations once implemented.

## Coordination Rule

When backend routes, payloads, auth behavior, environment variables, or WebSocket events change, update both:

- `docs/api-contract.md`
- `README.md`

Do this in the same change as the backend update so the frontend owner can integrate without guessing.
