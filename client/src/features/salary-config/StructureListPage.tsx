import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { SlidersHorizontal } from 'lucide-react';

export const StructureListPage: React.FC = () => {
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchStructures();
  }, []);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Salary Structures</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ordered collections of salary computation rules bound to employee contracts.
          </p>
        </div>
      </div>

      {/* Grid of structures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">Loading structures...</div>
        ) : (
          structures.map((s) => (
            <div
              key={s.id}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground tracking-tight">{s.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                    <span>{s.rulesCount} Configured Rules</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">{s.employeesCount} Assigned Employees</span>
                  </div>
                </div>
                <StatusBadge status={s.isActive ? 'active' : 'inactive'} size="sm" />
              </div>

              {/* Ordered rules pills preview */}
              <div className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Execution Sequence Order
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {s.rules?.map((r: any) => (
                    <span
                      key={r.id}
                      className="px-2.5 py-1 rounded-md bg-card border border-border text-[11px] font-mono text-foreground shadow-xs"
                    >
                      <strong className="text-primary mr-1">{r.sequence}:</strong>
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
