import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { encryptPassword } from '../../lib/crypto';
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
  ExternalLink,
  Lock,
  Shield,
  Camera,
  Check,
  AlertCircle,
  MapPin,
  CreditCard,
  Briefcase,
  Heart,
  Upload,
  X,
  Key
} from 'lucide-react';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

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

  // Tabs: 'work' | 'private' | 'security' | 'contracts' | 'attendance' | 'timeoff' | 'payslips'
  const [activeTab, setActiveTab] = useState<'work' | 'private' | 'security' | 'contracts' | 'attendance' | 'timeoff' | 'payslips'>('work');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [avatarUpdating, setAvatarUpdating] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isCurrentUserProfile = user?.employeeId === id || user?.employee?.id === id || (!id && user?.employeeId);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const targetId = id || user?.employeeId || user?.employee?.id;
      if (!targetId) {
        setLoading(false);
        return;
      }

      const [empRes, metricsRes, attRes, toRes, allocRes, payRes] = await Promise.all([
        apiClient.get(`/employees/${targetId}`),
        apiClient.get(`/employees/${targetId}/smart-metrics`),
        apiClient.get('/attendance', { params: { employeeId: targetId } }),
        apiClient.get('/timeoff/requests', { params: { employeeId: targetId } }),
        apiClient.get('/timeoff/allocations', { params: { employeeId: targetId } }),
        apiClient.get('/payslips', { params: { employeeId: targetId } })
      ]);

      setEmployee(empRes.data.data);
      setMetrics(metricsRes.data.data);
      setAttendanceList(attRes.data.data || []);
      setTimeoffList(toRes.data.data || []);
      setAllocationsList(allocRes.data.data || []);
      setPayslipsList(payRes.data.data || []);

      if (empRes.data.data?.avatarUrl) {
        setAvatarUrlInput(empRes.data.data.avatarUrl);
      }
    } catch (err) {
      console.error('Error fetching employee dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id, user?.employeeId]);

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      setAvatarUpdating(true);
      setAvatarMessage(null);

      await apiClient.patch(`/employees/${employee.id}`, {
        avatarUrl: avatarUrlInput.trim() || null
      });

      await fetchEmployeeData();
      await refreshUser();

      setAvatarMessage({ type: 'success', text: 'Profile image updated successfully!' });
      setTimeout(() => {
        setIsAvatarModalOpen(false);
        setAvatarMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setAvatarMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update avatar image.'
      });
    } finally {
      setAvatarUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    const curr = passwordData.currentPassword.trim();
    const newP = passwordData.newPassword.trim();

    if (!curr) {
      setPasswordMessage({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newP.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newP !== passwordData.confirmPassword.trim()) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await apiClient.post('/auth/change-password', {
        currentPassword: encryptPassword(curr),
        newPassword: encryptPassword(newP)
      });

      setPasswordMessage({
        type: 'success',
        text: res.data?.message || 'Password changed successfully!'
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error(err);
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please check your current password.'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const presetAvatars = [

    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employee?.name || 'User1')}`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employee?.name || 'User2')}&hairColor=2c1b18&skinColor=f8d25c`,
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(employee?.name || 'Bot')}`,
    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
    `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80`,
    `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80`
  ];

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading employee dossier...</div>;
  }

  if (!employee) {
    return <div className="p-8 text-center text-destructive">Employee dossier not found.</div>;
  }

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Back link & Top Bar Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workforce Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAvatarModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium border border-border transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-primary" />
            <span>Change Photo</span>
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-xl bg-card border border-border shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            {/* Avatar with hover camera icon */}
            <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
              <img
                src={employee.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employee.name)}`}
                alt={employee.name}
                className="w-24 h-24 rounded-2xl border-2 border-border object-cover shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground tracking-tight">{employee.name}</h1>
                <StatusBadge status={employee.status} size="sm" />
                {isCurrentUserProfile && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                    Logged-In User
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-primary mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                {employee.jobPosition?.title || 'Staff Associate'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3">
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
            Central Hub — Quick Access Metrics
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
              active={activeTab === 'work'}
              onClick={() => setActiveTab('work')}
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

      {/* Main Tab Navigation Header */}
      <div className="flex border-b border-border bg-card rounded-t-xl px-4 pt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('work')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'work'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Work Information</span>
        </button>

        <button
          onClick={() => setActiveTab('private')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'private'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Private Information</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'contracts'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          <span>Contracts ({metrics.contractsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance ({metrics.attendanceCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeoff')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'timeoff'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PlaneTakeoff className="w-4 h-4" />
          <span>Time Off ({metrics.timeOffRequestsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('payslips')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'payslips'
              ? 'border-primary text-primary bg-secondary/30'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>Payslips ({metrics.payslipsCount})</span>
        </button>
      </div>

      {/* Dynamic Tab Content Box */}
      <div className="rounded-b-xl border border-t-0 border-border bg-card p-6 shadow-sm">

        {/* 1. WORK INFORMATION TAB */}
        {activeTab === 'work' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Work Contact Section */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Work Contact Details
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Work Email:</span>
                    <span className="font-mono text-foreground font-semibold">{employee.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Work Phone:</span>
                    <span className="font-mono text-foreground font-semibold">{employee.phone || employee.workPhone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Work Mobile:</span>
                    <span className="font-mono text-foreground">{employee.workMobile || employee.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Work Location:</span>
                    <span className="text-foreground">{employee.workLocation || 'Main Headquarters'}</span>
                  </div>
                </div>
              </div>

              {/* Organization & Position Section */}
              <div className="space-y-4">
                <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Building className="w-4 h-4 text-primary" />
                  Position & Hierarchy
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-semibold text-foreground">{employee.department?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Job Title / Role:</span>
                    <span className="font-semibold text-primary">{employee.jobPosition?.title || 'Staff Member'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Direct Manager:</span>
                    <span className="text-foreground">{employee.manager?.name || 'Executive Leadership'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Work Schedule:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {employee.workingSchedule?.name || 'Standard 40h / Week'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Allocations Sub-Section */}
            <div className="pt-4 border-t border-border">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Allocated Leave Balances
              </h3>
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
                      <div key={alloc.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">
                            {alloc.timeOffType?.name || 'Leave Type'}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {rem} Days Available
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
                          <span>Total: {total} d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. PRIVATE INFORMATION TAB */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Private Contact */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2">
                <MapPin className="w-4 h-4 text-primary" />
                Private Contact & Residence
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Private Email:</span>
                  <span className="font-mono text-foreground">{employee.privateEmail || employee.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Personal Phone:</span>
                  <span className="font-mono text-foreground">{employee.phone || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Residential Address:</span>
                  <span className="text-foreground max-w-[220px] text-right">{employee.address || 'On File'}</span>
                </div>
              </div>

              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2 pt-4">
                <Heart className="w-4 h-4 text-primary" />
                Emergency Contact
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Contact Person:</span>
                  <span className="font-semibold text-foreground">{employee.emergencyContactName || 'Family Member'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Emergency Phone:</span>
                  <span className="font-mono text-foreground">{employee.emergencyContactPhone || 'On File'}</span>
                </div>
              </div>
            </div>

            {/* Citizenship & Payroll Banking */}
            <div className="space-y-4">
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2">
                <Shield className="w-4 h-4 text-primary" />
                Citizenship & Demographics
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Nationality:</span>
                  <span className="text-foreground">{employee.nationality || 'Indian'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="capitalize text-foreground">{employee.gender || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="font-mono text-foreground">
                    {employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Marital Status:</span>
                  <span className="capitalize text-foreground">{employee.maritalStatus || 'Single'}</span>
                </div>
              </div>

              <h3 className="font-serif text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border pb-2 pt-4">
                <CreditCard className="w-4 h-4 text-primary" />
                Banking & Payout Account
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Bank Account No:</span>
                  <span className="font-mono text-foreground font-semibold">{employee.bankAccountNumber || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="text-foreground">{employee.bankName || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">IFSC / Code:</span>
                  <span className="font-mono text-foreground">{employee.bankIfsc || '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">PAN / Tax ID:</span>
                  <span className="font-mono text-foreground">{employee.panNumber || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SECURITY & PASSWORD TAB */}
        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-1 border-b border-border pb-4">
              <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Security Settings & Authentication
              </h3>
              <p className="text-xs text-muted-foreground">
                Manage your system password and view your account access security status.
              </p>
            </div>

            {/* Change Password Card Form */}
            <div className="p-6 rounded-xl bg-secondary/40 border border-border space-y-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <Key className="w-4 h-4 text-primary" />
                <span>Change Account Password</span>
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                  }`}
                >
                  {passwordMessage.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-foreground mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-foreground mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-foreground mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {passwordLoading ? (
                      <span>Updating...</span>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* User Account Access Info */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3 text-xs">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Account System Permissions
              </h4>
              <div className="grid grid-cols-2 gap-4 text-muted-foreground pt-1">
                <div>
                  <span className="block text-[11px]">System Role:</span>
                  <span className="font-bold text-foreground capitalize">
                    {employee.user?.roles ? employee.user.roles.join(', ') : 'Employee'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px]">Account Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Active & Authenticated</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CONTRACTS TAB */}
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
                        ? 'bg-secondary/70 border-primary/40 text-foreground'
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

        {/* 5. ATTENDANCE LOG TAB */}
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

        {/* 6. TIME OFF REQUESTS TAB */}
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

        {/* 7. PAYSLIPS TAB */}
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
                    {payslipsList.map((slip) => {
                      const gross = Number(slip.grossSalary) || 0;
                      const net = Number(slip.netSalary) || 0;
                      const deductions = Math.max(0, gross - net);

                      return (
                        <tr key={slip.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground">
                            {slip.payrun?.name || 'Monthly Payroll'}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {formatDate(slip.periodStart)} — {formatDate(slip.periodEnd)}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {formatCurrency(gross)}
                          </td>
                          <td className="px-4 py-3 font-mono text-rose-600 dark:text-rose-400">
                            -{formatCurrency(deductions)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(net)}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Full Employee Details Modal */}
      <EmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchEmployeeData}
        employeeToEdit={employee}
      />

      {/* Avatar Image Edit Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-base font-bold text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                Change Profile Picture
              </h3>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {avatarMessage && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  avatarMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                }`}
              >
                {avatarMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{avatarMessage.text}</span>
              </div>
            )}

            <div className="flex justify-center py-2">
              <img
                src={avatarUrlInput || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(employee.name)}`}
                alt="Preview"
                className="w-24 h-24 rounded-2xl border-2 border-primary object-cover shadow-md"
              />
            </div>

            <form onSubmit={handleUpdateAvatar} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Image URL</label>
                <input
                  type="url"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-2">Or Select Quick Preset</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrlInput(url)}
                      className={`shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                        avatarUrlInput === url ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-10 h-10 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAvatarUrlInput('')}
                  className="text-xs text-muted-foreground hover:text-destructive underline"
                >
                  Clear Photo
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-md border border-border text-foreground hover:bg-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={avatarUpdating}
                    className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all disabled:opacity-50"
                  >
                    {avatarUpdating ? 'Saving...' : 'Save Picture'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

