# PurePlay Remaining Tasks: Frontend vs. Backend

To make the **PurePlay** platform fully production-ready, we need to bridge the gaps between the current React frontend placeholders and the Django REST/Channels backend. 

Below is an exhaustive breakdown of the remaining tasks, categorized by component and assigned to either the **Frontend** or **Backend**.

---

## 🔐 1. Authentication & Profile Persistence
Currently, the registration form collects a phone number, but the backend does not persist it.

### Backend Tasks
- [ ] **Database Migration**: Add a `phone_number` field to the custom User model (or user profile).
- [ ] **Register API**: Update `POST /api/auth/register/` to validate and save the `phone` field.
- [ ] **Profile API**: Include `phone` in the `GET /api/auth/profile/` response.
- [ ] **Validation**: Implement phone format validation (e.g., E.164 format).

### Frontend Tasks
- [x] **API Payload Update**: Include the `phone` field in the register API call payload.
- [x] **Profile Storage**: Store and display the user's phone number on the **Me** / Profile tab.
- [x] **Loading & Error Handling**: Show validation errors from the backend on the registration form.

---

## 💰 2. Wallet Ledger & Settlements
Currently, wallet balances are static placeholders, and transaction history is empty.

### Backend Tasks
- [ ] **Wallet Database Schema**: Create tables for `Wallet` (with `balance` and `locked_balance`) and `Transaction` records (credits, debits, stakes, payouts).
- [ ] **Staking Engine**:
  - [ ] Implement `POST /api/wallet/lock-stake/` to move funds from `balance` to `locked_balance` when entering matchmaking or joining a tournament.
  - [ ] Implement `POST /api/wallet/settle-match/` to resolve stakes (platform fee deduction + payout to winner).
- [ ] **Ledger Endpoints**:
  - [ ] Complete `POST /api/wallet/deposit/` integration (using a payment gate provider mock/live API).
  - [ ] Complete `POST /api/wallet/withdraw/` with validations.
  - [ ] Return real records in `GET /api/wallet/transactions/`.

