import { type LucideIcon } from 'lucide-react';

interface GameSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
}

export const GameSection = ({ 
  title, 
  icon: Icon, 
  iconColor = "text-primary", 
  children 
}: GameSectionProps) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className={iconColor} />
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {children}
      </div>
    </section>
  );
};
