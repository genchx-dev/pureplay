import { useState, useEffect, useRef } from 'react';
import { authApi } from '../../../services/api/auth.api';
import {
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Gamepad2,
  Trophy,
  Clock,
  TrendingUp,
  Swords,
  Minus,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useWallet } from '../../../hooks/useWallet';
import { useRankingStore } from '../../../store/ranking.store';
import { getTierByXp, getNextTier } from '../../../utils/tier';
import { getTierBadgeUrl } from '../dashboard/LeaderboardPage';

export const MePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isAuthenticated } = useAuth();
  const { transactions } = useWallet(isAuthenticated);
  const [activeTab, setActiveTab] = useState<'transactions' | 'games' | 'chess'>(
    (searchParams.get('tab') as any) || 'transactions'
  );
  const [showDevPanel, setShowDevPanel] = useState(false);

  const { matchHistory, fetchMatchHistory, addMatchResult, addSimulationXp, resetStats } = useRankingStore();
  const { checkAuth } = useAuth();

  // Sync activeTab on URL query parameters changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['transactions', 'games', 'chess'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const [saving, setSaving] = useState(false);
  const [pieceSet, setPieceSet] = useState('fantasy');
  const [gradStart, setGradStart] = useState('#ffffff');
  const [gradEnd, setGradEnd] = useState('#bfd3d7');
  const [stroke, setStroke] = useState('#000000');
  const [shadow, setShadow] = useState('#000000');
  const [preset, setPreset] = useState('obsidian');
  const embedRef = useRef<HTMLEmbedElement>(null);

  // Sync user customizations on load
  useEffect(() => {
    if (user?.chess_customizations) {
      setPieceSet(user.chess_customizations.pieceSet || 'fantasy');
      setGradStart(user.chess_customizations.gradStart || '#ffffff');
      setGradEnd(user.chess_customizations.gradEnd || '#bfd3d7');
      setStroke(user.chess_customizations.stroke || '#000000');
      setShadow(user.chess_customizations.shadow || '#000000');
    }
  }, [user]);

  // Update dynamic preview styling
  const updatePreview = () => {
    try {
      if (!embedRef.current) return;
      const doc = embedRef.current.getSVGDocument();
      if (!doc) return;
      const svg = doc.querySelector('svg');
      if (!svg) return;
      
      const stop0 = svg.querySelector('#fillGradient #stop0');
      const stop1 = svg.querySelector('#fillGradient #stop1');
      if (stop0) (stop0 as any).style.stopColor = gradStart;
      if (stop1) (stop1 as any).style.stopColor = gradEnd;
      
      const styleFill = svg.querySelector('#fill-color');
      const styleStroke = svg.querySelector('#stroke-color');
      if (styleFill) styleFill.textContent = `.fill-color { fill: ${gradStart}; }`;
      if (styleStroke) styleStroke.textContent = `.stroke-color { stroke: ${stroke}; }`;
      
      const shadowPath = svg.querySelector('#shadow');
      if (shadowPath) {
        (shadowPath as any).style.fill = shadow;
        (shadowPath as any).style.display = '';
      }
    } catch (err) {
      console.warn("SVG preview load warning:", err);
    }
  };

  useEffect(() => {
    updatePreview();
  }, [pieceSet, gradStart, gradEnd, stroke, shadow, activeTab]);

  const applyPreset = (p: string) => {
    setPreset(p);
    if (p === 'custom') return;
    const presets: Record<string, any> = {
      obsidian: { grad1: "#ffffff", grad2: "#bfd3d7", stroke: "#000000", shadow: "#101216" },
      gold: { grad1: "#ffffff", grad2: "#eceff1", stroke: "#37474f", shadow: "#252012" },
      cyberpunk: { grad1: "#e0f7fa", grad2: "#00e5ff", stroke: "#006064", shadow: "#003b3f" },
      ice: { grad1: "#e3f2fd", grad2: "#64b5f6", stroke: "#0d47a1", shadow: "#08285c" },
      emerald: { grad1: "#e8f5e9", grad2: "#81c784", stroke: "#1b5e20", shadow: "#0c3b12" }
    };
    const config = presets[p];
    if (config) {
      setGradStart(config.grad1);
      setGradEnd(config.grad2);
      setStroke(config.stroke);
      setShadow(config.shadow);
    }
  };

  const handleSaveStyles = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        chess_customizations: { pieceSet, gradStart, gradEnd, stroke, shadow }
      });
      await checkAuth();
      alert("Chess custom styles saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save customizations.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchMatchHistory(user.username);
    }
  }, [user?.username, fetchMatchHistory]);

  const wins = matchHistory.filter((game) => game.result === 'WIN').length;
  const losses = matchHistory.filter((game) => game.result === 'LOSS').length;
  const draws = matchHistory.filter((game) => game.result === 'DRAW').length;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const stats = [
    { label: 'Wins', value: wins, icon: Trophy, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Losses', value: losses, icon: Swords, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { label: 'Draws', value: draws, icon: Minus, color: 'text-zinc-400', bg: 'bg-zinc-800/50 border-zinc-700/30' },
    { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  ];

  const formatDate = (date?: string) => {
    if (!date) return 'Recent';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // XP & Tier progression variables
  const xp = user?.xp || 5000;
  const currentTier = getTierByXp(xp);
  const nextTier = getNextTier(currentTier.name);
  
  let progressPercent = 100;
  let xpRemaining = 0;
  
  if (nextTier) {
    const range = nextTier.minXp - currentTier.minXp;
    const progress = xp - currentTier.minXp;
    progressPercent = Math.max(0, Math.min(100, (progress / range) * 100));
    xpRemaining = nextTier.minXp - xp;
  }

  const badgeUrl = getTierBadgeUrl(currentTier.name);

  return (
    <div className="px-4 pb-24 pt-6 space-y-6 max-w-2xl mx-auto">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative flex items-start gap-4 mb-6">
          <div className="w-24 h-24 shrink-0 flex items-center justify-center relative">
            <img src={badgeUrl} alt={currentTier.name} className="w-24 h-24 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-xl mb-1 text-white truncate">{user?.username || 'Gamer'}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`inline-flex items-center gap-1.5 ${currentTier.bg} ${currentTier.color} text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tighter border ${currentTier.border}`}>
                <img src={badgeUrl} alt={currentTier.name} className="w-3.5 h-3.5 object-contain" />
                {currentTier.name} Tier
              </span>
              <span className="text-zinc-500 text-xs font-bold uppercase">#{user?.rank || 10} Rank</span>
              {user?.phone && (
                <span className="text-zinc-400 text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></span>
                  {user.phone}
                </span>
              )}
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <SettingsIcon className="text-zinc-400" size={20} />
          </button>
        </div>

        {/* Dynamic XP Progress Bar */}
        <div className="bg-black/40 rounded-2xl p-4 border border-zinc-800 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Progression</span>
            <span className={`text-xs font-mono font-black ${currentTier.color}`}>{xp.toLocaleString()} XP</span>
          </div>
          
          <div className="h-2.5 bg-zinc-950 rounded-full border border-zinc-900 overflow-hidden relative p-[1px]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${
                currentTier.name === 'Ruby' 
                  ? 'from-red-600 to-rose-500' 
                  : 'from-primary/80 to-primary'
              } transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">
              {currentTier.name} Tier
            </span>
            <span className="text-[10px] text-zinc-400 font-bold font-mono">
              {nextTier 
                ? `${xpRemaining.toLocaleString()} XP TO LEVEL UP` 
                : 'MAX TIER REACHED 👑'
              }
            </span>
          </div>
        </div>

      </div>

      {/* Wallet Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/wallet?action=deposit')}
          className="flex-1 bg-primary text-black font-bold py-3 rounded-xl text-sm shadow-lg shadow-primary/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Wallet size={16} />
          Deposit
        </button>
        <button
          onClick={() => navigate('/wallet?action=withdraw')}
          className="flex-1 border-2 border-primary text-primary font-bold py-3 rounded-xl text-sm transition-all active:scale-95"
        >
          Withdraw
        </button>
      </div>

      {/* Stats Section */}
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-3">Performance</div>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-3 text-center ${bg}`}>
              <Icon size={16} className={`mx-auto mb-1.5 ${color}`} />
              <div className={`text-lg font-black ${color}`}>{value}</div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs list (Transactions vs Game history) */}
      <div className="space-y-4">
        <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transactions' ? 'bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <History size={16} />
            <span>Transactions</span>
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'games' ? 'bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Gamepad2 size={16} />
            <span>Games</span>
          </button>
          <button
            onClick={() => setActiveTab('chess')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chess' ? 'bg-primary text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Trophy size={16} />
            <span>Game Styles</span>
          </button>
        </div>

        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          {activeTab === 'transactions' && (
            <div className="divide-y divide-zinc-800/50">
              {transactions.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-zinc-500">
                  No transactions yet.
                </div>
              )}
              {transactions.map((tx) => {
                const positive = tx.type === 'deposit' || tx.type === 'win' || tx.type === 'refund';
                const label = tx.description || tx.type.replace('-', ' ');

                return (
                  <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {positive ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-primary transition-colors capitalize">{label}</div>
                        <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Clock size={10} /> {formatDate(tx.createdAt || tx.date)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${positive ? 'text-green-500' : 'text-zinc-300'}`}>
                        {positive ? '+' : '-'}NGN {Math.abs(tx.amount).toLocaleString()}
                      </div>
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{tx.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'games' && (
            <div className="divide-y divide-zinc-800/50">
              {matchHistory.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-zinc-500">
                  No games played yet.
                </div>
              )}
              {matchHistory.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        game.result === 'WIN' ? 'bg-primary/10 text-primary' :
                        game.result === 'LOSS' ? 'bg-zinc-850 text-zinc-600' : 'bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                        vs {game.opponent}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <Clock size={10} /> {game.date} {game.time ? `at ${game.time}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${game.earnings > 0 ? 'text-primary' : game.earnings < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                      {game.earnings > 0 ? '+' : ''}NGN {game.earnings.toLocaleString()}
                    </div>
                    <div
                      className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                        game.result === 'WIN' ? 'text-primary' :
                        game.result === 'LOSS' ? 'text-red-500' : 'text-zinc-500'
                      }`}
                    >
                      {game.result}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'chess' && (
            <div className="p-5 space-y-5">
              <div className="flex gap-4 items-center bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800/40">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <embed
                    ref={embedRef}
                    src={`/chess-assets/${pieceSet}/k.svg`}
                    className="w-12 h-12 object-contain"
                    onLoad={updatePreview}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Interactive Piece Preview</h4>
                  <p className="text-[10px] text-zinc-500">Live preview of your styled white King.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">Art Set</label>
                  <select
                    value={pieceSet}
                    onChange={(e) => setPieceSet(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="fantasy">Fantasy (Set 1)</option>
                    <option value="celtic">Celtic (Set 2)</option>
                    <option value="spatial">Spatial (Set 3)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">Color Preset</label>
                  <select
                    value={preset}
                    onChange={(e) => applyPreset(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl py-2 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="obsidian">Obsidian & Silver</option>
                    <option value="gold">Royal Gold</option>
                    <option value="cyberpunk">Cyberpunk Neon</option>
                    <option value="ice">Ice Blue</option>
                    <option value="emerald">Jade Emerald</option>
                    <option value="custom">Custom...</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 block mb-1">Grad Start</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={gradStart}
                        onChange={(e) => { setGradStart(e.target.value); setPreset('custom'); }}
                        className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-zinc-400">{gradStart}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 block mb-1">Grad End</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={gradEnd}
                        onChange={(e) => { setGradEnd(e.target.value); setPreset('custom'); }}
                        className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-zinc-400">{gradEnd}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 block mb-1">Stroke</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={stroke}
                        onChange={(e) => { setStroke(e.target.value); setPreset('custom'); }}
                        className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-zinc-400">{stroke}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 block mb-1">Shadow</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={shadow}
                        onChange={(e) => { setShadow(e.target.value); setPreset('custom'); }}
                        className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-zinc-400">{shadow}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={saving}
                onClick={handleSaveStyles}
                className="w-full bg-primary hover:bg-primary/95 text-black font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Game Styles'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Developer Simulation Panel */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <button
          onClick={() => setShowDevPanel(!showDevPanel)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/40 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-primary" />
            <span>Developer Sandbox Panel</span>
          </div>
          {showDevPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showDevPanel && user?.username && (
          <div className="p-4 space-y-4 border-t border-zinc-900 bg-zinc-950/90">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Simulate match outcomes and add XP directly to test the dynamic 10-tier ranking boundaries.
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addSimulationXp(user.username, 100)}
                className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +100 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, 1000)}
                className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +1,000 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, 10000)}
                className="bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +10,000 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, 100000)}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                +100,000 XP
              </button>
              <button
                onClick={() => addSimulationXp(user.username, -500)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                -500 XP
              </button>
              <button
                onClick={() => resetStats(user.username)}
                className="bg-zinc-900 hover:bg-red-950 text-red-500 border border-zinc-800 hover:border-red-900 text-[10px] font-bold py-2 px-1.5 rounded-lg active:scale-95 transition-all"
              >
                Reset Stats
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
              <button
                onClick={() => addMatchResult(user.username, 'Tic Tac Toe', 'ShadowMaster', 'WIN', 500)}
                className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-[10px] font-bold py-2.5 rounded-lg active:scale-95 transition-all"
              >
                Simulate WIN (+50 XP)
              </button>
              <button
                onClick={() => addMatchResult(user.username, 'Tic Tac Toe', 'QuantumKing', 'LOSS', 500)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold py-2.5 rounded-lg active:scale-95 transition-all"
              >
                Simulate LOSS (+15 XP)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full bg-zinc-900/50 text-red-500 font-bold py-4 rounded-2xl border border-zinc-800/50 flex items-center justify-center gap-2 hover:bg-red-500/5 transition-all group"
      >
        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span>Logout Account</span>
      </button>
    </div>
  );
};

export default MePage;
