# PUREPLAY Project Blueprint

## Project Overview
A real-time competitive gaming platform MVP, starting with TicTacToe, featuring staking/escrow and a reusable turn-based engine.

## Tech Stack
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + Zustand (Transitioning to Scalable Modular Architecture)
- **Backend:** Django + Django Channels + Redis + Postgres (Scalable Event-Driven Architecture)

## Design System
- **Theme:** Gold & Black
- **Background:** `#0A0A0A`
- **Cards/Panels:** `#1C1C1E`
- **Primary Brand:** `#FFCC33` (Gold)
- **Text:** `#F8FAFC` (Off-white)

## Project Architecture

### Frontend (Scalable Modular)
- `app/`: Route grouping (auth vs main), layout separation, protected routes.
- `components/`: Modular UI, layout, and feature-specific components (wallet, game, etc.).
- `services/`: Modularized API (auth, wallet, game) and a robust WebSocket system.
- `store/`: Unified state management with Zustand.
- `hooks/`: Abstraction layer between UI and services.
- `types/`: Shared contract types.

### Backend (Scalable Event-Driven)
- `config/`: Multi-environment settings (dev, prod, test).
- `core/`: Shared platform logic (Realtime Event Bus, Security/JWT, Cache/Redis).
- `apps/`: Domain-driven apps (Users, Wallet, Matchmaking, Games, Matches, Tournaments).
- `games/`: Pluggable game engine registry (TicTacToe, Pool ready).
- `matches/`: Lifecycle-controlled match states (active, paused, completed, etc.).
- `analytics/`: Business intelligence (revenue, retention, gameplay).

## Current Phase: Architecture & Integration
- [x] Project Scaffolding
- [x] Theme & UI Foundation
- [x] Scalable Backend Structure Created (Partially Implemented)
- [ ] Frontend Structure Refactor (Planned)
- [x] Auth Flow Implementation (Frontend & Backend Core)
- [ ] Wallet & Staking System
- [ ] Matchmaking Engine

## 🏁 Professional Handover (For Partner/Gemini CLI)

### 🤖 Message to the next AI Agent:
Greetings. You are picking up the **PUREPLAY Real-Time Gaming Platform**.
The project is architected for **scalability and domain-driven design**. 

**Your current objectives:**
1.  **Backend Core:** Activate the virtual environment and ensure `Django` + `Channels` are running.
2.  **Wallet Domain:** The `apps/wallet` model is created but needs logic for staking/escrow.
3.  **Real-Time Bridge:** The frontend is already emitting/listening for WebSocket events (see `frontend/src/services/websocket/`). 
4.  **Game Logic (10s Turn Limit):** You MUST implement server-side turn management. If a player fails to move within 10 seconds, the server must automatically trigger a `TURN_SKIP` and pass control to the other player.
5.  **Security:** Ensure the JWT passed in the WS query params is correctly validated in `core/security/jwt.py`.

### ⚡ Optimization & Network Performance
- **Zustand Store:** Already optimized as an Atomic Store (Zustand is ~1KB).
- **Payloads:** Use minimal JSON payloads for WebSocket events (e.g., `{"type": "MOVE", "pos": 4}`).
- **Network Resilience:** The frontend includes an `ErrorBoundary`. The backend should handle socket reconnects without resetting the board state.

### 🛠 Tech Stack Details
- **Frontend:** React 19 + Zustand (Atomic Store) + Tailwind CSS 4.
- **Backend:** Django 5 + SimpleJWT + Daphne (Channels).
- **Communication:** Standard REST for Auth/Wallet, WebSocket for Match lifecycle.

### 📍 Domain Map
- `apps.users`: Custom User model with tiers/rank.
- `apps.wallet`: ₦ Balance & Transactions.
- `apps.matches`: Real-time game logic & state sync.
- `apps.matchmaking`: Player queueing logic.

### 🚀 Bootstrapping Command
```powershell
# For the next Agent
python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt; python manage.py migrate; python manage.py runserver
```

---

## Integration Guide for Backend Partner
- **API Base:** Use `VITE_API_URL` (default: `http://localhost:8000/api`)
- **WS Base:** Use `VITE_WS_URL` (default: `ws://localhost:8000/ws`)
- **WebSocket Auth:** Token passed as query param `?token=...`
- **WS Events:** `MATCH_START`, `MOVE_MADE`, `GAME_OVER`, `ERROR`
- **Event Bus:** Implementation of `dispatcher.py` for cross-app communication.

