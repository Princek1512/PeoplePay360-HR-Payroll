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
  CreditCard,
  Briefcase,
  FileSignature,
  Clock,
  PlaneTakeoff,
  ReceiptText,
  Edit2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle
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
    return <div className="p-8 text-center text-slate-500">Loading employee dossier...</div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-rose-400">Employee not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back link & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workforce Directory</span>
        </button>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <img
              src={employee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employee.name)}`}
              alt={employee.name}
              className="w-20 h-20 rounded-2xl border-2 border-brand-500/40 object-cover shadow-xl"
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{employee.name}</h1>
                <StatusBadge status={employee.status} size="sm" />
              </div>
              <p className="text-sm font-semibold text-brand-400 mt-0.5">
                {employee.jobPosition?.title || 'Staff Associate'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  {employee.department?.name || 'Unassigned'}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {employee.email}
                </span>
                {employee.phone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {employee.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Buttons Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        {activeTab === 'contracts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Employee Contract History
              </h3>
              <button
                onClick={() => navigate('/contracts')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                Open Contracts Module ➔
              </button>
            </div>

            {employee.contracts?.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No contracts on record for this employee.</p>
            ) : (
              <div className="space-y-3">
                {employee.contracts?.map((c: any) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                      c.status === 'running'
                        ? 'bg-brand-950/20 border-brand-500/40 text-slate-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Monthly Wage: {formatCurrency(c.wagePerMonth)}</span>
                        <StatusBadge status={c.status} size="sm" />
                      </div>
                      <p className="text-slate-400 mt-1 font-mono">
                        Valid: {formatDate(c.startDate)} to {c.endDate ? formatDate(c.endDate) : 'Indefinite'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Salary Structure:</span>
                      <span className="font-semibold text-brand-400">{c.salaryStructure?.name || 'Default'}</span>
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Banking & Payout Credentials
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Bank Account:</span>
                  <span className="font-mono text-white">{employee.bankAccountNumber || 'Not Provided (Warning)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="text-white">{employee.bankName || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Routing / IFSC:</span>
                  <span className="font-mono text-white">{employee.bankIfsc || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">PAN / Tax ID:</span>
                  <span className="font-mono text-white">{employee.panNumber || '—'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Working Schedule & Hours
              </h3>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-500">Assigned Schedule:</span>
                  <span className="font-semibold text-white">{employee.workingSchedule?.name || 'Standard 40h'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Weekly Target Hours:</span>
                  <span className="font-mono text-emerald-400 font-bold">
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Attendance Log for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/attendance')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                View Global Attendance ➔
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Total {metrics.attendanceCount} verified check-in sessions recorded.
            </p>
          </div>
        )}

        {activeTab === 'timeoff' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Time Off Requests for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/timeoff')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                View Time Off Requests ➔
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Total {metrics.timeOffRequestsCount} leave requests submitted.
            </p>
          </div>
        )}

        {activeTab === 'payslips' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Payslips Archive for {employee.name}
              </h3>
              <button
                onClick={() => navigate('/payslips')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                View All Payslips ➔
              </button>
            </div>
            <p className="text-xs text-slate-400">
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
