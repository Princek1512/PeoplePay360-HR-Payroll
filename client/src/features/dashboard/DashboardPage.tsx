import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency } from '../../lib/formatters';
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
  Phone
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isCheckedIn, todayHours, toggleCheckIn } = useAttendance();

  const [summary, setSummary] = useState<any>(null);
  const [deptCosts, setDeptCosts] = useState<any[]>([]);
  const [netTrend, setNetTrend] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDept]);

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

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Main Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time live aggregation across Employees, Contracts, Schedules, Attendance, and Payruns.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border text-xs shadow-sm">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            >
              <option value="" className="bg-popover text-popover-foreground">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-popover text-popover-foreground">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employee Greeting & Quick Stats Banner */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user?.employee?.avatarUrl ? (
            <img
              src={user.employee.avatarUrl}
              alt="Avatar"
              className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-primary font-serif font-bold text-xl shrink-0">
              {user?.employee?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-foreground">
                Welcome back, {user?.employee?.name || user?.email}!
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider font-mono">
                {user?.roles?.[0] || 'Employee'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              PeoplePay360 Platform • {user?.employee?.department || 'Enterprise Workforce'}
            </p>
          </div>
        </div>

        {/* Quick Employee Punch Clock & Status */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-4 py-2 rounded-lg bg-secondary border border-border text-left">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Today's Worked
            </span>
            <span className="text-sm font-bold text-foreground font-mono">
              {todayHours.toFixed(1)} hrs
            </span>
          </div>

          <button
            type="button"
            onClick={toggleCheckIn}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all ${
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

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Net Paid"
          value={formatCurrency(summary?.totalNetSalaryPaid)}
          subtitle="Validated & distributed"
          icon={<DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          variant="emerald"
        />
        <KpiCard
          title="Payslips Generated"
          value={`${summary?.payslipsGenerated?.total || 0} Total`}
          subtitle={`${summary?.payslipsGenerated?.paid || 0} Paid • ${summary?.payslipsGenerated?.done || 0} Done`}
          icon={<ReceiptText className="w-4 h-4 text-primary" />}
          variant="brand"
        />
        <KpiCard
          title="Avg Salary / Employee"
          value={formatCurrency(summary?.avgSalaryPerEmployee)}
          subtitle={`${summary?.activeHeadcount || 0} active employees`}
          icon={<Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          variant="indigo"
        />
        <KpiCard
          title="Approved Time Off"
          value={`${summary?.approvedTimeOffDays || 0} Days`}
          subtitle="Deducted from balance"
          icon={<PlaneTakeoff className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          variant="amber"
        />
        <KpiCard
          title="Attendance Health"
          value={`${summary?.attendanceHealthPercent || 100}%`}
          subtitle="Normal vs exception logs"
          icon={<Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
          variant="default"
        />
      </div>

      {/* SECTION: All Employee Details & Workforce Directory */}
      <div className="p-6 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-serif text-base font-bold text-foreground tracking-tight">
                All Employee Details & Workforce Directory
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live corporate employee roster showing active positions, schedules, and payroll baseline
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full bg-background border border-input rounded-md py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department & Position</th>
                <th className="px-4 py-3">Contact Information</th>
                <th className="px-4 py-3">Working Schedule</th>
                <th className="px-4 py-3">Contract / Wage</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground italic">
                    No employee records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full border border-border object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                            {emp.name?.[0] || 'E'}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-foreground block">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {emp.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="inline-block px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-medium text-foreground">
                          {emp.department?.name || 'Unassigned'}
                        </span>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{emp.jobPosition?.title || 'General Staff'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[170px]">{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span className="font-medium text-foreground block">
                          {emp.workingSchedule?.name || 'Standard 40h'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {emp.workingSchedule?.totalWeeklyHours || 40} hrs/week
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {emp.currentWage ? (
                        <div className="space-y-0.5 font-mono">
                          <span className="font-bold text-foreground block">
                            {formatCurrency(emp.currentWage)}
                          </span>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                            Active Contract
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">No active contract</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={emp.status} size="sm" />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-primary hover:bg-secondary transition-colors"
                        title="View Employee Profile"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Salary Cost by Department */}
        <div className="p-6 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-sm font-bold text-foreground tracking-tight">Monthly Salary Cost by Department</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aggregated contract wages by business unit</p>
            </div>
            <Building className="w-4 h-4 text-primary" />
          </div>

          <div className="space-y-4 pt-2">
            {deptCosts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">No department records available.</p>
            ) : (
              deptCosts.map((d) => {
                const pct = Math.min(100, Math.max(8, (d.salaryCost / maxDeptCost) * 100));

                return (
                  <div key={d.departmentId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{d.department}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-muted-foreground text-[11px]">{d.headcount} staff</span>
                        <span className="font-bold text-foreground">{formatCurrency(d.salaryCost)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
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

        {/* Chart 2: Net Salary Trend */}
        <div className="p-6 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-sm font-bold text-foreground tracking-tight">Monthly Net Salary Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Historical payroll run distribution</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="space-y-4 pt-2">
            {netTrend.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">No payruns recorded yet.</p>
            ) : (
              netTrend.map((t, idx) => {
                const pctNet = Math.min(100, Math.max(10, (t.netSalary / maxTrend) * 100));

                return (
                  <div key={idx} className="p-3 rounded-lg bg-secondary border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{t.payrunName}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-muted-foreground">Gross: {formatCurrency(t.grossSalary)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Net: {formatCurrency(t.netSalary)}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-card overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pctNet}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Alerts & Department Headcount Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Panel */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-sm font-bold text-foreground tracking-tight">Active Payroll Alerts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live validations and exceptions</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                <p className="text-xs text-muted-foreground font-medium">All systems green. No pending payroll alerts.</p>
              </div>
            ) : (
              alerts.map((alt, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                    alt.type === 'BLOCKING_ERROR'
                      ? 'bg-destructive/10 border-destructive/30 text-destructive'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase text-[10px] tracking-wider mb-0.5">
                      {alt.type.replace('_', ' ')}
                    </span>
                    <p className="leading-relaxed">{alt.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Table */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-serif text-sm font-bold text-foreground tracking-tight">Department Workforce & Cost Summary</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly allocation breakdown</p>
            </div>
            <Users className="w-4 h-4 text-primary" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="pb-3">Department</th>
                  <th className="pb-3 text-center">Active Headcount</th>
                  <th className="pb-3 text-right">Total Monthly Budget</th>
                  <th className="pb-3 text-right">Avg Per Head</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deptCosts.map((d) => {
                  const avg = d.headcount > 0 ? d.salaryCost / d.headcount : 0;
                  return (
                    <tr key={d.departmentId} className="hover:bg-secondary/50 transition-colors">
                      <td className="py-3 font-semibold text-foreground">{d.department}</td>
                      <td className="py-3 text-center font-mono text-muted-foreground">{d.headcount}</td>
                      <td className="py-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(d.salaryCost)}
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        {formatCurrency(avg)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
