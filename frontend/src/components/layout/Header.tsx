import { Link } from 'react-router-dom';
import { Search, Bell, Wallet } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  balance: number;
}

export const Header = ({ isAuthenticated, balance }: HeaderProps) => {
  return (
    <header className="px-4 md:px-8 py-4 flex items-center gap-6 bg-background border-b border-border sticky top-0 z-40">
      <Link to="/" className="flex items-center group shrink-0">
        <span className="text-2xl font-shrikhand text-primary uppercase tracking-tighter">
          PUREPLAY
        </span>
      </Link>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-xl relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Search games, players, or tournaments..." 
          className="w-full bg-card border border-border rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
        />
      </div>

      <div className="flex items-center gap-3">
         <button className="p-2 text-zinc-400 hover:text-primary transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
         </button>
         
         {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2 bg-card rounded-full px-4 py-1.5 border border-border">
              <Wallet size={16} className="text-primary" />
              <span className="text-sm font-black font-mono">₦{balance.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block text-sm font-black hover:text-primary px-2">Login</Link>
              <Link to="/register" className="bg-primary text-black text-sm font-black px-4 py-2 rounded-full shadow-lg shadow-primary/10">Join Now</Link>
            </div>
          )}
      </div>
    </header>
  );
};
