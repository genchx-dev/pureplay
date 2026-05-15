// src/components/wallet/StakeModal.tsx
import { useState } from 'react';
import { DollarSign, X } from 'lucide-react';

interface StakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export const StakeModal = ({ isOpen, onClose, onConfirm }: StakeModalProps) => {
  const [amount, setAmount] = useState(10);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-gray-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gold">Place Your Stake</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="bg-bg p-4 rounded-xl border border-gray-700 mb-6 flex items-center justify-between">
          <span className="text-gray-400">Amount</span>
          <div className="flex items-center gap-2 text-xl font-bold text-offwhite">
            <DollarSign size={20} className="text-gold" />
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bg-transparent w-20 outline-none text-right"
            />
          </div>
        </div>

        <button 
          onClick={() => onConfirm(amount)}
          className="w-full py-3 bg-gold text-bg font-bold rounded-lg hover:bg-gold-dark transition-all"
        >
          Lock Stake & Play
        </button>
      </div>
    </div>
  );
};
