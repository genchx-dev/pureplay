import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useAuthStore } from '../../../store/auth.store';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login({ username, password });
      navigate('/');
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setAuth({
      id: 'demo-user',
      username: 'DemoPlayer',
      email: 'demo@pureplay.local',
      tier: 'Bronze',
      rank: 1000,
    }, 'demo-token');
    navigate('/game/demo?demo=1');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded-3xl w-full max-w-md border border-border shadow-2xl relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_0_15px_rgba(255,204,51,0.3)]"></div>
        
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-shrikhand text-primary mb-2 uppercase tracking-wider">PUREPLAY</h2>
          <p className="text-zinc-500 text-sm font-medium">Welcome back, Champion!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-2xl text-center font-bold flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-destructive rounded-full"></span>
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter your username"
                className="w-full p-4 pl-12 rounded-2xl bg-background border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-zinc-700 font-medium"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Password</label>
              <button type="button" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Forgot?</button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="w-full p-4 pl-12 pr-12 rounded-2xl bg-background border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-zinc-700 font-medium"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 bg-primary text-black font-black rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/10 mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={18} strokeWidth={3} />
                <span>Enter Arena</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-4 bg-zinc-900 text-primary font-black rounded-2xl border border-primary/30 hover:bg-primary/10 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
          >
            Use Demo Account
          </button>
          
          <p className="text-center text-sm text-zinc-500 mt-6 font-medium">
            New to the arena? <Link to="/register" className="text-primary hover:underline font-black ml-1">Join Now</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
