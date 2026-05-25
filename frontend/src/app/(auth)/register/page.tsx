import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { User, Mail, Lock, Eye, EyeOff, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const validateForm = () => {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
    if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) return 'Enter a valid phone number';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (!agreeToTerms) return 'You must agree to the terms and conditions';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('pendingPhoneNumber', phone.trim());
      await register({ username, email, password, phone: phone.trim() });
      navigate('/');
    } catch (err) {
      console.error('Registration failed', err);
      const errorData = err instanceof AxiosError ? err.response?.data : null;
      let errorMessage = 'Registration failed. Please try again.';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          // Handle DRF field errors (e.g., { "email": ["..."] })
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && Array.isArray(errorData[firstKey])) {
            errorMessage = `${firstKey}: ${errorData[firstKey][0]}`;
          } else if (firstKey && typeof errorData[firstKey] === 'string') {
            errorMessage = errorData[firstKey];
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <form onSubmit={handleSubmit} className="bg-card p-8 rounded-3xl w-full max-w-md border border-border shadow-2xl relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_0_15px_rgba(255,204,51,0.3)]"></div>
        
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-shrikhand text-primary mb-2 uppercase tracking-wider">PUREPLAY</h2>
          <p className="text-zinc-500 text-sm font-medium">Join the elite gaming community</p>
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
                placeholder="Pick a unique name"
                className="w-full p-4 pl-12 rounded-2xl bg-background border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-zinc-700 font-medium"
                onChange={(e) => setUsername(e.target.value)}
                value={username}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="w-full p-4 pl-12 rounded-2xl bg-background border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-zinc-700 font-medium"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="tel"
                required
                inputMode="tel"
                placeholder="+2348012345678"
                className="w-full p-4 pl-12 rounded-2xl bg-background border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-zinc-700 font-medium"
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="********"
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
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Confirm</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="********"
                  className="w-full p-4 pl-12 rounded-2xl bg-background border border-border text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-zinc-700 font-medium"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-1 pt-2">
            <input 
              type="checkbox" 
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-5 h-5 rounded-lg border-border bg-background text-primary focus:ring-primary/20 accent-primary cursor-pointer" 
            />
            <label htmlFor="terms" className="text-xs text-zinc-500 cursor-pointer select-none font-medium">
              I agree to the <span className="text-primary font-bold hover:underline">Terms of Service</span> and <span className="text-primary font-bold hover:underline">Privacy Policy</span>
            </label>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4.5 bg-primary text-black font-black rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/10 mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                <span>Creating Arena...</span>
              </div>
            ) : (
              <>
                <UserPlus size={18} strokeWidth={3} />
                <span>Create Account</span>
              </>
            )}
          </button>
          
          <p className="text-center text-sm text-zinc-500 mt-6 font-medium">
            Already a member? <Link to="/login" className="text-primary hover:underline font-black ml-1">Login</Link>
          </p>
        </div>
      </form>
    </div>
  );
};
