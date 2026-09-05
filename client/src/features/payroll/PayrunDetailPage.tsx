import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  Mail,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

export const PayrunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = useAuth();

  const [payrun, setPayrun] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPayrun = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/payruns/${id}`);
      setPayrun(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrun();
  }, [id]);

  const handleCompute = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Running sequenced salary computation engine...');
      await apiClient.post(`/payruns/${id}/compute`);
      await fetchPayrun();
      setActionMessage('Payrun computed successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to compute payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Validating payroll rules and employee details...');
      await apiClient.post(`/payruns/${id}/validate`);
      await fetchPayrun();
      setActionMessage('Payrun validated successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Validation blocked: Please resolve blocking issues.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Locking payout transactions and updating balances...');
      await apiClient.post(`/payruns/${id}/mark-paid`);
      await fetchPayrun();
      setActionMessage('Payrun marked as Paid.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark payrun as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    try {
      setActionLoading(true);
      setActionMessage('Dispatching payslips via email to employees...');
      const res = await apiClient.post(`/payruns/${id}/send-payslips`);
      await fetchPayrun();
      alert(res.data.message || 'Payslips sent.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send payslips.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading payrun details...</div>;
  }

  if (!payrun) {
    return <div className="p-8 text-center text-destructive">Payrun not found.</div>;
  }

  const isDraft = payrun.status === 'draft';
  const isComputed = payrun.status === 'computed';
  const isValidated = payrun.status === 'validated';
  const isPaid = payrun.status === 'paid';

  return (
    <div className="space-y-6 font-sans">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/payruns')}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payrun Archive</span>
        </button>

        <StatusBadge status={payrun.status} size="md" />
      </div>

      {/* Header Info Banner */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">{payrun.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2 font-mono">
            <span>Structure: <strong className="text-primary">{payrun.salaryStructure?.name}</strong></span>
            <span>Period: <strong>{formatDate(payrun.periodStart)}</strong> to <strong>{formatDate(payrun.periodEnd)}</strong></span>
            <span>Total Records: <strong>{payrun.totalEmployees}</strong></span>
          </div>
        </div>

        {/* Linear Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {can('payruns', 'update') && (
            <>
              {/* Compute button */}
              <button
                onClick={handleCompute}
                disabled={actionLoading || isPaid}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-all shadow-sm ${
                  isDraft
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                } disabled:opacity-50`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Compute</span>
              </button>

              {/* Validate button */}
              <button
                onClick={handleValidate}
                disabled={actionLoading || (!isComputed && !isDraft) || isPaid || isValidated}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-all shadow-sm ${
                  isComputed
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                } disabled:opacity-50`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validate</span>
              </button>

              {/* Mark Paid button */}
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading || !isValidated || isPaid}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-all shadow-sm ${
                  isValidated
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                } disabled:opacity-50`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Mark Paid</span>
              </button>

              {/* Send Payslips button */}
              <button
                onClick={handleSendPayslips}
                disabled={actionLoading || (!isPaid && !isValidated)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border transition-colors disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Payslips</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Action progress readout */}
      {actionMessage && (
        <div className="p-3 rounded-lg bg-secondary border border-border text-foreground text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary live-dot" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Blocking Warnings Banner */}
      {payrun.hasBlockingWarnings && (
        <div className="p-5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Blocking Warnings Detected</span>
          </div>
          <p className="text-xs mb-3 text-muted-foreground">
            The following issues will prevent this payrun from being validated or marked paid:
          </p>
          <ul className="space-y-1 text-xs font-mono list-disc list-inside">
            {payrun.blockingWarnings?.map((w: string, idx: number) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Gross Earnings</span>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{formatCurrency(payrun.totalGross)}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Net Take-Home</span>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">{formatCurrency(payrun.totalNet)}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Eligible Employees</span>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{payrun.totalEmployees}</div>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Run Status</span>
          <div className="mt-1">
            <StatusBadge status={payrun.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
            Included Employee Payslips
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {payrun.payslips?.length || 0} Slips
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Worked Days</th>
                <th className="px-6 py-3.5">Gross Pay</th>
                <th className="px-6 py-3.5">Net Pay</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Warnings</th>
                <th className="px-6 py-3.5 text-right">View Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrun.payslips?.map((slip: any) => (
                <tr
                  key={slip.id}
                  onClick={() => navigate(`/payslips/${slip.id}`)}
                  className="hover:bg-secondary/60 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-foreground">
                    {slip.employee?.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {slip.employee?.department?.name || 'Staff'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Number(slip.workedDays)} days
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-foreground">
                    {formatCurrency(slip.grossSalary)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {formatCurrency(slip.netSalary)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={slip.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    {slip.hasWarning ? (
                      <span className="text-amber-600 dark:text-amber-400 text-[11px] font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[140px]">{slip.warningMessage}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Clear</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                      Payslip
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
