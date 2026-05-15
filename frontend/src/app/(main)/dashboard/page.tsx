import { useState } from 'react';
import { 
  Home, 
  Swords, 
  Trophy, 
  TrendingUp, 
  User, 
  Heart,
  Wallet
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
import { WalletPage } from '../wallet/page';

const HomeContent = () => {
  const prizes = [
    { rank: '1ST PLACE', prize: 25000, color: 'text-primary', bg: 'bg-primary/10' },
    { rank: '2ND PLACE', prize: 12500, color: 'text-zinc-300', bg: 'bg-zinc-800/50' },
    { rank: '3RD PLACE', prize: 7500, color: 'text-amber-700', bg: 'bg-amber-900/10' },
  ];

  return (
    <div className="px-6 py-6 space-y-10 max-w-6xl mx-auto pb-20">
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

      <GameSection title="Your Favorites" icon={Heart} iconColor="text-red-500">
        <GameCard />
        <div className="w-20 h-20 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed flex items-center justify-center opacity-40">
           <span className="text-[10px] text-center font-bold text-zinc-600 uppercase">Add More</span>
        </div>
      </GameSection>

      <GameSection title="Hot Games" icon={Trophy}>
        <GameCard />
        {[1,2,3].map(i => (
          <GameCard key={i} disabled label="COMING SOON" />
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

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeContent />;
      case 'challenge': return <ChallengePage />;
      case 'tournament': return <TournamentPage />;
      case 'wallet': return <WalletPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'me': return <MePage />;
      default: return <HomeContent />;
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'challenge', icon: Swords, label: 'Challenge' },
    { id: 'tournament', icon: Trophy, label: 'Tournament' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'leaderboard', icon: TrendingUp, label: 'Leaderboard' },
    { id: 'me', icon: User, label: 'Me' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative overflow-hidden font-sans">
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
      <div className="flex-1 flex flex-col min-h-screen">
        <Header isAuthenticated={isAuthenticated} balance={balance} />

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto w-full">
          {renderContent()}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden sticky bottom-0 bg-black/95 backdrop-blur-lg border-t border-zinc-800 z-40">
          <div className="flex items-center justify-around px-6 py-3">
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
