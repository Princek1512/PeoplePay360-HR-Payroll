import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { SmartButton } from '../../components/shared/SmartButton';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { EmployeeModal } from './EmployeeModal';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  FileSignature,
  Clock,
  PlaneTakeoff,
  ReceiptText,
  Edit2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<any | null>(null);
  const [metrics, setMetrics] = useState<any>({
    contractsCount: 0,
    attendanceCount: 0,
    timeOffRequestsCount: 0,
    allocationsCount: 0,
    payslipsCount: 0
  });

  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [timeoffList, setTimeoffList] = useState<any[]>([]);
  const [allocationsList, setAllocationsList] = useState<any[]>([]);
  const [payslipsList, setPayslipsList] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'contracts' | 'attendance' | 'timeoff' | 'payslips' | 'settings'>('contracts');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const [empRes, metricsRes, attRes, toRes, allocRes, payRes] = await Promise.all([
        apiClient.get(`/employees/${id}`),
        apiClient.get(`/employees/${id}/smart-metrics`),
        apiClient.get('/attendance', { params: { employeeId: id } }),
        apiClient.get('/timeoff/requests', { params: { employeeId: id } }),
        apiClient.get('/timeoff/allocations', { params: { employeeId: id } }),
        apiClient.get('/payslips', { params: { employeeId: id } })
      ]);

      setEmployee(empRes.data.data);
      setMetrics(metricsRes.data.data);
      setAttendanceList(attRes.data.data || []);
      setTimeoffList(toRes.data.data || []);
      setAllocationsList(allocRes.data.data || []);
      setPayslipsList(payRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading employee dossier...</div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-destructive">Employee not found.</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Back link & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workforce Directory</span>
        </button>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground text-xs font-medium border border-border transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-xl bg-card border border-border shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <img
              src={employee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employee.name)}`}
              alt={employee.name}
              className="w-20 h-20 rounded-xl border border-border object-cover shadow-sm"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">{employee.name}</h1>
                <StatusBadge status={employee.status} size="sm" />
              </div>
              <p className="text-sm font-medium text-primary mt-0.5">
                {employee.jobPosition?.title || 'Staff Associate'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  {employee.department?.name || 'Unassigned'}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {employee.email}
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {employee.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Buttons Strip */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Central Hub — Deep-Linked Metrics
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <SmartButton
              label="Contracts"
              count={metrics.contractsCount}
              icon={<FileSignature className="w-4 h-4" />}
              active={activeTab === 'contracts'}
              onClick={() => setActiveTab('contracts')}
            />
            <SmartButton
              label="Attendance"
              count={metrics.attendanceCount}
              icon={<Clock className="w-4 h-4" />}
              active={activeTab === 'attendance'}
              onClick={() => setActiveTab('attendance')}
            />
            <SmartButton
              label="Time Off"
              count={metrics.timeOffRequestsCount}
              icon={<PlaneTakeoff className="w-4 h-4" />}
              active={activeTab === 'timeoff'}
              onClick={() => setActiveTab('timeoff')}
            />
            <SmartButton
              label="Allocations"
              count={`${allocationsList.length > 0 ? allocationsList.length : metrics.allocationsCount} Types`}
              icon={<Calendar className="w-4 h-4" />}
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
            <SmartButton
              label="Payslips"
              count={metrics.payslipsCount}
              icon={<ReceiptText className="w-4 h-4" />}
              active={activeTab === 'payslips'}
              onClick={() => setActiveTab('payslips')}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Tab Panel */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* CONTRACTS TAB */}
        {activeTab === 'contracts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                Employee Contract History
              </h3>
              <button
                onClick={() => navigate('/contracts')}
                className="text-xs text-primary hover:underline font-medium"
              >
                Open Contracts Module ➔
              </button>
            </div>

            {employee.contracts?.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No contracts on record for this employee.</p>
            ) : (
              <div className="space-y-3">
                {employee.contracts?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-lg border flex items-center justify-between text-xs ${
                      c.status === 'running'
                        ? 'bg-secondary border-primary/40 text-foreground'
                        : 'bg-card border-border text-muted-foreground'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Monthly Wage: {formatCurrency(c.wagePerMonth)}</span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <p className="text-muted-foreground mt-1 font-mono">
                        Valid: {formatDate(c.startDate)} to {c.endDate ? formatDate(c.endDate) : 'Indefinite'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">Salary Structure:</span>
                      <span className="font-semibold text-primary">{c.salaryStructure?.name || 'Default'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ALLOCATIONS & SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                Leave Allocations & Work Configuration for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/timeoff')}
                className="text-xs text-primary hover:underline font-medium"
              >
                Manage Allocations ➔
              </button>
            </div>

            {/* Leave Allocations Cards */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Allocated Leave Balances
              </h4>
              {allocationsList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">No leave allocations configured.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {allocationsList.map((alloc) => {
                    const total = Number(alloc.allocatedAmount ?? alloc.allocatedDays) || 0;
                    const used = Number(alloc.takenAmount ?? alloc.usedDays) || 0;
                    const rem = alloc.remainingAmount !== undefined ? Number(alloc.remainingAmount) : Math.max(0, total - used);
                    const pct = total > 0 ? Math.min(100, Math.max(0, (rem / total) * 100)) : 0;

                    return (
                      <div key={alloc.id} className="p-4 rounded-lg bg-secondary border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            {alloc.timeOffType?.name || 'Leave Type'}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {rem} Days Left
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                          <span>Used: {used} d</span>
                          <span>Allocated: {total} d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-border">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Banking & Payout Credentials
                </h4>
                <div className="p-4 rounded-lg bg-secondary border border-border space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Bank Account:</span>
                    <span className="font-mono text-foreground">{employee.bankAccountNumber || 'Not Provided'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span className="text-foreground">{employee.bankName || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Routing / IFSC:</span>
                    <span className="font-mono text-foreground">{employee.bankIfsc || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">PAN / Tax ID:</span>
                    <span className="font-mono text-foreground">{employee.panNumber || '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Working Schedule & Hours
                </h4>
                <div className="p-4 rounded-lg bg-secondary border border-border space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Assigned Schedule:</span>
                    <span className="font-semibold text-foreground">{employee.workingSchedule?.name || 'Standard 40h'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Weekly Target Hours:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {employee.workingSchedule?.totalWeeklyHours || 40.0} hrs / week
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE LOG TAB */}
        {activeTab === 'attendance' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                  Attendance Log for {employee.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total {attendanceList.length} verified check-in sessions recorded.
                </p>
              </div>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View Global Attendance ➔
              </button>
            </div>

            {attendanceList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">
                No attendance logs found for {employee.name}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Check-In</th>
                      <th className="px-4 py-3">Check-Out</th>
                      <th className="px-4 py-3">Worked Hours</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendanceList.map((att) => {
                      const checkIn = new Date(att.checkIn);
                      const checkOut = att.checkOut ? new Date(att.checkOut) : null;
                      return (
                        <tr key={att.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            {formatDate(checkIn)} {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {checkOut ? (
                              `${formatDate(checkOut)} ${checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            ) : (
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Active Session
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            {att.workedHours != null ? `${Number(att.workedHours).toFixed(1)} hrs` : 'In progress'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={att.status || 'normal'} size="sm" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TIME OFF REQUESTS TAB */}
        {activeTab === 'timeoff' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                  Time Off Requests for {employee.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total {timeoffList.length} leave requests submitted.
                </p>
              </div>
              <button
                onClick={() => navigate('/timeoff')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View Time Off Requests ➔
              </button>
            </div>

            {timeoffList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">
                No time off requests found for {employee.name}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Leave Type</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timeoffList.map((req) => (
                      <tr key={req.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">
                          {req.timeOffType?.name || 'Leave'}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {formatDate(req.startDate)} — {formatDate(req.endDate)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          {req.durationAmount} Days
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={req.reason}>
                          {req.reason || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PAYSLIPS TAB */}
        {activeTab === 'payslips' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                  Payslips Archive for {employee.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total {payslipsList.length} generated payslip statements on record.
                </p>
              </div>
              <button
                onClick={() => navigate('/payslips')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View All Payslips ➔
              </button>
            </div>

            {payslipsList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">
                No payslips found for {employee.name}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Payrun</th>
                      <th className="px-4 py-3">Pay Period</th>
                      <th className="px-4 py-3">Gross Salary</th>
                      <th className="px-4 py-3">Deductions</th>
                      <th className="px-4 py-3">Net Salary</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payslipsList.map((slip) => (
                      <tr key={slip.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">
                          {slip.payrun?.name || 'Monthly Payroll'}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {formatDate(slip.periodStart)} — {formatDate(slip.periodEnd)}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatCurrency(slip.grossSalary)}
                        </td>
                        <td className="px-4 py-3 font-mono text-rose-600 dark:text-rose-400">
                          -{formatCurrency(slip.totalDeductions)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(slip.netSalary)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/payslips/${slip.id}`)}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs"
                          >
                            <span>View Statement</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <EmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchEmployeeData}
        employeeToEdit={employee}
      />
    </div>
  );
};
