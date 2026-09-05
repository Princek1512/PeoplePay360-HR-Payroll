import React, { ReactNode } from 'react';

interface SmartButtonProps {
  label: string;
  count: number | string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  label,
  count,
  icon,
  onClick,
  active = false
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all duration-200 text-left ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card hover:bg-secondary border-border text-foreground hover:border-primary/40'
      }`}
    >
      <div className={`p-1.5 rounded-md border transition-colors ${
        active 
          ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground' 
          : 'bg-secondary border-border text-primary group-hover:text-foreground'
      }`}>
        {icon}
      </div>
      <div>
        <div className={`text-[10px] font-semibold uppercase tracking-wider ${
          active ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:text-foreground'
        }`}>
          {label}
        </div>
        <div className="text-sm font-bold font-mono">
          {count}
        </div>
      </div>
    </button>
  );
};
