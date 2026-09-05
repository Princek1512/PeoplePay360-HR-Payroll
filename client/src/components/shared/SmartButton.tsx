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
      className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-left ${
        active
          ? 'bg-brand-600/20 border-brand-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
          : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
      }`}
    >
      <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-slate-700 border border-slate-700 text-brand-400 group-hover:text-brand-300 transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300">
          {label}
        </div>
        <div className="text-sm font-bold text-white font-mono">
          {count}
        </div>
      </div>
    </button>
  );
};
