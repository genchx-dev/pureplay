# PurePlay Remaining Tasks: Frontend vs. Backend

This document tracks all outstanding work to bridge the current React frontend with the Django REST/Channels backend.

**Legend:** `[ ]` = pending · `[/]` = in progress · `[x]` = done

---

## 🔥 Backend Priority Order

| Priority | Section | Task | Status |
|---|---|---|---|
| 1 | Auth | Persist `phone_number` on register | Done |
| 2 | Rankings | XP & MMR fields + post-match calculation | Done |
| 3 | Rankings | `GET /api/rankings/leaderboard/` | Done |
| 4 | Rankings | `GET /api/players/search/?q=` | Pending |
| 5 | Rankings | `GET /api/players/{username}/` | Pending |
| 6 | Rankings | `GET /api/matches/history/` | Done |
| 7 | Wallet | Real wallet schema + staking engine | Done |
| 8 | Challenges | Challenge lifecycle API + SMS notifications | API Done, SMS Pending |
| 9 | Tournaments | Tournament schema + bracket logic | Done |
| 10 | Tic Tac Toe | Best of Three Rounds & Real Usernames | Done |
| 11 | Games | Game engine abstraction + Whot! Cards multiplayer | Done |
| 12 | Admin | Dashboard statistics, chart data & logs APIs | Done |
| 13 | Admin | Visual Bracket tree, polling, live spectating & filters | Done |
| 14 | Hardening | Redis queue, PostgreSQL migration, production settings | Pending |

---

## 🔐 1. Authentication & Profile Persistence

The registration form already sends `phone` from the frontend — the backend saves it.

## 🏆 21. Completed Tournament State & Homepage Standings Integration

We integrated full support for the completed tournament state on both backend and frontend, displaying a detailed gold-styled championship card and the top 5 final standings on the homepage.

### Changes Made:

