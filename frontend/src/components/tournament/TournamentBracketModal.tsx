import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, Swords, Eye, Crown } from 'lucide-react';
import { Bracket, Seed, SeedItem, SeedTeam } from 'react-brackets';
import type { Tournament } from '../../types/tournament.types';
import type { User } from '../../types/auth.types';
import { useTournamentStore } from '../../store/tournament.store';

const formatMoney = (amount: number) => `NGN ${amount.toLocaleString()}`;

interface TournamentBracketModalProps {
  tournament: Tournament;
  user: User | null;
  onClose: () => void;
}

export const TournamentBracketModal = ({ tournament, user, onClose }: TournamentBracketModalProps) => {
  const navigate = useNavigate();

  const { activeBracket, bracketLoading, bracketError, fetchBracket, startMatch } = useTournamentStore();

  useEffect(() => {
    fetchBracket(tournament.id);

    if (tournament.status !== 'completed' && tournament.status !== 'cancelled') {
      const interval = setInterval(() => {
        fetchBracket(tournament.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [tournament.id, tournament.status, fetchBracket]);

  const handlePlayMatch = async (matchId: number) => {
    try {
      const liveMatchUuid = await startMatch(matchId);
      navigate(`/game/${liveMatchUuid}`);
      onClose();
    } catch (err) {
      alert('Failed to start or join match. Please try again.');
    }
  };

  const isCorrectBracketLoaded = activeBracket && activeBracket.tournament_id === tournament.id;
  const showContentLoading = bracketLoading && !isCorrectBracketLoaded;

  if (showContentLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="relative w-full max-w-5xl h-[90vh] rounded-[2.5rem] border border-primary/20 bg-gradient-to-b from-zinc-950 to-black p-6 md:p-8 shadow-2xl shadow-primary/5 flex flex-col justify-center items-center">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-zinc-500 hover:text-zinc-300 transition-colors p-2 hover:bg-zinc-900 rounded-full"
            aria-label="Close Brackets"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-sm font-bold uppercase tracking-widest text-zinc-400">Loading Bracket...</div>
          </div>
        </div>
      </div>
    );
  }

  if (bracketError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center">
          <h3 className="text-lg font-black uppercase text-red-500 mb-2">Error Loading Bracket</h3>
          <p className="text-sm text-zinc-400 mb-6">{bracketError}</p>
          <button onClick={onClose} className="px-6 py-2.5 bg-primary text-black font-black uppercase tracking-widest rounded-xl text-xs">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!activeBracket) return null;

  // Sort rounds dynamically so play_in rounds are first, followed by knockout rounds sorted by round number
  const sortedRounds = [...(activeBracket.rounds || [])].sort((a, b) => {
    const aParts = a.name.split('_');
    const bParts = b.name.split('_');
    const aType = aParts[0];
    const bType = bParts[0];
    
    if (aType === 'play' && bType !== 'play') return -1;
    if (bType === 'play' && aType !== 'play') return 1;
    
    const aNum = parseInt(aParts[aParts.length - 1], 10);
    const bNum = parseInt(bParts[bParts.length - 1], 10);
    return aNum - bNum;
  });

  const knockoutRounds = sortedRounds.filter(r => !r.name.startsWith('play'));
  const totalKnockoutRounds = knockoutRounds.length;

  const getRoundDisplayName = (roundName: string, totalRounds: number) => {
    const parts = roundName.split('_');
    if (parts[0] === 'play') return 'Play-In';
    const num = parseInt(parts[parts.length - 1], 10);
    if (num === totalRounds) return 'Finals';
    if (num === totalRounds - 1) return 'Semifinals';
    if (num === totalRounds - 2) return 'Quarterfinals';
    return `Round ${num}`;
  };

  // Find the champion if the finals round is finished
  const finalRound = sortedRounds.find(r => {
    const parts = r.name.split('_');
    return parts[0] === 'knockout' && parseInt(parts[parts.length - 1], 10) === totalKnockoutRounds;
  });
  const finalMatch = finalRound?.matches?.[0];
  const champion = finalMatch && finalMatch.status === 'completed' ? finalMatch.winner : 'TBD';

  // Format prizes dynamically
  const prizePool = activeBracket.prize_pool || tournament.prizePool;
  const prizeDistribution = activeBracket.prize_distribution || {};
  const prizeKeys = Object.keys(prizeDistribution).sort((a, b) => {
    const aNum = parseInt(a.split('-')[0], 10);
    const bNum = parseInt(b.split('-')[0], 10);
    return aNum - bNum;
  });
  const hasPrizeDistribution = prizeKeys.length > 0;

  const displayPrizes = hasPrizeDistribution
    ? prizeKeys.map((key) => ({
        pos: key === '1' ? '1st Place' : key === '2' ? '2nd Place' : key === '3' ? '3rd Place' : `${key} Place`,
        val: Number(prizeDistribution[key]),
        pct: prizePool > 0 ? `${Math.round((Number(prizeDistribution[key]) / prizePool) * 100)}%` : null
      }))
    : [
        { pos: '1st Place', pct: '40%', val: prizePool * 0.4 },
        { pos: '2nd Place', pct: '25%', val: prizePool * 0.25 },
        { pos: '3rd Place', pct: '15%', val: prizePool * 0.15 },
        { pos: '4th Place', pct: '12%', val: prizePool * 0.12 },
        { pos: '5th Place', pct: '8%',  val: prizePool * 0.08 }
      ];

  const reactBracketRounds = sortedRounds.map((round) => {
    const displayName = getRoundDisplayName(round.name, totalKnockoutRounds);
    return {
      title: displayName,
      seeds: round.matches.map((match: any) => {
        const p1Name = match.player1 || 'TBD';
        const p2Name = match.player2 || (match.round_number === 1 && match.player1 ? 'BYE' : 'TBD');
        return {
          id: match.id,
          teams: [
            { name: p1Name, score: match.player1_score },
            { name: p2Name, score: match.player2_score },
          ],
          match_id: match.match_id,
          player1_id: match.player1_id,
          player2_id: match.player2_id,
          player1: match.player1,
          player2: match.player2,
          winner: match.winner,
          status: match.status,
          round_number: match.round_number,
          originalMatch: match,
        };
      }),
    };
  });

  const CustomSeedComponent = ({ seed, breakpoint }: any) => {
    const match = seed.originalMatch;
    const p1Name = match.player1 || 'TBD';
    const p2Name = match.player2 || (match.round_number === 1 && match.player1 ? 'BYE' : 'TBD');
    const isP1User = user && (match.player1_id === user.id || match.player1 === user.username);
    const isP2User = user && (match.player2_id === user.id || match.player2 === user.username);
    
    const isMatchActive = match.status === 'active' || match.status === 'playing';

    const isP1Winner = match.status === 'completed' && match.winner && (match.winner === p1Name || match.winner === match.player1_id || match.winner === match.player1);
    const isP2Winner = match.status === 'completed' && match.winner && (match.winner === p2Name || match.winner === match.player2_id || match.winner === match.player2);
    const isP1Loser = match.status === 'completed' && match.winner && !isP1Winner && p1Name !== 'TBD' && p1Name !== 'BYE';
    const isP2Loser = match.status === 'completed' && match.winner && !isP2Winner && p2Name !== 'TBD' && p2Name !== 'BYE';
    
    const showPlayButton = 
      activeBracket.status !== 'completed' &&
      tournament.status !== 'completed' &&
      match.player1 && 
      match.player2 && 
      match.player1 !== 'TBD' && 
      match.player2 !== 'TBD' && 
      match.player2 !== 'BYE' &&
      (match.status === 'pending' || match.status === 'active') && 
      (isP1User || isP2User);

    const showSpectateButton = 
      activeBracket.status !== 'completed' &&
      tournament.status !== 'completed' &&
      isMatchActive && 
      !isP1User && 
      !isP2User && 
      match.match_id;

    return (
      <Seed mobileBreakpoint={breakpoint}>
        <SeedItem style={{
          background: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '1rem',
          padding: '0.85rem',
          position: 'relative',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          minWidth: '180px',
          opacity: match.status === 'completed' ? 0.95 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}>
          {isMatchActive && (
            <div 
              style={{
                position: 'absolute',
                top: '-10px',
                left: '16px',
                padding: '2px 8px',
                borderRadius: '9999px',
                background: 'rgba(255, 199, 0, 0.2)',
                border: '1px solid rgba(255, 199, 0, 0.3)',
                fontSize: '8px',
                fontWeight: '900',
                textTransform: 'uppercase',
                color: '#FFC700',
                letterSpacing: '0.05em'
              }}
              className="animate-pulse"
            >
              Live
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Player 1 */}
            <SeedTeam style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '0.75rem',
              opacity: isP1Loser ? 0.45 : 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0, flex: 1 }}>
                {isP1Winner && <Crown size={11} className="text-amber-400 fill-amber-400/10 shrink-0" />}
                {isP1Loser && <X size={10} style={{ color: '#f87171', opacity: 0.6, flexShrink: 0 }} />}
                <span 
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isP1User ? '900' : '700',
                    color: isP1User ? '#FFC700' : isP1Winner ? '#ffffff' : isP1Loser ? '#71717a' : '#d4d4d8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100px'
                  }}
                >
                  {p1Name}
                </span>
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '900', 
                fontFamily: 'monospace', 
                color: isP1Winner ? '#34d399' : isP1Loser ? '#71717a' : '#a1a1aa'
              }}>
                {match.status === 'completed' || match.player1_score !== 0 || match.player2_score !== 0 ? match.player1_score : '-'}
              </span>
            </SeedTeam>
            
            <div style={{ height: '1px', background: 'rgba(39, 39, 42, 0.8)' }} />
            
            {/* Player 2 */}
            <SeedTeam style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '0.75rem',
              opacity: isP2Loser ? 0.45 : 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', minWidth: 0, flex: 1 }}>
                {isP2Winner && <Crown size={11} className="text-amber-400 fill-amber-400/10 shrink-0" />}
                {isP2Loser && <X size={10} style={{ color: '#f87171', opacity: 0.6, flexShrink: 0 }} />}
                <span 
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isP2User ? '900' : '700',
                    color: isP2User ? '#FFC700' : isP2Winner ? '#ffffff' : isP2Loser ? '#71717a' : '#d4d4d8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100px'
                  }}
                >
                  {p2Name}
                </span>
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '900', 
                fontFamily: 'monospace', 
                color: isP2Winner ? '#34d399' : isP2Loser ? '#71717a' : '#a1a1aa'
              }}>
                {match.status === 'completed' || match.player2_score !== 0 || match.player1_score !== 0 ? match.player2_score : '-'}
              </span>
            </SeedTeam>
            
            {showPlayButton && (
              <button
                onClick={() => handlePlayMatch(match.id)}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  borderRadius: '0.75rem',
                  background: '#FFC700',
                  color: '#000000',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  padding: '0.6rem 0',
                  cursor: 'pointer',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem'
                }}
              >
                <Swords size={12} />
                {match.status === 'active' ? 'Join Match' : 'Play Match'}
              </button>
            )}

            {showSpectateButton && (
              <button
                onClick={() => {
                  navigate(`/game/${match.match_id}`);
                  onClose();
                }}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  borderRadius: '0.75rem',
                  background: '#27272a',
                  color: '#d4d4d8',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  padding: '0.6rem 0',
                  cursor: 'pointer',
                  border: '1px solid #3f3f46',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem'
                }}
              >
                <Eye size={12} />
                Spectate
              </button>
            )}
          </div>
        </SeedItem>
      </Seed>
    );
  };

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
            {activeBracket.status === 'registering' ? 'Bracket Draft' : 'Live Tournament Brackets'}
          </div>
          <h2 className="text-2xl font-shrikhand uppercase tracking-widest text-primary mb-2">
            {activeBracket.name}
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl">
            {activeBracket.status === 'registering' 
              ? 'Registration is open. Brackets are draft and will lock once participants join.' 
              : tournament.gameType === 'tictactoe'
                ? 'Matches are Best of 3 (BO3) Series. Follow the live matches below.'
                : 'Matches are single-round matches. Follow the live matches below.'}
          </p>
        </div>

        {/* Tournament Bracket Tree Columns */}
        <div className="overflow-x-auto min-w-[700px] pb-6 scrollbar-hide flex items-center justify-center gap-6">
          <Bracket
            rounds={reactBracketRounds}
            renderSeedComponent={CustomSeedComponent}
            roundTitleComponent={(title: any) => (
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4 pl-1 text-center md:text-left">
                {title}
              </div>
            )}
          />
          
          {/* Champion Column */}
          <div className="flex flex-col justify-center items-center min-h-[400px] shrink-0">
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

        {/* Dynamic Prize Split */}
        <div className="mt-8 pt-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <Swords size={14} className="text-primary" />
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Tournament Prize Split</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {displayPrizes.map((prize) => (
              <div key={prize.pos} className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-center">
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{prize.pos}</div>
                <div className="mt-1.5 text-xs font-black text-primary">{formatMoney(prize.val)}</div>
                {prize.pct && <div className="text-[8px] font-bold text-zinc-600 mt-0.5">{prize.pct} Pool</div>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
