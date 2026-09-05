import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  CircleDollarSign,
  ArrowLeft,
  Play,
  CheckCircle2,
  Lock,
  Mail,
  AlertTriangle,
  ReceiptText,
  Building,
  User,
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
    return <div className="p-8 text-center text-slate-500">Loading payrun details...</div>;
  }

  if (!payrun) {
    return <div className="p-8 text-center text-rose-400">Payrun not found.</div>;
  }

  const isDraft = payrun.status === 'draft';
  const isComputed = payrun.status === 'computed';
  const isValidated = payrun.status === 'validated';
  const isPaid = payrun.status === 'paid';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/payruns')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payrun Archive</span>
        </button>

        <StatusBadge status={payrun.status} size="md" />
      </div>

      {/* Header Info Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{payrun.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
            <span>Structure: <strong className="text-brand-400">{payrun.salaryStructure?.name}</strong></span>
            <span>Period: <strong>{formatDate(payrun.periodStart)}</strong> to <strong>{formatDate(payrun.periodEnd)}</strong></span>
            <span>Total Records: <strong>{payrun.totalEmployees}</strong></span>
          </div>
        </div>

        {/* Linear Action Bar (§8 & §9: Compute -> Validate -> Mark Paid -> Send Payslips) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {can('payruns', 'update') && (
            <>
              {/* Compute button */}
              <button
                onClick={handleCompute}
                disabled={actionLoading || isPaid}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  isDraft
                    ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                } disabled:opacity-50`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Compute</span>
              </button>

              {/* Validate button */}
              <button
                onClick={handleValidate}
                disabled={actionLoading || (!isComputed && !isDraft) || isPaid || isValidated}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  isComputed
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                } disabled:opacity-50`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validate</span>
              </button>

              {/* Mark Paid button */}
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading || !isValidated || isPaid}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
                  isValidated
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                } disabled:opacity-50`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Mark Paid</span>
              </button>

              {/* Send Payslips button */}
              <button
                onClick={handleSendPayslips}
                disabled={actionLoading || (!isPaid && !isValidated)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
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
        <div className="p-3 rounded-xl bg-brand-950/40 border border-brand-800/40 text-brand-300 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-400 live-dot" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Blocking Warnings Banner */}
      {payrun.hasBlockingWarnings && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Blocking Warnings Detected</span>
          </div>
          <p className="text-xs text-amber-200/80 mb-3">
            The following issues will prevent this payrun from being validated or marked paid:
          </p>
          <ul className="space-y-1 text-xs font-mono list-disc list-inside text-amber-300">
            {payrun.blockingWarnings?.map((w: string, idx: number) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gross Earnings</span>
          <div className="text-xl font-bold text-white mt-1 font-mono">{formatCurrency(payrun.totalGross)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Net Take-Home</span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(payrun.totalNet)}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligible Employees</span>
          <div className="text-xl font-bold text-white mt-1 font-mono">{payrun.totalEmployees}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Run Status</span>
          <div className="mt-1">
            <StatusBadge status={payrun.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Included Employee Payslips
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {payrun.payslips?.length || 0} Slips
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {payrun.payslips?.map((slip: any) => (
                <tr
                  key={slip.id}
                  onClick={() => navigate(`/payslips/${slip.id}`)}
                  className="hover:bg-slate-850/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">
                    {slip.employee?.name}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {slip.employee?.department?.name || 'Staff'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {Number(slip.workedDays)} days
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-200">
                    {formatCurrency(slip.grossSalary)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(slip.netSalary)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={slip.status} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    {slip.hasWarning ? (
                      <span className="text-amber-400 text-[11px] font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[140px]">{slip.warningMessage}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-mono text-[11px]">Clear</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1">
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
