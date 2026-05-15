# PUREPLAY Frontend (MVP)

A real-time competitive gaming platform MVP, featuring a premium "Gold & Black" aesthetic, built with React 19 and Tailwind CSS 4.

## 🚀 Key Features
- **Premium UI:** Standardized Gold & Black theme with Shrikhand branding.
- **Auth Flow:** Complete Login/Register flow with session restoration (`checkAuth`).
- **Real-time Ready:** WebSocket service integrated for live game synchronization.
- **Responsive:** Optimized for both Mobile (Bottom Nav) and PC (Collapsible Sidebar).
- **Games:** Fully animated TicTacToe engine (Simulated for testing).

## 🛠 Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS 4 (Standardized variables in `index.css`)
- **State Management:** Zustand (Auth, Wallet, Game stores)
- **Icons:** Lucide-React
- **API Client:** Axios (with Interceptors for JWT)

## 🔧 Backend Integration Guide
The frontend is built to be "Plug & Play" for the backend partner.

### 1. Environment Variables
Create a `.env` file in the root:
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

### 2. API Expectations
- **Auth:**
  - `POST /auth/register/` -> Returns `{ user, token }`
  - `POST /auth/login/` -> Returns `{ user, token }`
  - `GET /auth/profile/` -> Returns user object (for session restoration)
- **Wallet:**
  - `GET /wallet/balance/` -> Returns `{ balance }`

### 3. WebSocket Contract
Connect to: `${VITE_WS_URL}/matches/{matchId}/?token={token}`

**Events Expected from Server:**
- `MATCH_START`: Initialize game state.
- `MOVE_MADE`: Update board and turn.
- `GAME_OVER`: Final results and winner.
- `ERROR`: Display backend errors.

**Actions Sent to Server:**
- `MAKE_MOVE`: Payload `{ payload: { position: number } }`

## 🏃‍♂️ Getting Started
1. `npm install`
2. `cp .env.example .env` (Configure your backend URLs)
3. `npm run dev`

---
**Note:** The Game Page currently operates in "Simulation Mode" allowing local moves for both players to facilitate UI testing.
