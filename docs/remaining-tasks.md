# PurePlay Remaining Tasks: Frontend vs. Backend

This document tracks all outstanding work to bridge the current React frontend with the Django REST/Channels backend.

**Legend:** `[ ]` = pending · `[/]` = in progress · `[x]` = done

---

## 🔥 Backend Priority Order

| Priority | Section | Task |
|---|---|---|
| 1 | Auth | Persist `phone_number` on register (Done) |
| 2 | Rankings | XP & MMR fields + post-match calculation (Done) |
| 3 | Rankings | `GET /api/rankings/leaderboard/` (Done) |
| 4 | Rankings | `GET /api/players/search/?q=` |
| 5 | Rankings | `GET /api/players/{username}/` |
| 6 | Rankings | `GET /api/matches/history/` (Done) |
| 7 | Wallet | Real wallet schema + staking engine (Done) |
| 8 | Challenges | Challenge lifecycle API + SMS notifications (API Done, SMS Pending) |
| 9 | Tournaments | Tournament schema + bracket logic (Done) |
| 10 | Tic Tac Toe | Best of Three Rounds & Real Usernames (Done) |
| 11 | Games | Game engine abstraction + new games (Abstraction Done, new games Pending) |
| 12 | Hardening | Redis, PostgreSQL, production settings |

---

## 🔐 1. Authentication & Profile Persistence

The registration form already sends `phone` from the frontend — the backend saves it.

### Backend Tasks
- [x] **Database Migration**: Add a `phone_number` field to the custom User model.
- [x] **Register API** `POST /api/auth/register/`: Accept and validate the `phone` field.
- [x] **Profile API** `GET /api/auth/profile/`: Include `phone` in the response payload.
- [x] **Auth Response Shape**: Returned as expected by the frontend.

### Frontend Tasks
- [x] **API Payload Update**: `phone` field included in register API call.
- [x] **Profile Storage**: Phone number displayed on the **Me** tab.
- [x] **Loading & Error Handling**: Backend validation errors shown on the registration form.

---

## 💰 2. Wallet Ledger & Settlements

Wallet balances and transactions are successfully wired and live.

### Backend Tasks
- [x] **Wallet Database Schema**: 
  - `Wallet` model: `user (FK)`, `balance (Decimal)`, `locked_balance (Decimal)`.
  - `Transaction` model: `wallet (FK)`, `amount`, `type`, `status`, `description`, `created_at`.
- [x] **Staking Engine**:
  - [x] `WalletService.lock_stake()` — move funds from `balance` → `locked_balance` when a match starts.
  - [x] `WalletService.settle_match()` — resolve match stakes: deduct 5% platform fee, credit winner.
- [x] **Ledger Endpoints**:
  - [x] `POST /api/wallet/deposit/` — Top-up account.
  - [x] `POST /api/wallet/withdraw/` — Validate sufficient balance, debit wallet.
  - [x] `GET /api/wallet/transactions/` — Return transaction history.

### Frontend Tasks
- [x] **Wallet UI**: Deposit and Withdraw buttons live on the **Me** tab.
- [x] **Transactions List**: Transaction ledger panel wired to `GET /api/wallet/transactions/`.
- [x] **Staking Feedback**: Show locked stake amount in the game room while a match is in progress (Match Pot Badge).

---

## 🤝 3. Real Challenge Lifecycle & Phone Notifications

Matchmaking support for invites is active. Queue, incoming challenges and accept/decline are live.

### Backend Tasks
- [x] **Challenge Database Model**: `Challenge` with states `pending | accepted | declined | expired`.
- [x] **Challenge Lifecycle REST API**:
  - [x] `POST /api/matchmaking/send-challenge/` — create a pending invitation.
  - [x] `GET /api/matchmaking/incoming-challenges/` — return active incoming challenges.
  - [x] `POST /api/matchmaking/accept-challenge/{id}/` — transition to an active `Match`, set up WebSocket room, lock stakes.
  - [x] `POST /api/matchmaking/decline-challenge/{id}/` — mark as `declined`, release funds.
