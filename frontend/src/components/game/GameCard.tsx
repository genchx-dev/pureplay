import { Gamepad2, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameCardProps {
  icon?: LucideIcon;
  color?: string;
  to?: string;
  disabled?: boolean;
  label?: string;
}

export const GameCard = ({ 
  icon: Icon = Gamepad2, 
  color = "text-primary", 
  to = "/matchmaking",
  disabled = false,
  label
}: GameCardProps) => {
  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-2 min-w-[70px]">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center justify-center opacity-40 cursor-not-allowed">
          {label ? <span className="text-[8px] text-center font-bold">{label}</span> : <Icon className={color} />}
        </div>
        {label && <span className="text-[10px] font-bold text-zinc-500 uppercase">{label}</span>}
      </div>
    );
  }

  return (
    <Link to={to} className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center hover:border-primary transition-colors flex-shrink-0">
      <Icon className={color} />
    </Link>
  );
};
