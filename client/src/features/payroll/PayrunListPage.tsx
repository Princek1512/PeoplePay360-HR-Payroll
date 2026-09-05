import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PayrunWizardModal } from './PayrunWizardModal';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';

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

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Payrun Management</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            2-step execution pipeline turning contract wage rules and daily attendance into validated, printable payslips.
          </p>
        </div>

        {can('payruns', 'create') && (
          <button
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Payrun Wizard</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
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
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    Loading pay runs...
                  </td>
                </tr>
              ) : payruns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No pay runs created yet. Click "Launch Payrun Wizard" above to start.
                  </td>
                </tr>
              ) : (
                payruns.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/payruns/${pr.id}`)}
                    className="hover:bg-secondary/60 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      {pr.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {pr.salaryStructure?.name || 'Default'}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {formatDate(pr.periodStart)} — {formatDate(pr.periodEnd)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {pr.totalEmployees}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(pr.totalNet)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={pr.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      {pr.hasBlockingWarnings ? (
                        <span className="text-amber-600 dark:text-amber-400 text-[11px] font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Blocking</span>
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Clear</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-primary hover:underline font-medium inline-flex items-center gap-1">
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
        onSuccess={fetchPayruns}
      />
    </div>
  );
};