- [ ] **Challenge Notifications (SMS Gateway)**: Dispatch SMS to opponent's `phone_number` when a challenge is sent.
- [ ] **Auto-Expiry Task**: Background job (Celery beat or Django-Q) to mark challenges as `expired` after 60 seconds and refund any locked stake.

### Frontend Tasks
- [x] **Inline Challenge Inbox**: Render pending challenges inside the Challenge tab page.
- [x] **Notification Badges**: Renders pulsing red count badge on the desktop sidebar and mobile bottom nav.
- [x] **Waiting Spinner**: "Challenge Sent — Waiting..." spinner with Cancel option for the challenger.
- [x] **Queue Polling**: Frontend polls `GET /api/matchmaking/incoming-challenges/` every 4 seconds.
- [x] **Global Challenge Listener**: Polling is registered globally in `App.tsx` and triggers the waiting overlay or badge updates across pages.

---

## 🏆 4. Tournament Management System

Tournament schemas, bracket pairs, join REST APIs, and prize settlements are implemented on the backend.

### Backend Tasks
- [x] **Tournament Database Schema**: Models `Tournament`, `TournamentParticipant`, `Round`, `Match`, `Bracket` mapped.
- [x] **Tournament REST API**: Endpoints for listing, details, registration, bracket, and prize allocation.
- [x] **Knockout Bracket Logic**: Matches generation and participant auto-pairing.
- [x] **Swiss Stage Matchmaking**: Match-point tracking, pairings, and advancement.
- [x] **Prize Settlement Engine**: Auto-distribution of prize pools to winners.

### Frontend Tasks
- [x] **Tournament List & Detail Pages**: Renders tournaments with entry fee, prize pool, participant count.
- [x] **Join Action**: "Register" button validates wallet balance against entry fee.
- [x] **Live Bracket Display**: Visual bracket tree (QF → SF → Final).
- [x] **Prize Table**: Live prize pool breakdown per finishing position.

---

## 📊 5. Rankings, MMR & Player Profiles

Ranking system calculations are implemented, but endpoints are still pending.

### Backend Tasks
- [x] **Ranking System Engine**:
  - [x] Add `xp` and `mmr` to the User model/profile.
  - [x] Post-match XP awards: `+50 WIN`, `+25 DRAW`, `+15 LOSS` (+ streak bonuses).
  - [x] MMR/Elo update on every match result.
- [x] **Leaderboard REST API**: `GET /api/rankings/leaderboard/`
  - Returns top 100 players ranked by XP descending.
- [x] **Match History REST API**: `GET /api/matches/history/`
  - Returns authenticated user's last 50 match results, newest first.
- [ ] **Player Search API**: `GET /api/players/search/?q={username}`
- [ ] **Public Player Profile API**: `GET /api/players/{username}/`

### Frontend Tasks
- [x] **Leaderboard Screen**: Dynamic leaderboard with Top-3 podium, standings table, and "My Rank" footer.
- [x] **Profile Stats**: Tier badge, XP progress bar, win/loss/draw stats on the **Me** tab.
- [x] **Match History Feed**: Game history log with opponent, result, earnings, and date.
- [x] **Player Profile Modal**: Tap any leaderboard row → bottom-sheet with stats and **Challenge** CTA.
- [x] **Player Search UI**: Search bar on Leaderboard + Challenge pages.

---

## 🎮 6. Game Catalog & Multi-Engine Scaling

Tic Tac Toe and Chess are fully playable. Other games are in planning.

### Backend Tasks
- [x] **State Machine Abstraction**: Generic `AbstractGameEngine` interface supporting various formats.
- [x] **Add Game Engines**: WebSocket consumer + move validator for Tic Tac Toe and Chess.
- [ ] **Live Activity Feed**: Spectator lobby feed.

### Frontend Tasks
- [x] **Game Prototypes**: Tic Tac Toe board and ChessBoard fully implemented.
- [ ] **Game Prototypes (Other)**: React boards/controllers for Basketball, Snooker, Reversi, etc.
- [x] **Visual Customization**: Styled assets and turn indicators for Tic Tac Toe and Chess.

---

## ⚔️ 9. Tic Tac Toe: Best of Three Rounds & Real Player Usernames

