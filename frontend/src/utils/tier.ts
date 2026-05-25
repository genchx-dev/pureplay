export interface TierConfig {
  name: string;
  color: string;
  bg: string;
  border: string;
  minXp: number;
  maxXp: number;
  iconName: 'Trees' | 'Coins' | 'Award' | 'Shield' | 'Star' | 'Crown' | 'Gem' | 'Zap' | 'Cpu' | 'Flame';
}

export const TIERS: TierConfig[] = [
  { name: 'Wood', color: 'text-amber-800', bg: 'bg-amber-950/10', border: 'border-amber-900/30', minXp: 0, maxXp: 999, iconName: 'Trees' },
  { name: 'Copper', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', minXp: 1000, maxXp: 4999, iconName: 'Coins' },
  { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-900/20', border: 'border-amber-700/30', minXp: 5000, maxXp: 14999, iconName: 'Award' },
  { name: 'Iron', color: 'text-zinc-400', bg: 'bg-zinc-700/20', border: 'border-zinc-600/30', minXp: 15000, maxXp: 39999, iconName: 'Shield' },
  { name: 'Silver', color: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-400/20', minXp: 40000, maxXp: 89999, iconName: 'Star' },
  { name: 'Gold', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', minXp: 90000, maxXp: 179999, iconName: 'Crown' },
  { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', minXp: 180000, maxXp: 349999, iconName: 'Gem' },
  { name: 'Platinum', color: 'text-sky-300', bg: 'bg-sky-300/10', border: 'border-sky-300/30', minXp: 350000, maxXp: 599999, iconName: 'Zap' },
  { name: 'Titanium', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-400/20', minXp: 600000, maxXp: 999999, iconName: 'Cpu' },
  { name: 'Ruby', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', minXp: 1000000, maxXp: Infinity, iconName: 'Flame' },
];

export const getTierByXp = (xp: number): TierConfig => {
  return TIERS.find((t) => xp >= t.minXp && xp <= t.maxXp) || TIERS[0];
};

export const getNextTier = (currentName: string): TierConfig | null => {
  const currentIndex = TIERS.findIndex((t) => t.name.toLowerCase() === currentName.toLowerCase());
  if (currentIndex === -1 || currentIndex === TIERS.length - 1) return null;
  return TIERS[currentIndex + 1];
};
