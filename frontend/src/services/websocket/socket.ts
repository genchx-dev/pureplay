import { useGameStore } from '../../store/game.store';
import { useAuthStore } from '../../store/auth.store';
import { handleWSMessage } from './handlers';
import { WSEvent } from './events';

let socket: WebSocket | null = null;

export const connectWebSocket = (matchId: string) => {
  const token = useAuthStore.getState().token;
  const gameStore = useGameStore.getState();

  if (!token) {
    gameStore.setStatus('error');
    gameStore.setError('Sign in again to join this match');
    return;
  }

  const baseUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000/ws`;
  const wsUrl = `${baseUrl}/matches/${matchId}/?token=${token}`;

  if (socket) {
    socket.close();
  }

  gameStore.setMatchId(matchId);
  gameStore.setStatus('connecting');
  gameStore.setError(null);
  
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket Connected');
  };
  
  socket.onmessage = handleWSMessage;

  socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
    useGameStore.getState().setError('Connection error. Reconnecting may be required.');
  };

  socket.onclose = (event) => {
    console.log('WebSocket Disconnected', event.reason);
    const state = useGameStore.getState();
    if (state.status !== 'finished' && state.status !== 'draw') {
      state.setStatus('waiting');
    }
  };
};

export const sendMove = (position: any) => {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ 
      type: WSEvent.MAKE_MOVE, 
      payload: { position } 
    }));
  } else {
    console.warn('Socket not open. Current state:', socket?.readyState);
  }
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};
