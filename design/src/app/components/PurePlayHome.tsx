import { useState } from 'react';
import { Home, Swords, Trophy, TrendingUp, User, Wallet } from 'lucide-react';
import ChallengePage from './ChallengePage';
import TournamentPage from './TournamentPage';
import LeaderboardPage from './LeaderboardPage';
import MePage from './MePage';

interface GameCardProps {
  index: number;
}

function GameCard({ index }: GameCardProps) {
  return (
    <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center">
      <div className="w-12 h-12 bg-zinc-700/50 rounded-md" />
    </div>
  );
}

interface PurePlayHomeProps {
  isLoggedIn?: boolean;
}

export default function PurePlayHome({ isLoggedIn = false }: PurePlayHomeProps) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-[#D4AF37]">
        <div className="flex items-center gap-2">

          <span className="text-black" style={{ fontFamily: 'Shrikhand, cursive' }}>
            Pure Play
          </span>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-2 bg-black/90 rounded-full px-4 py-2 border border-black/20">
            <Wallet size={18} className="text-white" />
            <span className="font-semibold text-white">₦1,250</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 rounded-full border-2 border-black text-black hover:bg-black/10 transition-colors font-semibold">
              Login
            </button>
            <button className="px-4 py-1.5 rounded-full bg-black text-[#D4AF37] font-semibold hover:bg-black/90 transition-all">
              Sign Up
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="px-6 pb-24 space-y-6">
        {/* Main Tournament Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-5 border border-yellow-600/20 shadow-xl shadow-yellow-600/5">
          <div className="flex gap-4">
            {/* Left Side */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-xs text-zinc-400 mb-1">Countdown Timer</div>
                <div className="text-2xl font-bold text-yellow-400">02:45:30</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 mb-1">Participants No.</div>
                <div className="text-xl font-semibold text-white">128</div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex-1">
              <div className="text-xs text-zinc-400 mb-2">Pot Prize</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gradient-to-r from-yellow-600/20 to-transparent rounded-lg px-3 py-2 border border-yellow-600/30">
                  <span className="text-xs text-zinc-300">1st</span>
                  <span className="text-sm font-bold text-yellow-400">₦5,000</span>
                </div>
                <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2 border border-zinc-700">
                  <span className="text-xs text-zinc-400">2nd</span>
                  <span className="text-sm font-semibold text-zinc-300">₦2,000</span>
                </div>
                <div className="flex items-center justify-between bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700">
                  <span className="text-xs text-zinc-400">3rd</span>
                  <span className="text-sm font-semibold text-zinc-400">₦1,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hot Games Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full" />
            <h2 className="text-lg font-semibold text-white">Hot Game</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <GameCard key={`hot-${i}`} index={i} />
            ))}
          </div>
        </section>

        {/* Favorite Games Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full" />
            <h2 className="text-lg font-semibold text-white">Favorite Games</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <GameCard key={`fav-${i}`} index={i} />
            ))}
          </div>
        </section>
          </div>
        )}

        {activeTab === 'challenge' && <ChallengePage />}
        {activeTab === 'tournament' && <TournamentPage />}
        {activeTab === 'leaderboard' && <LeaderboardPage />}
        {activeTab === 'me' && <MePage />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800">
        <div className="flex items-center justify-around px-6 py-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-yellow-400' : 'text-zinc-500'
            }`}
          >
            <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('challenge')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'challenge' ? 'text-yellow-400' : 'text-zinc-500'
            }`}
          >
            <Swords size={24} strokeWidth={activeTab === 'challenge' ? 2.5 : 2} />
            <span className="text-xs">Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('tournament')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'tournament' ? 'text-yellow-400' : 'text-zinc-500'
            }`}
          >
            <Trophy size={24} strokeWidth={activeTab === 'tournament' ? 2.5 : 2} />
            <span className="text-xs">Tournament</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-zinc-500'
            }`}
          >
            <TrendingUp size={24} strokeWidth={activeTab === 'leaderboard' ? 2.5 : 2} />
            <span className="text-xs">Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('me')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'me' ? 'text-yellow-400' : 'text-zinc-500'
            }`}
          >
            <User size={24} strokeWidth={activeTab === 'me' ? 2.5 : 2} />
            <span className="text-xs">Me</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