To transition Tic Tac Toe from a single-round game to a premium "best of three" competitive match, and to display real player usernames instead of generic placeholders.

### 🧑‍💻 Backend Partner Tasks
- [x] **State Schema Updates**:
  - Update `Match` model game state JSON schema to track:
    - `current_round` (Integer: 1, 2, or 3).
    - `round_scores` (Dict mapping player symbols/user IDs to wins: e.g., `{"X": 0, "O": 0}`).
    - `round_history` (Array of round outcomes: e.g., `[{"round": 1, "winner": "X", "reason": "three_in_row"}]`).
- [x] **Round Transitions in `make_move()`**:
  - In `apps/matches/services.py`, modify move application logic:
    - When a player scores 3-in-a-row or a draw occurs:
      - Do NOT mark the match as completed immediately if no player has reached 2 wins.
      - Increment `current_round`.
      - Reset `board` to `[None] * 9`.
      - Alternate the starting player for the next round.
      - Update `turnEndsAt` for the new round.
      - Broadcast a new socket event type `ROUND_OVER` containing the winning player of the round, current scores, and a countdown to the next round.
      - If a player reaches 2 wins (or after 3 rounds if ties/draws happen), transition the Match status to `completed`, invoke `WalletService.settle_match()` with the final winner/loser, update rankings, and broadcast `GAME_OVER`.
- [x] **Serialize Real Usernames**:
  - Update the `MATCH_START` WebSocket payload and `GET /api/matches/{id}/` endpoint to include:
    - `player1_username` and `player2_username` (retrieved from `player1` and `player2` models).
    - User profiles metadata (e.g. tier, rank/MMR).

### 🎨 Frontend (USER) Tasks
- [x] **Round Scoreboard UI**:
  - In `frontend/src/app/(main)/game/page.tsx`, add a visual round indicator showing scores (e.g., active/inactive dots/stars: `● ● ○` vs `○ ○ ○`).
- [x] **WebSocket Message Handlers**:
  - In `frontend/src/services/websocket/handlers.ts`, add support for `ROUND_OVER` WebSocket event.
  - Track `currentRound` and `roundScores` in the `useGameStore`.
- [x] **Micro-Animations & Transitions**:
  - Implement a premium round-win animation (e.g., overlay banner "Round 1 Won by YOU!", "Prepare for Round 2...") using CSS transitions/animations when a `ROUND_OVER` event is received.
  - Introduce a delay/countdown timer before resetting the board visually to let the user enjoy/experience the win animation.
- [x] **Display Real Usernames**:
  - Bind `player1_username` and `player2_username` from the websocket connection to the player cards on the game page instead of showing generic "Player 1" and "Player 2" or "YOU" / "OPPONENT".
- [x] **Post-Match Result Headers**:
  - Display the specific cash amount won (e.g. `Won NGN 950`) for the winner, and display `You Lose` for the loser instead of the generic `Match Complete`.

---

## 🧪 7. Testing & Quality Assurance

### Backend Tasks
- [ ] **REST API Tests**: Coverage for register, profile, wallet balance, staking, tournament join.
- [ ] **WebSocket & Channels Tests**: Game moves, turn timeouts, victory declarations, payout triggers.
- [ ] **Challenge Lifecycle Tests**: Pending → accepted → matched flow, expiry, refund.

### Frontend Tasks
- [ ] **Zustand Store Tests**: Auth, wallet, ranking, and game state transitions.
- [ ] **Component Tests**: Matchmaking queue, game board turns, challenge overlay.

---

## ⚖️ 8. Production Hardening

### Backend Tasks
- [ ] **Matchmaking Queue**: Replace in-memory queue with **Redis** for multi-server support.
- [ ] **Database**: Migrate from SQLite → **PostgreSQL**.
- [ ] **Security**: Hardened CORS headers, HTTPS-only cookies, environment secrets via `.env` / secret manager.
- [ ] **Rate Limiting**: Add throttling on matchmaking, challenge, and search endpoints.
- [ ] **Logging & Monitoring**: Structured logging (JSON), Sentry integration for error tracking.
