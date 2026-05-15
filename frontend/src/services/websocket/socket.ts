import { useGameStore } from '../../store/game.store';
import { useAuthStore } from '../../store/auth.store';
import { handleWSMessage } from './handlers';
import { WSEvent } from './events';

let socket: WebSocket | null = null;

export const connectWebSocket = (matchId: string) => {
  const token = useAuthStore.getState().token;
  const baseUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000/ws`;
  const wsUrl = `${baseUrl}/matches/${matchId}/?token=${token}`;
  
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket Connected');
    useGameStore.getState().setStatus('playing');
  };
  
  socket.onmessage = handleWSMessage;

  socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
  };

  socket.onclose = (event) => {
    console.log('WebSocket Disconnected', event.reason);
    useGameStore.getState().setStatus('waiting');
  };
};

export const sendMove = (position: number) => {
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