#### Backend Enhancements:
- **Tournament Completion State Transitions** ([services.py](file:///c:/Users/USER/pureplay/pureplay-main/backend/apps/tournaments/services.py)):
  - Updated the `assign_ranks` method in `KnockoutService`. Once the final ranks are generated and prizes are distributed, the method now explicitly transitions the `Tournament`'s status to `completed` and sets `completed_at` to the current timestamp in the database.
- **Top 5 Winners Serialization** ([serializers.py](file:///c:/Users/USER/pureplay/pureplay-main/backend/apps/tournaments/serializers.py)):
  - Declared `winners` SerializerMethodField on both `TournamentSerializer` and `TournamentDetailSerializer`.
  - Serializes the top 5 players (ranks 1 to 5) by ordering the tournament's participants by `current_rank` ascending. This returns names and ranks once the tournament transitions to the completed status.

#### Frontend UI & Logic:
- **Zustand Store Normalization** ([tournament.store.ts](file:///c:/Users/USER/pureplay/frontend/src/store/tournament.store.ts)):
  - Updated `normalizeTournament` to map and persist the `winners` list from API payloads into the frontend Zustand state.
  - Added type definition for `winners?: { rank: number; username: string }[];` in the [Tournament](file:///c:/Users/USER/pureplay/frontend/src/types/tournament.types.ts) interface.
- **Championship Standings Card** ([page.tsx](file:///c:/Users/USER/pureplay/frontend/src/app/(main)/tournaments/page.tsx)):
  - Included `completed` tournaments under the active list filter to display them in the main dashboard stream.
  - Styled completed tournament cards with a premium gold theme (`border-primary/40` and gold Trophy header).
  - Replaced the action buttons with an inline **Tournament Champion** card and a **Final Standings** table listing positions 1st through 5th with medals (🥇, 🥈, 🥉, 🏅).
  - Provided a secondary "View Bracket Tree" button allowing users to review the completed bracket.
- **Bracket Actions Hardening** ([TournamentBracketModal.tsx](file:///c:/Users/USER/pureplay/frontend/src/components/tournament/TournamentBracketModal.tsx)):
  - Disabled the "Join Match", "Play Match", and "Spectate" buttons inside the bracket columns if the tournament is completed, ensuring the tree is shown in read-only mode after completion.

---

## 🏆 22. Completed Tournament Homepage Feed and Auto-Opening Bracket

We resolved the issue where completed tournaments vanished from the dashboard stream and did not update the homepage feed with the winners' usernames.

### Changes Made:
- **Backend Active/Completed Listing Endpoint** ([services.py](file:///c:/Users/USER/pureplay/pureplay-main/backend/apps/tournaments/services.py)):
  - Modified the `list_active_tournaments` method in `TournamentService` to return `completed` tournaments as well as `registering` and `in_progress` ones. This ensures the database returns the completed tournament to the frontend, preventing the frontend store from falling back to empty/mock data when no tournaments are actively registering.
- **Homepage Featured Tournament Selection** ([page.tsx](file:///c:/Users/USER/pureplay/frontend/src/app/(main)/dashboard/page.tsx)):
  - Updated the featured tournament query logic inside `HomeContent` to fall back to the most recent `completed` tournament if no active/live/registering tournaments exist.
- **Premium Gold Completed Hero Card** ([TournamentHero.tsx](file:///c:/Users/USER/pureplay/frontend/src/components/tournament/TournamentHero.tsx)):
  - Redesigned `TournamentHero` to support completed layouts.
  - Renders a gold-themed **Tournament Champion** panel displaying the 1st place winner's username (e.g. `clas5`) and a bouncy trophy icon.
  - Displays a **Final Standings** panel showing ranks 1st to 5th with medals alongside their real usernames.
  - Updated the button to display `"View Bracket Tree"` with gold styling.
- **Switch & Auto-Open Modal Navigation** ([page.tsx](file:///c:/Users/USER/pureplay/frontend/src/app/(main)/dashboard/page.tsx)):
  - Configured `onTournamentClick` to update the browser search parameters (`?tab=tournament&openBracket=${tournamentId}`). This automatically redirects the user to the tournament tab and opens the bracket tree overlay for that specific tournament.

---

## 🔒 23. Completed Game Room Redirection Hardening

We resolved the issue where users could access or remain stuck inside completed tournament game rooms.

### Changes Made:
- **Instant Game Over Broadcast for Stale/Completed Matches** ([consumers.py](file:///c:/Users/USER/pureplay/pureplay-main/backend/apps/matches/consumers.py)):
  - Refactored `send_match_start` in the WebSocket consumer. If a connection is established to a match that has already been marked as `completed` in the database, the server will now initialize the client's board coordinates and then immediately send a `GAME_OVER` event with the winner and results.
  - Prevents the server from scheduling turn timeouts or triggering computer agent moves for completed games.
- **Frontend Game Exit Auto-Redirect** ([page.tsx](file:///c:/Users/USER/pureplay/frontend/src/app/(main)/game/page.tsx)):
  - Verified that when the game store receives the `GAME_OVER` socket event, the client immediately transitions to a `finished` status. This triggers the auto-redirect `useEffect` hook, which safely transitions the player out of the game room back to the bracket screen after `3` seconds.

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

Tic Tac Toe, Chess, and Whot! Cards are fully playable multiplayer games. Other games are in planning.

### Backend Tasks
- [x] **State Machine Abstraction**: Generic `AbstractGameEngine` interface supporting various formats.
- [x] **Add Game Engines**: WebSocket consumer + move validator for Tic Tac Toe, Chess, and Whot! Cards.
- [ ] **Live Activity Feed**: Spectator lobby feed.

### Frontend Tasks
- [x] **Game Prototypes**: Tic Tac Toe, Chess, and Whot! boards fully implemented.
- [x] **Whot! Cards**: Multiplayer Whot! game board connected to live sockets, queue matchmaker, and auto-play bot heuristics.
- [ ] **Game Prototypes (Other)**: React boards/controllers for Basketball, Snooker, Reversi, etc.
- [x] **Visual Customization**: Styled assets and turn indicators for Tic Tac Toe, Chess, and Whot! Cards.

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

## 🛠️ 10. Admin Control Panel & Live Bracket Spectating

To implement a complete administration suite for platform staff to monitor operations, manage matches/tournaments, and spectate live brackets.

### 🧑‍💻 Backend Tasks
- [x] **Staff Authentication Gate**:
  - Define `IsStaffUser` permission class to secure admin routes.
  - Return `is_staff` flag inside user profile responses.
- [x] **Dashboard Metrics Endpoint**:
  - Build statistics views returning user metrics, match metrics, and financial summaries.
  - Calculate platform cuts and separate revenue splits by source (Tournament fee commission vs. Quick Match rakes).
- [x] **Daily Analytics Endpoints**:
  - Expose daily timeseries for signups, matches, deposits, and stakes for interactive graphs.
- [x] **Operations Management endpoints**:
  - `/api/admin/users/` (paginated, searchable user database).
  - `/api/admin/transactions/` (audit ledger of deposits, stakes, payouts).
  - `/api/admin/tournaments/` (tournament listings with creation and manual start/cancel triggers).

### 🎨 Frontend Tasks
- [x] **Protected Administration Shell**:
  - Build layout with navigation sidebar and header.
  - Add navigation routes and guards for staff-only access.
  - Conditionally display the "Admin" entry point in the dashboard navigation for elevated staff users.
- [x] **Overview Analytics Dashboard**:
  - Render dynamic summary cards with trend arrows.
  - Plot daily performance charts using native responsive SVG lines and bars (zero external dependencies).
- [x] **Operations Tables**:
  - Build reusable paginated lists with remote search and state filters for Users, Matches, and Tournaments.
  - Redesign the Transactions log into tabbed categories (All, Deposits, Withdrawals, Stakes, Winnings, Refunds) for separated section reviews.
- [x] **Live Bracket Spectating Modal**:
  - Integrate `react-brackets` tree visualization to map database-driven rounds dynamically.
  - Implement 3-second automatic polling to track progression live.
  - Add "Spectate" buttons opening the active WebSocket game room in a read-only viewer mode for any match.
  - Hardened live updates: replaced fullscreen "Loading Bracket..." overlays with a localized loading spinner container inside the modal itself, preventing jarring screen flashes as matches advance.
  - Concluded match seeds: dimmed only the losing player rows internally (to 45% opacity) and styled scores based on outcome (green for winners, grey for losers) alongside clear indicators (Crown badge for winners, red Cross for losers) instead of dimming the entire bracket seed container.

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
