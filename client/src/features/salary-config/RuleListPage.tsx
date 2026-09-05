import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { RuleModal } from './RuleModal';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal, Plus, Edit2, Code, Calculator } from 'lucide-react';

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

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Salary Rules Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ordered computation rules executed sequentially. Later rules reference running subtotals of earlier rules.
          </p>
        </div>

        {can('salaryRules', 'create') && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Rule</span>
          </button>
        )}
      </div>

      {/* Rules Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Loading rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No salary rules configured.
                  </td>
                </tr>
              ) : (
                rules.map((r) => {
                  const cat = r.category?.toLowerCase();

                  return (
                    <tr key={r.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">
                        {r.sequence}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {r.code}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {r.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`tag-${cat} text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 capitalize font-mono text-slate-300">
                        {r.computationMethod}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-brand-400">
                        {r.computationMethod === 'fixed' && `$${Number(r.amount).toFixed(2)}`}
                        {r.computationMethod === 'percentage' && `${Number(r.amount)}% of ${r.percentageOf}`}
                        {r.computationMethod === 'formula' && r.formula}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {can('salaryRules', 'update') && (
                          <button
                            onClick={() => handleEdit(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
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
