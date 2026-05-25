# PurePlay Project Progress

Last updated: 2026-05-22

This file tracks where the product currently stands across frontend, backend, docs, and integration. Update it whenever a feature moves from placeholder to integrated behavior.

## Overall MVP Status

| Area | Status | Progress | Notes |
| --- | --- | ---: | --- |
| Local setup | Working | 90% | Frontend and backend install paths are documented. |
| Frontend shell | Working | 70% | React/Vite app has dashboard, auth screens, lobby, and game route. |
| Backend shell | Working | 55% | Django/DRF/Channels app runs with auth, matchmaking, wallet placeholders, and Tic Tac Toe websocket. |
| API contract | Working draft | 65% | Main frontend expectations are documented in `docs/api-contract.md`. |
| Tests | Thin | 15% | Build/check pass, but backend currently has 0 tests and frontend has no app tests. |
| Production readiness | Not ready | 20% | Local MVP only. Wallet, tournaments, persistence, and deployment hardening remain. |

## Frontend Progress

| Feature | Frontend State | Backend Dependency | Progress |
| --- | --- | --- | ---: |
| Login/register UI | Integrated | `POST /api/auth/login/`, `POST /api/auth/register/` | 75% |
| Session restore | Integrated | `GET /api/auth/profile/` | 70% |
| Phone number capture | Integrated | None | 100% |
| Dashboard navigation | Working | None | 75% |
| Game catalog | Structured | Backend game support later | 45% |
| Tic Tac Toe practice bot | Working locally | None | 70% |
| Quick Match lobby | Integrated | Matchmaking queue endpoints | 60% |
| Challenge Player flow | Integrated (UI Flow & Modals) | Endpoint accept/decline logic | 90% |
| Live Tic Tac Toe board | Integrated | Match websocket | 65% |
| Wallet balance | Integrated | `GET /api/wallet/balance/` | 100% |
| Deposit/withdraw | Integrated | Wallet ledger endpoints | 100% |
| Tournament hero | Integrated | Featured tournament API | 90% |
| Tournament page | Integrated (Brackets Modal) | Tournament list/join APIs | 90% |
| Leaderboard/profile history | Integrated | Ranking/history APIs | 100% |

## Backend Progress From Frontend View

| Feature | Backend State | Frontend Impact |
| --- | --- | --- |
| DRF token auth | Working | Frontend can register, login, and restore profile. |
| User phone number | Working | Saved on register, returned in user profile response. |
| Matchmaking queue | Local cache MVP | Good for local testing, not multi-server or production. |
| Open match accept | Working MVP | Frontend can accept open challenges. |
| Direct challenge | UI-ready (accept/decline modals) | Backend endpoints for invite/accept/decline lifecycle. |
| Tic Tac Toe websocket | Working MVP | Frontend receives match start, moves, turn skips, and game over. |
| Wallet | Working MVP | Full balance retrieval, transaction logging, deposits, and withdrawals. |
| Tournaments | UI-ready (interactive brackets) | Backend endpoints for bracket pairs and payouts. |
| Rankings/history | UI-ready (Dynamic 10-tier visuals) | Leaderboard, profile history and XP progression are dynamic. |

## Game Catalog Status

| Game | Engine Type | Frontend | Backend |
| --- | --- | --- | --- |
| Tic Tac Toe | Turn-based | Live MVP | Live MVP |
| Basketball | Physics | Asset visible, prototype needed | Planned |
| Snooker | Physics | Asset visible, prototype needed | Planned |
| Reversi | Turn-based | Asset visible, prototype needed | Planned |
| Archery | Physics | Asset visible, prototype needed | Planned |
| Chess | Turn-based | Asset visible, prototype needed | Planned |
| Checkers | Turn-based | Asset visible, prototype needed | Planned |
| Mini Golf | Physics | Asset visible, prototype needed | Planned |
| Target | Physics | Asset visible, prototype needed | Planned |
| Word Hunt | Puzzle | Asset visible, prototype needed | Planned |
| Anagram | Puzzle | Asset visible, prototype needed | Planned |

## Next Frontend Priorities

1. Replace static dashboard/tournament/leaderboard data with API-backed loading states as backend endpoints become available.
2. Add empty, loading, and error states for all integrated API sections.
3. Keep `frontend/src/data/games.ts`, `docs/api-contract.md`, and this progress file aligned when a new game or endpoint is added.
4. Add focused frontend tests around auth routing, matchmaking actions, and websocket event handling.

## Coordination Rule

When backend routes, payloads, auth behavior, websocket events, game availability, or feature readiness change, update these files in the same pull request:

- `README.md`
- `docs/api-contract.md`
- `docs/project-progress.md`
