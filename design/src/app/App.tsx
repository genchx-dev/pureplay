import { useState } from 'react';
import PurePlayHome from './components/PurePlayHome';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="size-full bg-black overflow-auto">
      <div className="flex flex-col items-center gap-8 py-8">
        {/* Toggle Button for Demo */}
        <button
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className="px-6 py-2 bg-zinc-800 text-yellow-400 rounded-full border border-yellow-600/30 hover:bg-zinc-700 transition-colors"
        >
          {isLoggedIn ? 'Switch to Pre-Login View' : 'Switch to Logged-In View'}
        </button>

        {/* Logged-In View */}
        <div className="w-full">
          <h3 className="text-center text-yellow-400 mb-4 text-sm font-semibold">
            {isLoggedIn ? 'LOGGED-IN VIEW' : 'PRE-LOGIN VIEW'}
          </h3>
          <PurePlayHome isLoggedIn={isLoggedIn} />
        </div>
      </div>
    </div>
  );
}