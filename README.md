# PurePlay

PurePlay is a real-time competitive gaming MVP. The current working setup uses the top-level React frontend and the partner Django backend under `pureplay-main/backend`.

## Current Project Layout

```text
pureplay/
  frontend/                 Active React/Vite frontend
  pureplay-main/backend/    Active Django/DRF/Channels backend
  design/                   Figma-exported design/reference app
  docs/                     API and integration notes
```

The old top-level `backend/` folder was removed. Use `pureplay-main/backend/` for backend work.

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, Zustand, Axios, Lucide icons
- Backend: Django 5, Django REST Framework, DRF Token Authentication, Channels/Daphne
- Database: SQLite for local MVP development
- Realtime: WebSocket match channel at `/ws/matches/{matchId}/`

## Environment

The active frontend reads `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

The frontend sends API auth as:

```http
Authorization: Token <token>
```

## Run Locally

### Backend

```powershell
cd C:\Users\USER\pureplay\pureplay-main\backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

If the virtual environment is missing:

```powershell
cd C:\Users\USER\pureplay\pureplay-main\backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe manage.py migrate
```

### Frontend

```powershell
cd C:\Users\USER\pureplay\frontend
npm install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Verification

Backend:

```powershell
cd C:\Users\USER\pureplay\pureplay-main\backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py makemigrations --check --dry-run
.\venv\Scripts\python.exe manage.py test
```

Frontend:

```powershell
cd C:\Users\USER\pureplay\frontend
npm.cmd run build
npm.cmd run lint
```

Current note: backend tests run successfully but there are currently `0` tests.

## Implemented MVP Flows

- Register and login with DRF token auth (including phone number persistence).
- Restore current user from `/api/auth/profile/`.
- Frontend protected routes using the stored token.
- Dashboard navigation with Home, Challenge, Tournament, Leaderboard, and Me tabs.
- Home dashboard features a headline tournament flyer with entry fee, countdown, player count, live prize pool, and top-5 prize preview.
- Wallet balance and transaction placeholders shown inside the Me/user area.
- Practice bot mode in the frontend.
- Quick Match lobby with open challenge listing and accept flow.
- Challenge Player endpoint that immediately creates a match for MVP testing.
- Tic Tac Toe websocket contract using `MATCH_START`, `MOVE_MADE`, `TURN_SKIP`, `GAME_OVER`, and `ERROR`.
- Global Leaderboard podium and user standings table mapped to the new 10-tier ranking system (Wood to Ruby).
- Dynamic player progression metrics including XP accumulation, level progress bar with countdown, and win-streak tracking.
- Match history tracking that automatically rewards XP and calculates win streaks upon match completion.

## Known Limits

- Wallet money movement is still placeholder-level in the active backend.
- Stakes are shown in matchmaking but are not settled through a real wallet ledger.
- Tournament join/payment and bracket tree visualization are UI-ready; backend endpoints are mocked locally until live tournament servers are up.
- Challenge phone notifications are planned backend work (phone-number persistence is now supported).
- Matchmaking uses local cache state, so it is suitable for local MVP testing, not production scale.
- The challenge flow is UI-ready for acceptance modals; backend invites are currently mocked locally until endpoints are implemented.
- Production settings need hardening before deployment.

## Partner Docs

- `docs/api-contract.md`: frontend/backend route, payload, auth, and websocket contract.
- `docs/backend-partner-handoff.md`: backend implementation priorities and current frontend expectations.
- `docs/project-progress.md`: shared progress tracker for frontend, backend, game catalog, and integration status.
- `docs/remaining-tasks.md`: exhaustive breakdown of remaining frontend and backend tasks to complete the MVP.

## Frontend Coordination Notes

The frontend game list is centralized in:

```text
frontend/src/data/games.ts
```

Use that file when adding or changing game availability so the homepage, game screen, docs, and backend planning stay aligned.

Current frontend status:

- Tic Tac Toe is the only playable MVP game.
- Coming-soon game assets are visible from the shared game catalog.
- Leaderboard and player progression (XP/Tiers/Match History) are fully dynamic with local storage state persistence.
- Tournament join/payment and bracket tree visualization are UI-ready with local mock fallbacks.
- Wallet deposit and withdrawal actions remain disabled until the backend ledger is real.

## Documentation Maintenance

When code changes affect setup, routes, payloads, auth, environment variables, run commands, major verified flows, game availability, or feature readiness, update this README in the same change. Keep `docs/api-contract.md` and `docs/project-progress.md` aligned with the frontend services and active backend behavior.
