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
  ArrowLeft
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
  const [activeTab, setActiveTab] = useState<'contracts' | 'attendance' | 'timeoff' | 'payslips' | 'settings'>('contracts');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const [empRes, metricsRes] = await Promise.all([
        apiClient.get(`/employees/${id}`),
        apiClient.get(`/employees/${id}/smart-metrics`)
      ]);
      setEmployee(empRes.data.data);
      setMetrics(metricsRes.data.data);
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
              count={`${metrics.allocationsCount} Types`}
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

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Banking & Payout Credentials
              </h3>
              <div className="p-4 rounded-lg bg-secondary border border-border space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Bank Account:</span>
                  <span className="font-mono text-foreground">{employee.bankAccountNumber || 'Not Provided (Warning)'}</span>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Working Schedule & Hours
              </h3>
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
        )}

        {activeTab === 'attendance' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                Attendance Log for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View Global Attendance ➔
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total {metrics.attendanceCount} verified check-in sessions recorded.
            </p>
          </div>
        )}

        {activeTab === 'timeoff' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                Time Off Requests for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/timeoff')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View Time Off Requests ➔
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total {metrics.timeOffRequestsCount} leave requests submitted.
            </p>
          </div>
        )}

        {activeTab === 'payslips' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground">
                Payslips Archive for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/payslips')}
                className="text-xs text-primary hover:underline font-medium"
              >
                View All Payslips ➔
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total {metrics.payslipsCount} generated payslip statements on record.
            </p>
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
