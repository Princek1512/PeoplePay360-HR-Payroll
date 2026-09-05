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
}) => {
  return (
    <div className="relative overflow-hidden p-5 rounded-xl bg-card text-card-foreground border border-border shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-secondary text-foreground border border-border">
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
};
