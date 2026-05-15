import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { connectWebSocket } from '../../../services/websocket/socket';

export const MatchmakingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate finding a match and connecting
    const matchId = '123'; // This would come from an API call
    connectWebSocket(matchId);

    const timer = setTimeout(() => {
      navigate('/game');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4">
      <div className="relative">
        <Loader2 className="animate-spin text-primary mb-8" size={64} />
        <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full"></div>
      </div>
      <h2 className="text-3xl font-shrikhand text-primary uppercase tracking-widest mb-2">Searching...</h2>
      <p className="text-zinc-500 font-medium">Finding a worthy adversary for you</p>
      
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
    </div>
  );
};
