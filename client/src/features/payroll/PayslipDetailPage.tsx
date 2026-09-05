import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { PayslipPrintModal } from './PayslipPrintModal';
import {
  ArrowLeft,
  Printer,
  Clock,
  Award,
  Zap,
  Calendar
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
    return <div className="p-8 text-center text-muted-foreground">Loading payslip breakdown...</div>;
  }

  if (!payslip) {
    return <div className="p-8 text-center text-destructive">Payslip record not found.</div>;
  }

  let totalDeductions = 0;
  payslip.lines?.forEach((l: any) => {
    if (l.category === 'deduction') totalDeductions += Number(l.amount);
  });

  const targetHours = Number(payslip.targetHours || 160);
  const attendanceHours = Number(payslip.attendanceHours || 0);
  const regularHours = Number(payslip.regularHours || Math.min(attendanceHours, targetHours));
  const overtimeHours = Number(payslip.overtimeHours || Math.max(0, attendanceHours - targetHours));
  const overtimeAmount = Number(payslip.overtimeAmount || 0);
  const hourlyRate = targetHours > 0 ? Number(payslip.contract?.wagePerMonth || 0) / targetHours : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Back button & Print action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Payslip / PDF</span>
        </button>
      </div>

      {/* Main Statement Container */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-8 space-y-6">
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono">
                PeoplePay360 Salary Slip
              </span>
              <StatusBadge status={payslip.status} size="sm" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">
              {payslip.employee?.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {payslip.employee?.jobPosition?.title || 'Staff Associate'} — {payslip.employee?.department?.name || 'General'}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-muted-foreground space-y-1">
            <div>Payrun: <strong className="text-foreground">{payslip.payrun?.name}</strong></div>
            <div>Period: <strong>{formatDate(payslip.periodStart)}</strong> to <strong>{formatDate(payslip.periodEnd)}</strong></div>
            <div>Worked Days: <strong className="text-emerald-700 dark:text-emerald-400">{Number(payslip.workedDays)} days</strong></div>
          </div>
        </div>

        {/* Shift & Campus Attendance Audit */}
        <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Shift Schedule & Campus Attendance Audit
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold font-mono">
              Overtime Rate Policy: 0.8x Regular Rate
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-card/70 border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase font-mono">Scheduled Shift</span>
              <span className="font-bold font-mono text-foreground">{targetHours.toFixed(1)} hrs</span>
              <span className="text-[10px] text-muted-foreground block">({formatCurrency(hourlyRate)}/hr)</span>
            </div>

            <div className="p-2.5 rounded-lg bg-card/70 border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase font-mono">Campus Attended</span>
              <span className="font-bold font-mono text-foreground">{attendanceHours.toFixed(1)} hrs</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                {attendanceHours >= targetHours ? 'Full Shift Completed' : `${(targetHours - attendanceHours).toFixed(1)}h Under-time`}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-card/70 border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase font-mono">Regular Hours Paid</span>
              <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">{regularHours.toFixed(1)} hrs</span>
              <span className="text-[10px] text-muted-foreground block">Core Shift Hours</span>
            </div>

            <div className="p-2.5 rounded-lg bg-card/70 border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase font-mono">Overtime Hours</span>
              <span className="font-bold font-mono text-amber-700 dark:text-amber-400">+{overtimeHours.toFixed(1)} hrs</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">
                {overtimeHours > 0 ? formatCurrency(overtimeAmount) : 'No OT'}
              </span>
            </div>
          </div>
        </div>

        {/* Banking Snapshot */}
        <div className="p-4 rounded-lg bg-secondary border border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Bank Name</span>
            <span className="text-foreground font-semibold">{payslip.employee?.bankName || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Account #</span>
            <span className="text-foreground font-semibold">
              {payslip.employee?.bankAccountNumber ? `**** ${payslip.employee.bankAccountNumber.slice(-4)}` : 'Missing'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">IFSC / Routing</span>
            <span className="text-foreground font-semibold">{payslip.employee?.bankIfsc || '—'}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block">Contract Wage</span>
            <span className="text-foreground font-bold">{formatCurrency(payslip.contract?.wagePerMonth)}</span>
          </div>
        </div>

        {/* Rule-by-rule breakdown table */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 font-serif">
            Itemized Salary Rule Breakdown
          </div>
          <div className="rounded-lg border border-border overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                <tr>
                  <th className="px-5 py-3 w-16">Seq</th>
                  <th className="px-5 py-3 w-28">Code</th>
                  <th className="px-5 py-3">Component Description</th>
                  <th className="px-5 py-3 w-32">Category</th>
                  <th className="px-5 py-3 text-right">Computed Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {payslip.lines?.map((line: any) => {
                  const cat = line.category?.toLowerCase();
                  const isNegative = cat === 'deduction';

                  return (
                    <tr key={line.id || line.code} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3 text-muted-foreground font-mono">
                        {line.sequence}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-foreground">
                        {line.code}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {line.label}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`tag-${cat} text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase`}>
                          {line.category}
                        </span>
                      </td>
                      <td className={`px-5 py-3 text-right font-mono font-bold text-sm ${
                        cat === 'net'
                          ? 'text-primary font-black text-base'
                          : isNegative
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-foreground'
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
        <div className="ml-auto w-full sm:w-80 p-5 rounded-lg bg-secondary border border-border space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-muted-foreground">Total Gross Earnings:</span>
            <span className="font-mono font-bold text-foreground">{formatCurrency(payslip.grossSalary)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-muted-foreground">Total Deductions:</span>
            <span className="font-mono font-bold text-rose-700 dark:text-rose-400">-{formatCurrency(totalDeductions)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span className="font-serif text-foreground">Net Take-Home Pay:</span>
            <span className="font-mono text-primary font-black text-lg">{formatCurrency(payslip.netSalary)}</span>
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
