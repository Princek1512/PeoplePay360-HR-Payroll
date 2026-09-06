import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { RuleModal } from './RuleModal';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal, Plus, Edit2 } from 'lucide-react';

export const RuleListPage: React.FC = () => {
  const { can } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/salary-config/rules');
      setRules(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Salary Rules Engine</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Ordered computation rules executed sequentially. Later rules reference running subtotals of earlier rules.
          </p>
        </div>

        {can('salaryRules', 'create') && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Rule</span>
          </button>
        )}
      </div>

      {/* Rules Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5 w-16">Seq</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Rule Name</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Computation Method</th>
                <th className="px-6 py-3.5">Formula / Value</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    Loading rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No salary rules configured.
                  </td>
                </tr>
              ) : (
                rules.map((r) => {
                  const cat = r.category?.toLowerCase();

                  return (
                    <tr key={r.id} className="hover:bg-secondary/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-muted-foreground">
                        {r.sequence}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {r.code}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {r.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`tag-${cat} text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize text-muted-foreground font-mono">
                        {r.computationMethod}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-foreground">
                        {r.computationMethod === 'fixed' && `₹${Number(r.amount).toLocaleString()}`}
                        {r.computationMethod === 'percentage' && `${r.percentageOf}%`}
                        {r.computationMethod === 'formula' && <span className="text-primary font-semibold">{r.formula}</span>}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {can('salaryRules', 'update') && (
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRules}
        ruleToEdit={editingRule}
      />
    </div>
  );
};
