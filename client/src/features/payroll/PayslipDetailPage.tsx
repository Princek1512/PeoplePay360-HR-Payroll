import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PayslipPrintModal } from './PayslipPrintModal';
import {
  ReceiptText,
  ArrowLeft,
  Printer,
  Building,
  User,
  Calendar,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

export const PayslipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    const fetchSlip = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/payslips/${id}`);
        setPayslip(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlip();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading payslip breakdown...</div>;
  }

  if (!payslip) {
    return <div className="p-8 text-center text-rose-400">Payslip record not found.</div>;
  }

  let totalDeductions = 0;
  payslip.lines?.forEach((l: any) => {
    if (l.category === 'deduction') totalDeductions += Number(l.amount);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button & Print action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Payslip / PDF</span>
        </button>
      </div>

      {/* Main Statement Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-8 space-y-6">
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400 font-mono">
                PeoplePay360 Salary Slip
              </span>
              <StatusBadge status={payslip.status} size="sm" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {payslip.employee?.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {payslip.employee?.jobPosition?.title || 'Staff Associate'} — {payslip.employee?.department?.name || 'General'}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-400 space-y-1">
            <div>Payrun: <strong className="text-white">{payslip.payrun?.name}</strong></div>
            <div>Period: <strong>{formatDate(payslip.periodStart)}</strong> to <strong>{formatDate(payslip.periodEnd)}</strong></div>
            <div>Worked Days: <strong className="text-emerald-400">{Number(payslip.workedDays)} days</strong></div>
          </div>
        </div>

        {/* Banking Snapshot */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Bank Name</span>
            <span className="text-slate-200">{payslip.employee?.bankName || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Account #</span>
            <span className="text-slate-200">
              {payslip.employee?.bankAccountNumber ? `**** ${payslip.employee.bankAccountNumber.slice(-4)}` : 'Missing'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">IFSC / Routing</span>
            <span className="text-slate-200">{payslip.employee?.bankIfsc || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Contract Wage</span>
            <span className="text-white font-bold">{formatCurrency(payslip.contract?.wagePerMonth)}</span>
          </div>
        </div>

        {/* Rule-by-rule breakdown table */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Itemized Salary Rule Breakdown
          </div>
          <div className="rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3 w-16">Seq</th>
                  <th className="px-5 py-3 w-28">Code</th>
                  <th className="px-5 py-3">Component Description</th>
                  <th className="px-5 py-3 w-32">Category</th>
                  <th className="px-5 py-3 text-right">Computed Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {payslip.lines?.map((line: any) => {
                  const cat = line.category?.toLowerCase();
                  const isNegative = cat === 'deduction';

                  return (
                    <tr key={line.id || line.code} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-5 py-3 text-slate-500 font-mono">
                        {line.sequence}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-white">
                        {line.code}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-200">
                        {line.label}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`tag-${cat} text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase`}>
                          {line.category}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-mono font-bold text-sm ${
                        cat === 'net'
                          ? 'text-emerald-400 font-extrabold text-base'
                          : isNegative
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}>
                        {isNegative ? `-${formatCurrency(line.amount)}` : formatCurrency(line.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary Box */}
        <div className="ml-auto w-full sm:w-80 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Total Gross Earnings:</span>
            <span className="font-mono font-bold text-white">{formatCurrency(payslip.grossSalary)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Total Deductions:</span>
            <span className="font-mono font-bold text-rose-400">-{formatCurrency(totalDeductions)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-black">
            <span className="text-white">Net Take-Home Pay:</span>
            <span className="font-mono text-emerald-400">{formatCurrency(payslip.netSalary)}</span>
          </div>
        </div>
      </div>

      <PayslipPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        payslipId={payslip.id}
      />
    </div>
  );
};
