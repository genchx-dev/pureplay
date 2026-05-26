import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { LoginPage } from './app/(auth)/login/page';
import { RegisterPage } from './app/(auth)/register/page';
import { MatchmakingPage } from './app/(main)/matchmaking/page';
import HomePage from './app/(main)/dashboard/page';
import { useAuthStore } from './store/auth.store';
import { ChallengeOverlay } from './components/matchmaking/ChallengeOverlay';
import { useChallengeStore } from './store/challenge.store';

const GamePage = lazy(() => import('./app/(main)/game/page').then(module => ({ default: module.GamePage })));
const WalletPage = lazy(() => import('./app/(main)/wallet/page').then(module => ({ default: module.WalletPage })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
};

export function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const fetchIncoming = useChallengeStore(state => state.fetchIncoming);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchIncoming();
    }, 4000);

    fetchIncoming();

    return () => clearInterval(interval);
  }, [fetchIncoming, isAuthenticated]);

  return (
    <Router>
      <ChallengeOverlay />
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/matchmaking" element={
            <ProtectedRoute>
                <MatchmakingPage />
            </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="text-primary p-8">Loading Wallet...</div>}>
              <WalletPage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/game" element={<Navigate to="/matchmaking" />} />
        <Route path="/game/:matchId" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="text-primary p-8">Loading Game...</div>}>
              <GamePage />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/" element={<HomePage />} />
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
