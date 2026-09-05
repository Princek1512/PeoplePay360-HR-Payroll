import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/formatters';
import { Calendar, Search } from 'lucide-react';

export const TimeOffAllocationsPage: React.FC = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/timeoff/allocations');
        setAllocations(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllocations();
  }, []);

  const filtered = allocations.filter((a) =>
    a.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.timeOffType?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="pb-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Time Off Allocations</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Allocated balance quotas per employee and type. Balances must be approved before usable.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter allocations by employee or type..."
          className="w-full bg-background border border-input rounded-md py-1.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading allocations...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">No allocations found.</div>
        ) : (
          filtered.map((a) => {
            const allocated = Number(a.allocatedAmount) || 1;
            const remaining = Number(a.remainingAmount) || 0;
            const taken = Number(a.takenAmount) || 0;
            const percentRemaining = Math.min(100, Math.max(0, (remaining / allocated) * 100));

            return (
              <div
                key={a.id}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-foreground">{a.employee?.name}</h3>
                    <span className="text-xs font-semibold text-primary">
                      {a.timeOffType?.name}
                    </span>
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center font-mono my-3">
                  <div className="p-2 rounded-md bg-secondary">
                    <span className="text-[10px] text-muted-foreground block uppercase">Allocated</span>
                    <span className="text-sm font-bold text-foreground">{allocated}</span>
                  </div>
                  <div className="p-2 rounded-md bg-secondary">
                    <span className="text-[10px] text-muted-foreground block uppercase">Taken</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{taken}</span>
                  </div>
                  <div className="p-2 rounded-md bg-secondary">
                    <span className="text-[10px] text-muted-foreground block uppercase">Remaining</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{remaining}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Balance Available</span>
                    <span className="font-mono font-semibold text-foreground">{percentRemaining.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    Valid: {formatDate(a.validFrom)} - {formatDate(a.validTo)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
