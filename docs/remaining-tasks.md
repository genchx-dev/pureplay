# PurePlay Remaining Tasks: Frontend vs. Backend

This document tracks all outstanding work to bridge the current React frontend with the Django REST/Channels backend.

**Legend:** `[ ]` = pending · `[/]` = in progress · `[x]` = done

---

## 🔥 Backend Priority Order

| Priority | Section | Task |
|---|---|---|
| 1 | Auth | Persist `phone_number` on register |
| 2 | Rankings | XP & MMR fields + post-match calculation |
| 3 | Rankings | `GET /api/rankings/leaderboard/` |
| 4 | Rankings | `GET /api/players/search/?q=` |
| 5 | Rankings | `GET /api/players/{username}/` |
| 6 | Rankings | `GET /api/matches/history/` |
| 7 | Wallet | Real wallet schema + staking engine |
| 8 | Challenges | Challenge lifecycle API + SMS notifications |
| 9 | Tournaments | Tournament schema + bracket logic |
| 10 | Games | Game engine abstraction + new games |
| 11 | Hardening | Redis, PostgreSQL, production settings |

---

## 🔐 1. Authentication & Profile Persistence

The registration form already sends `phone` from the frontend — the backend just needs to save it.

### Backend Tasks
- [ ] **Database Migration**: Add a `phone_number` field to the custom User model (or `UserProfile`).
- [ ] **Register API** `POST /api/auth/register/`: Accept and validate the `phone` field.
  - Validate format: Nigerian numbers (`+234XXXXXXXXXX` or `0XXXXXXXXXX`) or E.164.
  - Return `400` with field-level errors if invalid.
- [ ] **Profile API** `GET /api/auth/profile/`: Include `phone` in the response payload.
- [ ] **Auth Response Shape** — expected by frontend:
  ```json
  {
    "id": 1,
    "username": "QuantumKing",
    "email": "user@example.com",
    "phone": "+2348012345678",
    "rank": 1,
    "xp": 1200000,
    "mmr": 1850
  }
  ```

### Frontend Tasks
- [x] **API Payload Update**: `phone` field included in register API call.
- [x] **Profile Storage**: Phone number displayed on the **Me** tab.
- [x] **Loading & Error Handling**: Backend validation errors shown on the registration form.

---

## 💰 2. Wallet Ledger & Settlements

Wallet balances are currently served as static placeholders. The frontend Deposit/Withdraw buttons are in place but alert-only.

### Backend Tasks
- [ ] **Wallet Database Schema**: 
  - `Wallet` model: `user (FK)`, `balance (Decimal)`, `locked_balance (Decimal)`.
  - `Transaction` model: `wallet (FK)`, `amount`, `type` (`deposit|withdrawal|stake|payout|refund`), `status` (`pending|completed|failed`), `description`, `created_at`.
- [ ] **Staking Engine**:
  - [ ] `POST /api/wallet/lock-stake/` — move funds from `balance` → `locked_balance` when a match starts.
  - [ ] `POST /api/wallet/settle-match/` — resolve match stakes: deduct 5% platform fee, credit winner.
- [ ] **Ledger Endpoints**:
  - [ ] `POST /api/wallet/deposit/` — integrate payment gateway (mock or live Paystack/Flutterwave).
  - [ ] `POST /api/wallet/withdraw/` — validate sufficient balance, debit wallet, log transaction.
  - [ ] `GET /api/wallet/transactions/` — return paginated transaction history for the authenticated user.
- [ ] **Balance Response Shape** — expected by frontend:
  ```json
  { "balance": 5000.00, "locked_balance": 500.00 }
  ```
- [ ] **Transaction Record Shape**:
  ```json
  {
    "id": "tx_001",
    "type": "deposit",
    "amount": 2000,
    "description": "Wallet top-up",
    "status": "completed",
    "createdAt": "2026-05-25T13:00:00Z"
  }
  ```

### Frontend Tasks
- [x] **Wallet UI**: Deposit and Withdraw buttons live on the **Me** tab.
- [x] **Transactions List**: Transaction ledger panel wired to `GET /api/wallet/transactions/`.
- [ ] **Staking Feedback**: Show locked stake amount in the game room while a match is in progress.

---

## 🤝 3. Real Challenge Lifecycle & Phone Notifications

Matchmaking currently creates a match immediately. It needs a proper invite → accept/decline flow.

### Backend Tasks
- [ ] **Challenge Database Model**: `Challenge` with states `pending | accepted | declined | expired`.
  - Fields: `challenger (FK)`, `opponent (FK)`, `game_type`, `stake`, `status`, `created_at`, `expires_at`.
- [ ] **Challenge Lifecycle REST API**:
  - [ ] `POST /api/matchmaking/challenge/` — create a pending invitation.
    ```json
    { "opponent_id": 7, "game_type": "tictactoe", "stake": 500 }
    ```
  - [ ] `GET /api/matchmaking/challenges/incoming/` — return active incoming challenges for the authenticated user.
  - [ ] `POST /api/matchmaking/challenges/{id}/accept/` — transition to an active `Match`, set up WebSocket room, lock stakes.
  - [ ] `POST /api/matchmaking/challenges/{id}/decline/` — mark as `declined`, release no funds.
- [ ] **Challenge Notifications (SMS Gateway)**: Dispatch SMS to opponent's `phone_number` when a challenge is sent.
- [ ] **Auto-Expiry Task**: Background job (Celery beat or Django-Q) to mark challenges as `expired` after 60 seconds and refund any locked stake.

