import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/formatters';
import { Calendar, Layers, Search } from 'lucide-react';

export const TimeOffAllocationsPage: React.FC = () => {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchAllocations();
  }, []);

  const filtered = allocations.filter((a) =>
    a.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.timeOffType?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Time Off Allocations & Balances</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Allocated balance quotas per employee and type. Balances must be approved before usable.
        </p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter allocations by employee or type..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading allocations...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No allocations found.</div>
        ) : (
          filtered.map((a) => {
            const allocated = Number(a.allocatedAmount) || 1;
            const remaining = Number(a.remainingAmount) || 0;
            const taken = Number(a.takenAmount) || 0;
            const percentRemaining = Math.min(100, Math.max(0, (remaining / allocated) * 100));

            return (
              <div
                key={a.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{a.employee?.name}</h3>
                    <span className="text-xs font-semibold text-brand-400">
                      {a.timeOffType?.name}
                    </span>
                  </div>
                  <StatusBadge status={a.status} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center font-mono my-3">
                  <div className="p-2 rounded-xl bg-slate-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Allocated</span>
                    <span className="text-sm font-bold text-white">{allocated}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Taken</span>
                    <span className="text-sm font-bold text-amber-400">{taken}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950">
                    <span className="text-[10px] text-slate-400 block uppercase">Remaining</span>
                    <span className="text-sm font-bold text-emerald-400">{remaining}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Balance Available</span>
                    <span className="font-mono font-semibold text-slate-300">{percentRemaining.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentRemaining}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
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
