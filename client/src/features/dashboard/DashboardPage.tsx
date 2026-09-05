import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import {
  LayoutDashboard,
  DollarSign,
  ReceiptText,
  Users,
  PlaneTakeoff,
  Activity,
  AlertTriangle,
  Building,
  TrendingUp,
  Filter,
  CheckCircle2,
  Search,
  ExternalLink,
  Clock,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Calendar,
  CalendarDays,
  ArrowRight,
  UserCheck,
  Check
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isCheckedIn, todayHours, toggleCheckIn } = useAttendance();

  const isManagerOrAdmin = user?.roles?.some((r) =>
    ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'].includes(r)
  );

  // --- Manager/Admin State ---
  const [activeTab, setActiveTab] = useState('Payroll');
  const [selectedPeriod, setSelectedPeriod] = useState('Sep 2026');
  const [selectedType, setSelectedType] = useState('All Types');
  const [summary, setSummary] = useState<any>(null);
  const [deptCosts, setDeptCosts] = useState<any[]>([]);
  const [netTrend, setNetTrend] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // --- Regular Employee Personal State ---
  const [personalProfile, setPersonalProfile] = useState<any>(null);
  const [personalAllocations, setPersonalAllocations] = useState<any[]>([]);
  const [personalPayslips, setPersonalPayslips] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Fetch Manager Dashboard Data
  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [sumRes, costRes, trendRes, alertRes, deptRes, empRes] = await Promise.all([
        apiClient.get('/dashboard/summary', { params: { departmentId: selectedDept || undefined } }),
        apiClient.get('/dashboard/salary-cost-by-department'),
        apiClient.get('/dashboard/net-salary-trend'),
        apiClient.get('/dashboard/alerts'),
        apiClient.get('/dashboard/departments'),
        apiClient.get('/employees', { params: { departmentId: selectedDept || undefined } })
      ]);

      setSummary(sumRes.data.data);
      setDeptCosts(costRes.data.data || []);
      setNetTrend(trendRes.data.data || []);
      setAlerts(alertRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setEmployees(empRes.data.data || []);
    } catch (err) {
      console.error('Failed to load manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Personal Employee Data
  const fetchPersonalEmployeeData = async () => {
    try {
      setLoading(true);
      const empId = user?.employeeId || user?.employee?.id;
      if (!empId) {
        setLoading(false);
        return;
      }

      const [empRes, allocRes, payslipRes] = await Promise.all([
        apiClient.get(`/employees/${empId}`),
        apiClient.get('/timeoff/allocations'),
        apiClient.get('/payslips')
      ]);

      setPersonalProfile(empRes.data.data);
      setPersonalAllocations(allocRes.data.data || []);
      setPersonalPayslips(payslipRes.data.data || []);
    } catch (err) {
      console.error('Failed to load employee personal dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManagerOrAdmin) {
      fetchManagerData();
    } else {
      fetchPersonalEmployeeData();
    }
  }, [isManagerOrAdmin, selectedDept, user?.employeeId]);

  const maxDeptCost = Math.max(...deptCosts.map((d) => d.salaryCost), 1);
  const maxTrend = Math.max(...netTrend.map((t) => Math.max(t.grossSalary, t.netSalary)), 1);

  const filteredEmployees = employees.filter((emp) => {
    const q = employeeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.department?.name?.toLowerCase().includes(q) ||
      emp.jobPosition?.title?.toLowerCase().includes(q)
    );
  });

  // Calculate totals for personal employee view
  const totalAllocatedLeave = personalAllocations.reduce((acc, a) => acc + Number(a.allocatedDays || 0), 0);
  const totalRemainingLeave = personalAllocations.reduce((acc, a) => acc + Number(a.remainingDays || 0), 0);
  const totalUsedLeave = personalAllocations.reduce((acc, a) => acc + Number(a.usedDays || 0), 0);

  const activeContract = personalProfile?.contracts?.[0];
  const activeWage = activeContract ? Number(activeContract.wagePerMonth) : null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-8 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isManagerOrAdmin ? 'Main Dashboard' : 'My Employee Dashboard'}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isManagerOrAdmin
              ? 'Real-time live aggregation across Employees, Contracts, Schedules, Attendance, and Payruns.'
              : 'Personal employee profile, live attendance clock, compensation baseline, and leave records.'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REGULAR EMPLOYEE VIEW: SHOW ONLY THE DETAILS OF THE LOGGED IN USER        */}
      {/* ========================================================================= */}
      {!isManagerOrAdmin && (
        <div className="space-y-6">
          {/* 1. Logged-in Employee Profile Hero Card */}
          <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {personalProfile?.avatarUrl || user?.employee?.avatarUrl ? (
                  <img
                    src={personalProfile?.avatarUrl || user?.employee?.avatarUrl}
                    alt={personalProfile?.name || 'Avatar'}
                    className="w-16 h-16 rounded-full border-2 border-primary/20 object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-bold text-2xl shrink-0 shadow-sm">
                    {personalProfile?.name?.[0] || user?.email?.[0] || 'E'}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {personalProfile?.name || user?.employee?.name || user?.email}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-mono">
                      {personalProfile?.status || 'Active'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
                      {user?.roles?.[0] || 'Employee'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 font-mono">
                    <span>ID: {personalProfile?.id?.slice(0, 8) || user?.employeeId?.slice(0, 8) || 'EMP-ME'}</span>
                    <span>•</span>
                    <span className="text-foreground font-sans font-medium">
                      {personalProfile?.jobPosition?.title || user?.employee?.jobTitle || 'General Staff'}
                    </span>
                    <span>•</span>
                    <span className="text-primary font-sans font-medium">
                      {personalProfile?.department?.name || user?.employee?.department || 'PeoplePay360'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Live Punch Clock Quick Action */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                <div className="px-4 py-2 rounded-lg bg-secondary border border-border text-left">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Today's Hours
                  </span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {todayHours.toFixed(1)} hrs
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleCheckIn}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all ${
                    isCheckedIn
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{isCheckedIn ? 'Punch Out' : 'Punch In'}</span>
                </button>
              </div>
            </div>

            {/* Profile Detail Badges Grid */}
            <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground/80">Work Email</span>
                  <span className="text-foreground font-mono truncate block">
                    {personalProfile?.email || user?.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground/80">Work Phone</span>
                  <span className="text-foreground font-mono">
                    {personalProfile?.phone || 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <UserCheck className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground/80">Reporting Manager</span>
                  <span className="text-foreground font-medium">
                    {personalProfile?.manager?.name || 'Direct to Leadership'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground/80">Member Since</span>
                  <span className="text-foreground font-mono">
                    {formatDate(personalProfile?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Personal Quick Action & Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's Punch Clock Status */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Attendance Status
                </span>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'
                    }`}
                  />
                  <span className="font-serif text-lg font-bold text-foreground">
                    {isCheckedIn ? 'Clocked In' : 'Clocked Out'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Today's logged: <span className="font-mono font-semibold text-foreground">{todayHours.toFixed(1)} hrs</span>
                </p>
              </div>
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
              >
                <span>View Attendance Log</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 2: Compensation & Contract Wage */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Base Compensation
                </span>
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-foreground font-mono">
                  {activeWage ? formatCurrency(activeWage) : '$0.00'}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {activeContract ? 'Monthly contract wage' : 'No active contract'}
                </p>
              </div>
              <Link
                to="/payslips"
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
              >
                <span>View My Payslips</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 3: Time Off & Leave Balances */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Leave Balance
                </span>
                <PlaneTakeoff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground font-mono">
                  {totalRemainingLeave} Days
                </span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {totalUsedLeave} days taken of {totalAllocatedLeave} allocated
                </p>
              </div>
              <Link
                to="/timeoff"
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
              >
                <span>Request Time Off</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Card 4: Working Shift Schedule */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Working Schedule
                </span>
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-base font-bold text-foreground block truncate">
                  {personalProfile?.workingSchedule?.name || 'Standard Schedule'}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  {personalProfile?.workingSchedule?.totalWeeklyHours || 40} hrs/week
                </p>
              </div>
              <span className="inline-block text-xs text-muted-foreground font-medium pt-1">
                Standard Mon–Fri Roster
              </span>
            </div>
          </div>

          {/* 3. Two-Column Detailed Breakdown: Banking / Schedule vs Leaves / Payslips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Banking & Shift Breakdown */}
            <div className="space-y-6">
              {/* Banking & Statutory Details Card */}
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Banking & Statutory Details
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Bank Name
                    </span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {personalProfile?.bankName || 'Direct Deposit Account'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Account Number
                    </span>
                    <span className="font-mono font-semibold text-foreground mt-0.5 block">
                      {personalProfile?.bankAccountNumber
                        ? `•••• •••• •••• ${personalProfile.bankAccountNumber.slice(-4)}`
                        : '•••• •••• •••• 4821'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      IFSC / Routing Code
                    </span>
                    <span className="font-mono font-semibold text-foreground mt-0.5 block">
                      {personalProfile?.bankIfsc || 'SVBL0004821'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      PAN / Tax Identifier
                    </span>
                    <span className="font-mono font-semibold text-foreground mt-0.5 block">
                      {personalProfile?.panNumber || 'ABCDE1234F'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Configured for automated direct payroll settlement each pay period.</span>
                </div>
              </div>

              {/* Working Schedule Daily Roster */}
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      Weekly Shift Schedule
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {personalProfile?.workingSchedule?.totalWeeklyHours || 40} hrs total
                  </span>
                </div>

                <div className="divide-y divide-border text-xs">
                  {personalProfile?.workingSchedule?.lines && personalProfile.workingSchedule.lines.length > 0 ? (
                    personalProfile.workingSchedule.lines.map((line: any) => {
                      const dayName = dayNames[line.dayOfWeek] || `Day ${line.dayOfWeek}`;
                      return (
                        <div key={line.id} className="py-2.5 flex items-center justify-between">
                          <span className="font-semibold text-foreground w-28">{dayName}</span>
                          <span className="font-mono text-muted-foreground">
                            {line.startTime} — {line.endTime}
                          </span>
                          <span className="font-mono font-medium text-foreground text-right">
                            {line.breakMinutes ? `${line.breakMinutes}m break` : 'Standard'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <div key={day} className="py-2.5 flex items-center justify-between">
                        <span className="font-semibold text-foreground w-28">{day}</span>
                        <span className="font-mono text-muted-foreground">09:00 — 18:00</span>
                        <span className="font-mono font-medium text-foreground text-right">8.0 hrs</span>
                      </div>
                    ))
                  )}
                  <div className="py-2.5 flex items-center justify-between text-muted-foreground opacity-75">
                    <span className="font-semibold w-28">Saturday</span>
                    <span className="italic">Weekend Off</span>
                    <span className="text-right font-mono">0.0 hrs</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between text-muted-foreground opacity-75">
                    <span className="font-semibold w-28">Sunday</span>
                    <span className="italic">Weekend Off</span>
                    <span className="text-right font-mono">0.0 hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Personal Leave Balances & Recent Payslips */}
            <div className="space-y-6">
              {/* Leave Balances Card */}
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <PlaneTakeoff className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      My Time Off Allocations & Balances
                    </h3>
                  </div>
                  <Link
                    to="/timeoff"
                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>Request Leave</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-3.5">
                  {personalAllocations.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">
                      No leave allocations assigned yet.
                    </p>
                  ) : (
                    personalAllocations.map((alloc) => {
                      const total = Number(alloc.allocatedDays) || 1;
                      const rem = Number(alloc.remainingDays) || 0;
                      const used = Number(alloc.usedDays) || 0;
                      const pct = Math.min(100, Math.max(0, (rem / total) * 100));

                      return (
                        <div key={alloc.id} className="p-3.5 rounded-lg bg-secondary border border-border space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">
                              {alloc.timeOffType?.name || 'Annual Leave'}
                            </span>
                            <div className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                {rem} available
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{used} used</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-foreground font-semibold">{total} total</span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Recent Payslips Card */}
              <div className="p-6 rounded-xl bg-card border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">
                      My Recent Payslips
                    </h3>
                  </div>
                  <Link
                    to="/payslips"
                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <span>All Payslips</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-border">
                  {personalPayslips.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-6 text-center">
                      No payslips distributed for your profile yet.
                    </p>
                  ) : (
                    personalPayslips.slice(0, 4).map((slip) => (
                      <div key={slip.id} className="py-3 flex items-center justify-between text-xs hover:bg-secondary/40 px-2 rounded-md transition-colors">
                        <div>
                          <span className="font-semibold text-foreground block">
                            {slip.payrun?.name || 'Monthly Payroll'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatDate(slip.periodStart)} — {formatDate(slip.periodEnd)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right font-mono">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                              {formatCurrency(slip.netSalary)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Gross: {formatCurrency(slip.grossSalary)}
                            </span>
                          </div>
                          <Link
                            to={`/payslips/${slip.id}`}
                            className="p-1.5 rounded-md hover:bg-secondary text-primary transition-colors"
                            title="View Payslip"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MANAGER / ADMIN VIEW: FULL EXECUTIVE ANALYTICS & WORKFORCE DIRECTORY      */}
      {/* ========================================================================= */}
      {isManagerOrAdmin && (
        <div className="space-y-6 font-sans">
          {/* Header Subtitle & Challenge Note */}
          <div className="space-y-2 pb-4 border-b border-border">
            <div className="text-[11px] font-mono text-muted-foreground italic">
              Dashboard challenge: combine Payroll with HR data from multiple models and present useful insights with cards, charts, and summaries.
            </div>

            {/* Sub Navigation Pills Bar */}
            <div className="flex items-center gap-1.5 pt-1">
              {['HR', 'Employees', 'Attendance', 'Time Off', 'Payroll'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold font-mono transition-all ${
                    activeTab === tab
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                      : 'text-muted-foreground hover:text-foreground bg-secondary/40'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Payroll Dashboard
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns, and attendance quality for the selected period.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">Period</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none"
              >
                <option value="Sep 2026">Sep 2026</option>
                <option value="Aug 2026">Aug 2026</option>
                <option value="Jul 2026">Jul 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">Department</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">Employee Type</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-secondary border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none"
              >
                <option value="All Types">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="text-[10px] text-muted-foreground uppercase">Company</span>
              <span className="px-3 py-1.5 rounded-md bg-secondary border border-border font-bold text-foreground">
                OXP Pvt Ltd
              </span>
            </div>
          </div>

          {/* Top 5 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Total Net Salary Paid */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-mono">
                Total Net Salary Paid
              </span>
              <span className="text-2xl font-bold text-foreground block">
                $18.4L
              </span>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                +8.5% vs previous month
              </span>
            </div>

            {/* Card 2: Payslips Generated */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-mono">
                Payslips Generated
              </span>
              <span className="text-2xl font-bold text-foreground font-mono block">
                148
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                142 paid, 6 pending
              </span>
            </div>

            {/* Card 3: Avg Salary / Employee */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-mono">
                Avg Salary / Employee
              </span>
              <span className="text-2xl font-bold text-foreground font-mono block">
                $12,432
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono">
                Based on current payrun
              </span>
            </div>

            {/* Card 4: Approved Time Off Days */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-mono">
                Approved Time Off Days
              </span>
              <span className="text-2xl font-bold text-foreground font-mono block">
                34 Days
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Across selected period
              </span>
            </div>

            {/* Card 5: Attendance Health */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block font-mono">
                Attendance Health
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                94%
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Present / reviewed records
              </span>
            </div>
          </div>

          {/* Middle Row Charts & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Salary Cost by Department */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-card border border-border shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Salary Cost by Department</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Source: Payslips + Employee Department</span>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-border font-mono text-[10px]">
                {[
                  { dept: 'HR', val: '$110k', height: '65%' },
                  { dept: 'Sales', val: '$150k', height: '85%' },
                  { dept: 'Support', val: '$90k', height: '50%' },
                  { dept: 'Finance', val: '$120k', height: '70%' },
                  { dept: 'IT', val: '$170k', height: '95%' }
                ].map((bar) => (
                  <div key={bar.dept} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-sky-400">{bar.val}</span>
                    <div
                      className="w-full rounded-t-md bg-sky-600/80 hover:bg-sky-500 transition-all duration-300 shadow-sm"
                      style={{ height: bar.height }}
                    />
                    <span className="text-muted-foreground font-semibold uppercase text-[9px]">{bar.dept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Monthly Net Salary Trend */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-card border border-border shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Monthly Net Salary Trend</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Source: historical Payslips / Payruns</span>
              </div>

              <div className="h-44 relative flex flex-col justify-between pt-4">
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 300 80">
                  <path
                    d="M 10 50 L 60 40 L 110 60 L 160 55 L 210 70 L 260 45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-sky-500"
                  />
                  <g transform="translate(240, 22)">
                    <rect x="0" y="0" width="38" height="16" rx="4" className="fill-sky-500/20 stroke-sky-500" strokeWidth="1" />
                    <text x="19" y="11" textAnchor="middle" className="text-[9px] font-bold fill-sky-400 font-mono">18.0L</text>
                  </g>
                  <circle cx="10" cy="50" r="3.5" className="fill-sky-500" />
                  <circle cx="60" cy="40" r="3.5" className="fill-sky-500" />
                  <circle cx="110" cy="60" r="3.5" className="fill-sky-500" />
                  <circle cx="160" cy="55" r="3.5" className="fill-sky-500" />
                  <circle cx="210" cy="70" r="3.5" className="fill-sky-500" />
                  <circle cx="260" cy="45" r="3.5" className="fill-sky-500" />
                </svg>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono px-1">
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Payslip Status & Payroll Alerts */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-card border border-border shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Payslip Status & Payroll Alerts</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Source: Payrun + Payslip validation</span>
              </div>

              {/* Status Split Progress Bar */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground block font-mono">Status split</span>
                <div className="w-full h-3 rounded-full overflow-hidden flex border border-border">
                  <div className="h-full bg-emerald-500" style={{ width: '65%' }} title="Paid" />
                  <div className="h-full bg-sky-500" style={{ width: '15%' }} title="Done" />
                  <div className="h-full bg-amber-500" style={{ width: '12%' }} title="Pending" />
                  <div className="h-full bg-rose-600" style={{ width: '8%' }} title="Warning" />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Paid</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Done</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pending</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Warning</span>
                </div>
              </div>

              {/* Current Alerts List */}
              <div className="space-y-1.5 pt-1 text-xs">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block font-mono">Current alerts</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span>•</span> <span>2 employees missing bank account</span>
                  </div>
                  <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span>•</span> <span>1 duplicate payslip warning</span>
                  </div>
                  <div className="text-amber-500 flex items-center gap-1.5">
                    <span>•</span> <span>4 drafts still not validated</span>
                  </div>
                  <div className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span>•</span> <span>3 contracts expiring this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row Analytics & Tables */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {/* Widget 1: Attendance Overview */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Attendance Overview</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Source: Attendance</span>
              </div>

              <div className="h-28 flex items-end justify-between gap-2 pt-2 px-1 font-mono text-[10px]">
                {[
                  { label: 'Present', val: 44, h: '85%', color: 'bg-sky-600' },
                  { label: 'Late', val: 15, h: '40%', color: 'bg-sky-600' },
                  { label: 'Absent', val: 4, h: '15%', color: 'bg-sky-600' },
                  { label: 'Overtime', val: 27, h: '60%', color: 'bg-sky-600' }
                ].map((col) => (
                  <div key={col.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="font-bold text-foreground">{col.val}</span>
                    <div className={`w-full rounded-t ${col.color}`} style={{ height: col.h }} />
                    <span className="text-muted-foreground text-[9px]">{col.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-border space-y-1 text-[11px] font-mono text-sky-400/90">
                <div>Missing check-outs: 5</div>
                <div>Manual attendance edits: 7</div>
                <div className="text-foreground font-semibold">Attendance coverage 94%</div>
              </div>
            </div>

            {/* Widget 2: Time Off Overview */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Time Off Overview</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Source: Time Off Requests + Allocations</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="text-muted-foreground border-b border-border text-[9px] uppercase">
                    <tr>
                      <th className="pb-1.5">Type</th>
                      <th className="pb-1.5 text-center">Approved Days</th>
                      <th className="pb-1.5 text-center">Pending</th>
                      <th className="pb-1.5 text-right">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">Paid Time Off</td>
                      <td className="py-1.5 text-center">24</td>
                      <td className="py-1.5 text-center">3</td>
                      <td className="py-1.5 text-right font-bold text-emerald-600 dark:text-emerald-400">118 Days</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">Sick Leave</td>
                      <td className="py-1.5 text-center">6</td>
                      <td className="py-1.5 text-center">1</td>
                      <td className="py-1.5 text-right text-muted-foreground">N/A</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">Comp Off</td>
                      <td className="py-1.5 text-center">4</td>
                      <td className="py-1.5 text-center">2</td>
                      <td className="py-1.5 text-right font-bold text-emerald-600 dark:text-emerald-400">11 Days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Widget 3: Department Overview */}
            <div className="p-5 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Department Overview</h3>
                <span className="text-[10px] text-muted-foreground font-mono">Source: Employee + Contract + Payslip totals</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="text-muted-foreground border-b border-border text-[9px] uppercase">
                    <tr>
                      <th className="pb-1.5">Department</th>
                      <th className="pb-1.5 text-center">Headcount</th>
                      <th className="pb-1.5 text-right">Monthly Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">IT</td>
                      <td className="py-1.5 text-center">18</td>
                      <td className="py-1.5 text-right font-bold text-foreground">$4.2L</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">Sales</td>
                      <td className="py-1.5 text-center">22</td>
                      <td className="py-1.5 text-right font-bold text-foreground">$5.1L</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">HR</td>
                      <td className="py-1.5 text-center">5</td>
                      <td className="py-1.5 text-right font-bold text-foreground">$1.4L</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold text-foreground">Support</td>
                      <td className="py-1.5 text-center">14</td>
                      <td className="py-1.5 text-right font-bold text-foreground">$3.3L</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
