# PurePlay Frontend

This is the active PurePlay frontend. It is built with React, Vite, TypeScript, Tailwind CSS, Zustand, Axios, and Lucide icons.

The active backend is:

```text
../pureplay-main/backend
```

## Environment

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

## Run

```powershell
cd C:\Users\USER\pureplay\frontend
npm install
npm.cmd run dev
```

The dev app runs at:

```text
http://127.0.0.1:5173
```

## Verify

```powershell
npm.cmd run build
npm.cmd run lint
```

## Backend Contract Summary

The frontend sends API auth as:

```http
Authorization: Token <token>
```

Expected backend base URLs:

- REST API: `http://localhost:8000/api`
- WebSocket: `ws://localhost:8000/ws`

Key flows:

- `POST /api/auth/register/` returns `{ token, user }`.
- `POST /api/auth/login/` returns `{ token, user }`.
- `GET /api/auth/profile/` returns the current user.
- `POST /api/matchmaking/queue/` joins Quick Match.
- `GET /api/matchmaking/open-matches/` lists open challenges.
- `POST /api/matchmaking/open-matches/accept/` accepts a challenge.
- WebSocket connects to `/ws/matches/{matchId}/?token={token}`.
- Client sends `MAKE_MOVE` with `{ payload: { position } }`.

For the full contract, see `../docs/api-contract.md`.
