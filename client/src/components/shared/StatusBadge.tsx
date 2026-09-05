import React from 'react';

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();
  let styles = 'bg-slate-700/50 text-slate-300 border-slate-600/40';

  // Specific semantic color mapping
  if (['active', 'running', 'paid', 'approved', 'normal'].includes(normalized)) {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (['computed', 'done', 'submitted', 'pending'].includes(normalized)) {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (['validated', 'manager'].includes(normalized)) {
    styles = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  } else if (['draft', 'inactive'].includes(normalized)) {
    styles = 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  } else if (['expired', 'refused', 'exception', 'warning'].includes(normalized)) {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
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
