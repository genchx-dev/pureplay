import { useState } from 'react';
import { 
  Home, 
  Swords, 
  Trophy, 
  TrendingUp, 
  User
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';

// Import modular components
import { Header } from '../../../components/layout/Header';
import { Sidebar } from '../../../components/layout/Sidebar';
import { GameCard } from '../../../components/game/GameCard';
import { TournamentHero } from '../../../components/tournament/TournamentHero';
import { GameSection } from '../../../components/shared/GameSection';

// Import sub-pages
import { ChallengePage } from './ChallengePage';
import { TournamentPage } from '../tournaments/page';
import { LeaderboardPage } from './LeaderboardPage';
import { MePage } from '../settings/page';

// Import game assets
import tictactoeLogo from '../../../assets/games/tic-tac-toe 2.svg';
import basketballLogo from '../../../assets/games/basketball.svg';
import snookerLogo from '../../../assets/games/snooker.svg';
import reversiLogo from '../../../assets/games/reversi.svg';
import archeryLogo from '../../../assets/games/archery.svg';
import chessLogo from '../../../assets/games/chess.svg';

const HomeContent = () => {
  const prizes = [
    { rank: '1ST PLACE', prize: 25000, color: 'text-primary', bg: 'bg-primary/10' },
    { rank: '2ND PLACE', prize: 12500, color: 'text-zinc-300', bg: 'bg-zinc-800/50' },
    { rank: '3RD PLACE', prize: 7500, color: 'text-amber-700', bg: 'bg-amber-900/10' },
  ];

  return (
    <div className="px-6 pb-24 space-y-6">
      <div className="pt-6">
        <TournamentHero 
          title="ULTIMATE TIC-TAC-TOE"
          description="Join the ranks of elite players and win massive prizes."
          startsIn="02:45:30"
          entryFee={500}
          joinedUsers={128}
          totalPrize={50000}
          prizes={prizes}
          onEnter={() => console.log('Entering Arena')}
        />
      </div>

      <GameSection title="Hot Game">
        <GameCard image={tictactoeLogo} label="Tic Tac Toe" to="/matchmaking" />
      </GameSection>

      <GameSection title="Coming Soon">
        <GameCard image={basketballLogo} disabled label="Basketball" />
        <GameCard image={snookerLogo} disabled label="Snooker" />
        <GameCard image={reversiLogo} disabled label="Reversi" />
        <GameCard image={archeryLogo} disabled label="Archery" />
        <GameCard image={chessLogo} disabled label="Chess" />
      </GameSection>
    </div>
  );
};

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isAuthenticated } = useAuth();
  const { balance = 0 } = useWallet(isAuthenticated);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'challenge', icon: Swords, label: 'Challenge' },
    { id: 'tournament', icon: Trophy, label: 'Tournament' },
    { id: 'leaderboard', icon: TrendingUp, label: 'Leaderboard' },
    { id: 'me', icon: User, label: 'Me' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeContent />;
      case 'challenge': return <ChallengePage />;
      case 'tournament': return <TournamentPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'me': return <MePage />;
      default: return <HomeContent />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row relative overflow-hidden font-sans">
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
        <Header isAuthenticated={isAuthenticated} balance={balance} />

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
