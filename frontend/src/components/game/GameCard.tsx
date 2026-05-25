import { Gamepad2, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GameCardProps {
  icon?: LucideIcon;
  image?: string;
  color?: string;
  to?: string;
  disabled?: boolean;
  label?: string;
}

export const GameCard = ({ 
  icon: Icon = Gamepad2, 
  image,
  color = "text-primary", 
  to = "/matchmaking",
  disabled = false,
  label
}: GameCardProps) => {
  const content = (
    <div className={`w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 overflow-hidden group ${disabled ? 'border-zinc-800 border-dashed cursor-not-allowed' : 'border-zinc-700 hover:border-primary cursor-pointer'}`}>
      {image ? (
        <img src={image} alt={label || "Game"} className={`h-full w-full object-contain p-2 transition-transform duration-300 ${!disabled && 'group-hover:scale-110'}`} />
      ) : (
        <Icon className={color} />
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {disabled ? content : <Link to={to}>{content}</Link>}
      {label && (
        <span className={`text-[10px] font-bold uppercase tracking-tight text-center ${disabled ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {label}
        </span>
      )}
    </div>
  );
};
