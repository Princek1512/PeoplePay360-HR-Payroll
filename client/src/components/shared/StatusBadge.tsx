import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();
  let styles = 'bg-secondary text-secondary-foreground border-border';

  // Specific semantic color mapping
  if (['active', 'running', 'paid', 'approved', 'normal'].includes(normalized)) {
    styles = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
  } else if (['computed', 'done', 'submitted', 'pending'].includes(normalized)) {
    styles = 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
  } else if (['validated', 'manager'].includes(normalized)) {
    styles = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
  } else if (['draft', 'inactive'].includes(normalized)) {
    styles = 'bg-muted text-muted-foreground border-border';
  } else if (['expired', 'refused', 'exception', 'warning'].includes(normalized)) {
    styles = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${styles} tracking-wide uppercase font-mono`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};