### Frontend Tasks
- [x] **Incoming Challenge Overlay**: Modal on Dashboard showing opponent name, stake, Accept/Decline buttons.
- [x] **Waiting Spinner**: "Challenge Sent — Waiting..." spinner with Cancel option for the challenger.
- [x] **Queue Polling**: Frontend polls `GET /api/matchmaking/challenges/incoming/` every 4 seconds.

---

## 🏆 4. Tournament Management System

Tournament screens are fully built on the frontend but driven by static mock data.

### Backend Tasks
- [ ] **Tournament Database Schema**:
  - Models: `Tournament`, `TournamentParticipant`, `Round`, `Match`, `Bracket`.
  - Fields include: `name`, `format` (`knockout|swiss`), `entry_fee`, `prize_pool`, `status` (`upcoming|registration_open|active|completed`), `start_time`, `max_participants`.
- [ ] **Tournament REST API**:
  - [ ] `GET /api/tournaments/` — list all active/upcoming tournaments.
  - [ ] `GET /api/tournaments/featured/` — return the headline tournament with countdown, participant count, and prize pool breakdown.
  - [ ] `POST /api/tournaments/{id}/join/` — validate balance, lock entry fee stake, add participant.
  - [ ] `GET /api/tournaments/{id}/bracket/` — return the live bracket tree.
  - [ ] `GET /api/tournaments/{id}/prizes/` — return the prize distribution matrix.
- [ ] **Knockout Bracket Logic**: Handle play-in byes when participant count is not a power of 2.
- [ ] **Swiss Stage Matchmaking**:
  - [ ] Match-point tracking (+3 win, +1 draw, 0 loss).
  - [ ] Swiss pairing algorithm: pair players with equal/similar match points.
  - [ ] Auto-advance top N players from Swiss stage to knockout finals.
- [ ] **Prize Settlement Engine**: Auto-distribute prize pool to top finishers on tournament completion.

### Frontend Tasks
- [x] **Tournament List & Detail Pages**: Renders active/upcoming tournaments with entry fee, prize pool, participant count.
- [x] **Join Action**: "Register" button validates wallet balance against entry fee.
- [x] **Live Bracket Display**: Visual bracket tree (QF → SF → Final).
- [x] **Prize Table**: Live prize pool breakdown per finishing position.

---

## 📊 5. Rankings, MMR & Player Profiles

Leaderboards and match history are currently driven by local mock data.

### Backend Tasks
- [ ] **Ranking System Engine**:
  - [ ] Add `xp (IntegerField)` and `mmr (IntegerField)` to the User model/profile.
  - [ ] Post-match XP awards: `+50 WIN`, `+25 DRAW`, `+15 LOSS` (+ streak bonuses up to +25 for 3-win streaks).
  - [ ] MMR/Elo update on every match result for fair matchmaking pairing.
- [ ] **Leaderboard REST API**: `GET /api/rankings/leaderboard/`
  - Returns top 100 players ranked by XP descending.
  - Supports optional `?tier=Gold` filter.
  - Response shape per player:
    ```json
    {
      "rank": 1, "username": "QuantumKing", "tier": "Ruby",
      "xp": 1200000, "mmr": 1850,
      "wins": 280, "losses": 32, "draws": 8, "earnings": 56000
    }
    ```
- [ ] **Match History REST API**: `GET /api/matches/history/`
  - Returns authenticated user's last 50 match results, newest first.
  - Response shape per record:
    ```json
    {
      "id": "m_001", "game": "Tic Tac Toe", "opponent": "ShadowMaster",
      "result": "WIN", "earnings": 475, "date": "2026-05-25", "time": "14:32"
    }
    ```
- [ ] **Player Search API**: `GET /api/players/search/?q={username}`
  - Case-insensitive partial match on `username`.
  - Excludes the requesting user from results.
  - Max 20 results per query.
  - Returns same public shape as leaderboard row.
- [ ] **Public Player Profile API**: `GET /api/players/{username}/`
  - Returns one player's public profile (same fields as search).
  - Used by the **Player Profile Modal** when tapping a row in the Leaderboard.

### Frontend Tasks
- [x] **Leaderboard Screen**: Dynamic leaderboard with Top-3 podium, standings table, and "My Rank" footer.
- [x] **Profile Stats**: Tier badge, XP progress bar, win/loss/draw stats on the **Me** tab.
- [x] **Match History Feed**: Game history log with opponent, result, earnings, and date.
- [x] **Player Profile Modal**: Tap any leaderboard row → bottom-sheet with badge, stats, win rate, and **Challenge** CTA.
- [x] **Player Search UI**: Search bar on Leaderboard + Challenge pages, wired to `GET /api/players/search/?q=`.

---

## 🎮 6. Game Catalog & Multi-Engine Scaling

Tic Tac Toe is the only fully playable game. Ten more are planned.

### Backend Tasks
- [ ] **State Machine Abstraction**: Generic game interface supporting:
  - Turn-based games (Chess, Checkers, Reversi).
  - Physics/sync validation (Basketball, Snooker).
  - Puzzle scoring (Word Hunt, Anagram).
- [ ] **Add Game Engines**: WebSocket consumer + move validator for each new game.
- [ ] **Live Activity Feed**: `GET /api/matches/live/` or WebSocket channel returning currently active matches for a spectator/lobby view.

### Frontend Tasks
- [ ] **Game Prototypes**: React boards/controllers for Basketball, Snooker, Reversi, etc.
- [ ] **Visual Customization**: Styled assets and turn indicators per game.

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
