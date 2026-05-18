import { type LucideIcon } from 'lucide-react';

interface GameSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
}

export const GameSection = ({ 
  title, 
  children 
}: Omit<GameSectionProps, 'icon'>) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 bg-gradient-to-b from-primary to-yellow-600 rounded-full" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {children}
      </div>
    </section>
  );
};