### Frontend Tasks
- [x] **Enable Wallet UI**: (DEPRECATED - Wallet balance, deposits, and withdrawals have been consolidated directly into the **Me** page).
- [x] **Transactions List**: Connect `GET /api/wallet/transactions/` to the user profile and transaction tables (fully completed on the **Me** page's transaction ledger panel).
- [ ] **Staking Feedback**: Add UI state to show locked stakes before a match begins.

---

## 🤝 3. Real Challenge Lifecycle & Phone Notifications
The current matchmaking creates a match immediately. It needs to transition to a true invite-accept-decline sequence with notification integration.

### Backend Tasks
- [ ] **Challenge Database Model**: Track `Challenge` states (`pending`, `accepted`, `declined`, `expired`).
- [ ] **Challenge Lifecycle REST API**:
  - [ ] `POST /api/matchmaking/challenge/` - Creates a pending invitation.
  - [ ] `GET /api/matchmaking/challenges/incoming/` - Retrieves active challenges for a player.
  - [ ] `POST /api/matchmaking/challenges/{id}/accept/` - Transitions challenge to an active Match and sets up the WebSocket.
  - [ ] `POST /api/matchmaking/challenges/{id}/decline/` - Declines and cancels the challenge.
- [ ] **Challenge Notifications (SMS Gateway)**: Integration hook to dispatch an SMS/notification using the opponent's registered phone number.
- [ ] **Auto-Expiry Task**: Background scheduler (e.g., Celery or background threads) to automatically decline/expire invites after a timeout (e.g., 60 seconds).

### Frontend Tasks
- [x] **Challenge UI Flow**:
  - [x] Implement an "Incoming Challenge" overlay modal on the Dashboard showing the opponent's name, stake, and accept/decline buttons.
  - [x] Show a "Challenge Sent, Waiting..." state spinner to the sender with a cancel option.
- [x] **Queue Polling / Notifications**: Listen for incoming challenges on the global websocket or long-poll.

---

## 🏆 4. Tournament Management System
The home dashboard and tournament screens are fully static. We need to implement both the Pure Knockout and Swiss Hybrid systems.

### Backend Tasks
- [ ] **Tournament Database Schema**: Models for `Tournament`, `TournamentParticipant`, `Round`, and `Bracket`.
- [ ] **Tournament REST API**:
  - [ ] `GET /api/tournaments/featured/` - Return the featured countdown, participants, and prize pools.
  - [ ] `POST /api/tournaments/{id}/join/` - Process entry fee (lock stake in Wallet) and add the user.
  - [ ] `GET /api/tournaments/{id}/prizes/` - Return the prize distribution matrix.
- [ ] **Knockout Bracket Logic**: Handle play-in rounds when participant count is not a power of 2.
- [ ] **Swiss Stage Matchmaking**:
  - [ ] Implement match-point calculations (+3 for win, 0 for loss).
  - [ ] Swiss pairing algorithm (pairing players with identical/similar records).
  - [ ] Bracket lock and knockout-finals qualification logic.
- [ ] **Prize Settlement Engine**: Automate payout distribution to the top 10 (Knockout) or top 5 (Swiss Hybrid) according to specified percentages.

### Frontend Tasks
- [x] **Tournament List & Detail Pages**: Render list of active/upcoming tournaments.
- [x] **Join Action**: Hook up "Register" button, validating wallet balance against entry fee.
- [x] **Live Bracket Display**: Create a visual tournament bracket tree (e.g., quarterfinals, semifinals, finals).
- [x] **Prize Table**: Display live calculated prize pools and payouts.

---

## 📊 5. Rankings, MMR & Profile History
Leaderboards and match history are currently static.

### Backend Tasks
- [ ] **Ranking System Engine**: 
  - [ ] Add `XP` and `MMR` fields to the User profiles.
  - [ ] Calculate XP rewards post-match (+50 for wins, +25 for draws, +15 for losses, plus streak bonuses).
  - [ ] Implement MMR/Elo algorithm updates for fair matchmaking.
- [ ] **Leaderboard REST API**: `GET /api/rankings/leaderboard/` returning users ranked by XP, filtered by Tier.
- [ ] **Match History REST API**: `GET /api/matches/history/` returning historical match results.
- [ ] **Player Search API**: `GET /api/players/search/?q={username}` — search players by username.
  - [ ] Case-insensitive partial match on `username` field (e.g. `?q=king` returns `QuantumKing`).
  - [ ] Return public fields only: `username`, `rank`, `tier`, `xp`, `wins`, `losses`, `draws`, `earnings`.
  - [ ] Exclude the requesting user from own search results.
  - [ ] Limit results to max 20 per query.
- [ ] **Public Player Profile API**: `GET /api/players/{username}/` — return a single player's public profile (same fields as search). Used when clicking a player row in the leaderboard or challenge list.

### Frontend Tasks
- [x] **Leaderboard Screen**: Fetch and render the live leaderboard on the **Leaderboard** tab (fully integrated with local mock fallback).
- [x] **Profile Stats**: Display the user's Tier (using new 10-tier visuals), total XP, progress bar, and win/loss records on the **Me** screen.
- [x] **Match History Feed**: Render the match history log showing opponent username, game played, stake, outcome, and date (fully integrated with local storage tracking).
- [x] **Player Profile Modal**: Tapping any player row in the Leaderboard opens a bottom-sheet/modal showing their full tier badge, Win/Loss/Draw stats, win rate bar, total earnings, and a **Challenge** CTA that navigates directly to the Challenge tab.
- [ ] **Player Search UI**: Add a search bar on the Leaderboard and Challenge pages so users can find opponents by username. Wire to `GET /api/players/search/?q=` once the backend endpoint is live (local mock fallback until then).


---

## 🎮 6. Game Catalog & Multi-Engine Scaling
Tic Tac Toe is the only active game. Ten other games are planned.

### Backend Tasks
- [ ] **State Machine Abstraction**: Define a generic game state machine interface that accommodates:
  - Turn-based games (Chess, Checkers, Reversi).
  - Physics/Sync validation (Basketball, Pool).
  - Puzzle validation/scoring (Word Hunt, Anagrams).
- [ ] **Add Game Engines**: Create validation and WebSocket consumers for new games.
- [ ] **Live Activity / Spectator Feed**: Implement a WebSocket feed or REST endpoint returning active matches so users can see what others are playing while waiting for their match or turn.

### Frontend Tasks
- [ ] **Game Prototypes**: Implement localized React boards/practice controllers for Basketball, Snooker, Reversi, etc.
- [ ] **Visual Customization**: Style interactive assets and turn indicators for added games.

---

## 🧪 7. Testing & Quality Assurance
The codebase lacks robust test coverage.

### Backend Tasks
- [ ] **REST API Tests**: Create tests for registration, profile, wallet balance, and tournament registration.
- [ ] **WebSockets & Channels Tests**: Write test cases for game moves, turn-timeouts, victory declarations, and payouts.

### Frontend Tasks
- [ ] **Zustand Store Tests**: Assert state changes for auth, wallet, and game state.
- [ ] **Component Tests**: Add render and action tests for matchmaking queues and game board turns.

---

## ⚖️ 8. Production Hardening
Prepare the platform to scale out of the local development environment.

### Backend Tasks
- [ ] **Matchmaking Engine**: Replace local memory queue logic with Redis for multi-server synchronization.
- [ ] **Database Migration**: Switch from SQLite to PostgreSQL.
- [ ] **Production Settings**: Hardened CORS headers, SSL configurations, and environment secrets management.
