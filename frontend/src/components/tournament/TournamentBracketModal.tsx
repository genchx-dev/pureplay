import { X, Trophy, Swords } from 'lucide-react';
import type { Tournament } from '../../types/tournament.types';
import type { User } from '../../types/auth.types';

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

interface TournamentBracketModalProps {
  tournament: Tournament;
  user: User | null;
  onClose: () => void;
}

export const TournamentBracketModal = ({ tournament, user, onClose }: TournamentBracketModalProps) => {
  const username = user?.username || 'You';

  // Generate matching competitor nodes based on whether the user joined or not
  const player1 = tournament.isJoined ? username : 'AlphaGamer';
  const player2 = 'ShadowMaster';
  const player3 = 'QuantumKing';
  const player4 = 'ProGamerX';
  const player5 = 'NightOwl';
  const player6 = 'CryptoChamp';
  const player7 = 'BlitzKing';
  const player8 = 'TacticsGod';

  // Determine scores and states based on tournament status
  const isLive = tournament.status === 'active' || tournament.status === 'live';
  const isCompleted = tournament.status === 'completed';

  const round1 = [
    { id: 1, p1: player1, p2: player2, score1: isCompleted ? 1 : isLive ? 2 : null, score2: isCompleted ? 2 : isLive ? 1 : null, status: isLive ? 'completed' : 'pending' },
    { id: 2, p1: player3, p2: player4, score1: isCompleted ? 2 : isLive ? 2 : null, score2: isCompleted ? 0 : isLive ? 0 : null, status: isLive ? 'completed' : 'pending' },
    { id: 3, p1: player5, p2: player6, score1: isCompleted ? 0 : isLive ? 1 : null, score2: isCompleted ? 2 : isLive ? 2 : null, status: isLive ? 'completed' : 'pending' },
    { id: 4, p1: player7, p2: player8, score1: isCompleted ? 1 : isLive ? 0 : null, score2: isCompleted ? 2 : isLive ? 2 : null, status: isLive ? 'completed' : 'pending' },
  ];

  const round2 = [
    { 
      id: 5, 
      p1: isCompleted ? player2 : isLive ? player1 : 'TBD', 
      p2: isCompleted ? player3 : isLive ? player3 : 'TBD', 
      score1: isCompleted ? 2 : isLive ? null : null, 
      score2: isCompleted ? 1 : isLive ? null : null, 
      status: isCompleted ? 'completed' : isLive ? 'playing' : 'pending' 
    },
    { 
      id: 6, 
      p1: isCompleted ? player6 : isLive ? player6 : 'TBD', 
      p2: isCompleted ? player8 : isLive ? player8 : 'TBD', 
      score1: isCompleted ? 0 : isLive ? null : null, 
      score2: isCompleted ? 2 : isLive ? null : null, 
      status: isCompleted ? 'completed' : isLive ? 'playing' : 'pending' 
    },
  ];

  const round3 = [
    { 
      id: 7, 
      p1: isCompleted ? player2 : 'TBD', 
      p2: isCompleted ? player8 : 'TBD', 
      score1: isCompleted ? 3 : null, 
      score2: isCompleted ? 2 : null, 
      status: isCompleted ? 'completed' : 'pending' 
    },
  ];

  const champion = isCompleted ? player2 : 'TBD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-primary/20 bg-gradient-to-b from-zinc-950 to-black p-6 md:p-8 shadow-2xl shadow-primary/5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-zinc-500 hover:text-zinc-300 transition-colors p-2 hover:bg-zinc-900 rounded-full"
          aria-label="Close Brackets"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-8 pr-12">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">
            {tournament.status === 'registration_open' ? 'Bracket Draft' : 'Live Tournament Brackets'}
          </div>
          <h2 className="text-2xl font-shrikhand uppercase tracking-widest text-primary mb-2">
            {tournament.name}
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl">
            {tournament.status === 'registration_open' 
              ? 'Registration is open. Brackets are draft and will lock once participants join.' 
              : 'Matches are Best of 3 (BO3). Follow the live matches below.'}
          </p>
        </div>

        {/* Tournament Bracket Tree Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch overflow-x-auto min-w-[700px] pb-6 scrollbar-hide">
          
          {/* Round 1: Quarterfinals */}
          <div className="flex flex-col justify-around gap-4 min-h-[400px]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 pl-1">Quarterfinals</div>
            {round1.map((match) => (
              <div key={match.id} className="bg-card border border-zinc-800 rounded-2xl p-3.5 relative shadow-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-3">
                    <span className={`text-xs font-bold truncate ${match.p1 === username ? 'text-primary font-black' : 'text-zinc-300'}`}>{match.p1}</span>
                    <span className="text-xs font-black font-mono text-zinc-400">{match.score1 !== null ? match.score1 : '-'}</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800/80" />
                  <div className="flex justify-between items-center gap-3">
                    <span className={`text-xs font-bold truncate ${match.p2 === username ? 'text-primary font-black' : 'text-zinc-300'}`}>{match.p2}</span>
                    <span className="text-xs font-black font-mono text-zinc-400">{match.score2 !== null ? match.score2 : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Round 2: Semifinals */}
          <div className="flex flex-col justify-around gap-4 min-h-[400px]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1 pl-1">Semifinals</div>
            {round2.map((match) => (
              <div 
                key={match.id} 
                className={`bg-card border rounded-2xl p-3.5 relative shadow-lg ${
                  match.status === 'playing' ? 'border-primary/50 shadow-md shadow-primary/5' : 'border-zinc-800'
                }`}
              >
                {match.status === 'playing' && (
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[8px] font-black uppercase text-primary tracking-wider animate-pulse">
                    Live
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-3">
                    <span className={`text-xs font-bold truncate ${match.p1 === username ? 'text-primary font-black' : 'text-zinc-300'}`}>{match.p1}</span>
                    <span className="text-xs font-black font-mono text-zinc-400">{match.score1 !== null ? match.score1 : '-'}</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800/80" />
                  <div className="flex justify-between items-center gap-3">
                    <span className={`text-xs font-bold truncate ${match.p2 === username ? 'text-primary font-black' : 'text-zinc-300'}`}>{match.p2}</span>
                    <span className="text-xs font-black font-mono text-zinc-400">{match.score2 !== null ? match.score2 : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Round 3: Finals */}
          <div className="flex flex-col justify-center gap-4 min-h-[400px]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 pl-1">Finals</div>
            {round3.map((match) => (
              <div key={match.id} className="bg-card border border-zinc-800 rounded-2xl p-4 shadow-xl">
                <div className="space-y-3">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs font-black text-zinc-300 truncate">{match.p1}</span>
                    <span className="text-xs font-black font-mono text-zinc-400">{match.score1 !== null ? match.score1 : '-'}</span>
                  </div>
                  <div className="h-[1px] bg-zinc-800/80" />
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs font-black text-zinc-300 truncate">{match.p2}</span>
                    <span className="text-xs font-black font-mono text-zinc-400">{match.score2 !== null ? match.score2 : '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Column 4: Champion Display */}
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Champion</div>
            <div className="rounded-[2rem] border-2 border-primary bg-primary/5 p-6 text-center shadow-2xl shadow-primary/10 max-w-[200px] w-full relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black">
                <Trophy size={28} className="animate-bounce" />
              </div>
              <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Winner</div>
              <div className="mt-2 text-sm font-black text-white truncate uppercase tracking-wide">
                {champion}
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Swiss Payout Matrix */}
        <div className="mt-8 pt-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Swords size={14} className="text-primary" />
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Swiss Prize Split</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { pos: '1st Place', pct: '40%', val: tournament.prizePool * 0.4 },
              { pos: '2nd Place', pct: '25%', val: tournament.prizePool * 0.25 },
              { pos: '3rd Place', pct: '15%', val: tournament.prizePool * 0.15 },
              { pos: '4th Place', pct: '12%', val: tournament.prizePool * 0.12 },
              { pos: '5th Place', pct: '8%',  val: tournament.prizePool * 0.08 }
            ].map((prize) => (
              <div key={prize.pos} className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-center">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{prize.pos}</div>
                <div className="mt-1.5 text-xs font-black text-primary">{formatMoney(prize.val)}</div>
                <div className="text-[8px] font-bold text-zinc-600 mt-0.5">{prize.pct} Pool</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
