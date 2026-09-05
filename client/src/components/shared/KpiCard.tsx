import React, { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  variant?: 'brand' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'default';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default'
}) => {
  const variantStyles = {
    default: 'from-slate-900/90 to-slate-900/50 border-slate-800 text-slate-400',
    brand: 'from-blue-950/40 to-slate-900/60 border-blue-800/40 text-blue-400',
    emerald: 'from-emerald-950/40 to-slate-900/60 border-emerald-800/40 text-emerald-400',
    indigo: 'from-indigo-950/40 to-slate-900/60 border-indigo-800/40 text-indigo-400',
    amber: 'from-amber-950/40 to-slate-900/60 border-amber-800/40 text-amber-400',
    rose: 'from-rose-950/40 to-slate-900/60 border-rose-800/40 text-rose-400',
  };

  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-b border backdrop-blur-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-200">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
};
