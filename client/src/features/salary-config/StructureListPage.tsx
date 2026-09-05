import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal, Plus, Edit2, Layers, CheckCircle2 } from 'lucide-react';

export const StructureListPage: React.FC = () => {
  const { can } = useAuth();
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/salary-config/structures');
      setStructures(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Salary Structures</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard structures bundling sequenced rules for employee contracts and payroll runs.
          </p>
        </div>
      </div>

      {/* Grid of structures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-slate-500">Loading structures...</div>
        ) : (
          structures.map((s) => (
            <div
              key={s.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{s.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span>{s.rulesCount} Configured Rules</span>
                    <span>•</span>
                    <span className="text-brand-400">{s.employeesCount} Assigned Employees</span>
                  </div>
                </div>
                <StatusBadge status={s.isActive ? 'active' : 'inactive'} size="sm" />
              </div>

              {/* Ordered rules pills preview */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Execution Sequence Order
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {s.rules?.map((r: any) => (
                    <span
                      key={r.id}
                      className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                    >
                      <strong className="text-brand-400 mr-1">{r.sequence}:</strong>
                      {r.code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
