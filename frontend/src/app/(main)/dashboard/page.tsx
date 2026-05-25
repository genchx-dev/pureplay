import { useState, useEffect } from 'react';
import { 
  Home, 
  Swords, 
  Trophy, 
  TrendingUp, 
  User
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { useTournaments } from '../../../hooks/useTournaments';
import { ChallengeOverlay } from '../../../components/matchmaking/ChallengeOverlay';
import { useChallengeStore } from '../../../store/challenge.store';

// Import modular components
import { Header } from '../../../components/layout/Header';
import { Sidebar } from '../../../components/layout/Sidebar';
import { GameCard } from '../../../components/game/GameCard';
import { TournamentHero } from '../../../components/tournament/TournamentHero';
import { GameSection } from '../../../components/shared/GameSection';
import { comingSoonGames, playableGames, ticTacToeGame } from '../../../data/games';

// Import sub-pages
import { ChallengePage } from './ChallengePage';
import { TournamentPage } from '../tournaments/page';
import { LeaderboardPage } from './LeaderboardPage';
import { MePage } from '../settings/page';

const prizeBreakdown = (totalPrize: number) => {
  const shares = [0.5, 0.25, 0.15, 0.07, 0.03];
  return shares.map((share, index) => ({
    rank: `${index + 1}${index === 0 ? 'ST' : index === 1 ? 'ND' : index === 2 ? 'RD' : 'TH'} PLACE`,
    prize: Math.round(totalPrize * share),
    color: index === 0 ? 'text-primary' : 'text-zinc-300',
    bg: index === 0 ? 'bg-primary/10' : 'bg-zinc-900',
  }));
};

const startsInLabel = (startTime?: string) => {
  if (!startTime) return 'Soon';
  const diffMs = new Date(startTime).getTime() - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return 'Live now';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  return `${hours}h ${minutes}m`;
};

const HomeContent = ({ isAuthenticated, onTournamentClick }: { isAuthenticated: boolean; onTournamentClick: () => void }) => {
  const { tournaments } = useTournaments(isAuthenticated);
  const featuredTournament = tournaments.find((tournament) =>
    ['registration_open', 'active', 'live', 'upcoming'].includes(tournament.status),
  );
  const fallbackTournament = {
    name: 'Ultimate Tic Tac Toe Cup',
    description: 'Enter the headline weekend bracket, climb the table, and fight for a live top-5 prize pool.',
    startTime: undefined,
    entryFee: 500,
    participants: 128,
    maxParticipants: 256,
    prizePool: 50000,
  };
  const tournament = featuredTournament || fallbackTournament;
  const prizes = prizeBreakdown(tournament.prizePool);

  return (
    <div className="px-4 pb-24 space-y-6 md:px-6">
      <div className="pt-6">
        <TournamentHero 
          title={tournament.name}
          description={tournament.description || fallbackTournament.description}
          startsIn={startsInLabel(tournament.startTime)}
          entryFee={tournament.entryFee}
          joinedUsers={tournament.participants}
          maxParticipants={tournament.maxParticipants}
          totalPrize={tournament.prizePool}
          prizes={prizes}
          gameImage={ticTacToeGame.image}
          onEnter={onTournamentClick}
        />
      </div>

      <GameSection title="Hot Game">
        {playableGames.map((game) => (
          <GameCard key={game.id} image={game.image} label={game.label} to={game.route} />
        ))}
      </GameSection>

      <GameSection title="Coming Soon">
        {comingSoonGames.map((game) => (
          <GameCard key={game.id} image={game.image} disabled label={game.label} />
        ))}
      </GameSection>
    </div>
  );
};

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const { balance = 0 } = useWallet(isAuthenticated);

  const fetchIncoming = useChallengeStore((state) => state.fetchIncoming);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Poll for incoming invites every 4 seconds
    const interval = setInterval(() => {
      fetchIncoming();
    }, 4000);

    // Initial check
    fetchIncoming();

    return () => clearInterval(interval);
  }, [fetchIncoming, isAuthenticated]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'challenge', icon: Swords, label: 'Challenge' },
    { id: 'tournament', icon: Trophy, label: 'Tournament' },
    { id: 'leaderboard', icon: TrendingUp, label: 'Leaderboard' },
    { id: 'me', icon: User, label: 'Me' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeContent isAuthenticated={isAuthenticated} onTournamentClick={() => setActiveTab('tournament')} />;
      case 'challenge': return <ChallengePage />;
      case 'tournament': return <TournamentPage />;
      case 'leaderboard': return <LeaderboardPage onChallenge={() => setActiveTab('challenge')} />;
      case 'me': return <MePage />;
      default: return <HomeContent isAuthenticated={isAuthenticated} onTournamentClick={() => setActiveTab('tournament')} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row relative overflow-hidden font-sans">
      <ChallengeOverlay />
      <Sidebar 
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isAuthenticated={isAuthenticated}
        balance={balance}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative bg-black">
        <Header isAuthenticated={isAuthenticated} balance={balance} onLogoClick={() => setActiveTab('home')} />

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto w-full scrollbar-hide pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto w-full">
            {renderContent()}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 z-40">
          <div className="flex items-center justify-around px-4 py-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-primary' : 'text-zinc-500'}`}
              >
                <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default HomePage;
