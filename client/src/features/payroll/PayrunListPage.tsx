import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PayrunWizardModal } from './PayrunWizardModal';
import { useAuth } from '../../context/AuthContext';
import { CircleDollarSign, Plus, ArrowUpRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const PayrunListPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = useAuth();

  const [payruns, setPayruns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/payruns');
      setPayruns(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  const handlePayrunCreated = (newId?: string) => {
    fetchPayruns();
    if (newId) {
      navigate(`/payruns/${newId}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Pay Runs & Computations</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            2-step execution pipeline turning contract wage rules and daily attendance into validated, printable payslips.
          </p>
        </div>

        {can('payruns', 'create') && (
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Payrun Wizard</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Pay Run Name</th>
                <th className="px-6 py-3.5">Salary Structure</th>
                <th className="px-6 py-3.5">Period Dates</th>
                <th className="px-6 py-3.5">Employees</th>
                <th className="px-6 py-3.5">Total Net Pay</th>
                <th className="px-6 py-3.5">Workflow Status</th>
                <th className="px-6 py-3.5">Warnings</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    Loading pay runs...
                  </td>
                </tr>
              ) : payruns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                    No pay runs created yet. Click "Launch Payrun Wizard" above to start.
                  </td>
                </tr>
              ) : (
                payruns.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/payruns/${pr.id}`)}
                    className="hover:bg-slate-850/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white text-sm">
                      {pr.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-400">
                      {pr.salaryStructureName}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {formatDate(pr.periodStart)} <span className="text-slate-500">➔</span> {formatDate(pr.periodEnd)}
                    </td>
                    <td className="px-6 py-4 font-mono text-white font-bold">
                      {pr.totalEmployees}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(pr.totalNet)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pr.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {pr.hasBlockingWarnings ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {pr.blockingCount} Warnings
                        </span>
                      ) : (
                        <span className="text-emerald-500 text-[11px] font-mono">Clean</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1">
                        Open <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PayrunWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handlePayrunCreated}
      />
    </div>
  );
};
