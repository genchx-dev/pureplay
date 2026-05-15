import { WSEvent } from './events';
import { useGameStore } from '../../store/game.store';

export const handleWSMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data);
    console.log('WS Message:', data);
    
    switch (data.type) {
      case WSEvent.MOVE_MADE:
        useGameStore.getState().setBoard(data.board);
        useGameStore.getState().setCurrentPlayer(data.nextPlayer);
        useGameStore.getState().resetTimer();
        break;
      case WSEvent.MATCH_START:
        useGameStore.getState().setStatus('playing');
        if (data.board) useGameStore.getState().setBoard(data.board);
        break;
      case WSEvent.GAME_OVER:
        console.log('Game Over:', data.winner);
        useGameStore.getState().setStatus('finished');
        break;
      case WSEvent.ERROR:
        console.error('WS Error message:', data.message);
        break;
      default:
        console.warn('Unhandled WS event type:', data.type);
    }
  } catch (err) {
    console.error('Failed to parse WS message', err);
  }
};
