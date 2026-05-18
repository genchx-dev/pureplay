import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  balance: number;
}

export const Header = ({ isAuthenticated, balance }: HeaderProps) => {
  return (
    <header className="px-6 py-4 flex items-center justify-between bg-primary sticky top-0 z-40">
      <Link to="/" className="flex items-center group shrink-0">
        <span className="text-xl font-shrikhand text-black uppercase tracking-tighter">
          PUREPLAY
        </span>
      </Link>
      
      <div className="flex items-center gap-3">
         {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-black/90 rounded-full px-4 py-2 border border-black/20">
              <Wallet size={18} className="text-white" />
              <span className="font-semibold text-white">₦{balance.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-1.5 rounded-full border-2 border-black text-black hover:bg-black/10 transition-colors font-semibold text-sm">Login</Link>
              <Link to="/register" className="px-4 py-1.5 rounded-full bg-black text-primary font-semibold hover:bg-black/90 transition-all text-sm">Sign Up</Link>
            </div>
          )}
      </div>
    </header>
  );
};
