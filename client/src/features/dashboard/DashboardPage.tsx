import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { KpiCard } from '../../components/shared/KpiCard';
import { formatCurrency } from '../../lib/formatters';
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
  Calendar
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [deptCosts, setDeptCosts] = useState<any[]>([]);
  const [netTrend, setNetTrend] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, costRes, trendRes, alertRes, deptRes] = await Promise.all([
        apiClient.get('/dashboard/summary', { params: { departmentId: selectedDept || undefined } }),
        apiClient.get('/dashboard/salary-cost-by-department'),
        apiClient.get('/dashboard/net-salary-trend'),
        apiClient.get('/dashboard/alerts'),
        apiClient.get('/dashboard/departments')
      ]);

      setSummary(sumRes.data.data);
      setDeptCosts(costRes.data.data || []);
      setNetTrend(trendRes.data.data || []);
      setAlerts(alertRes.data.data || []);
      setDepartments(deptRes.data.data || []);
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

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Executive Payroll Dashboard</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time live aggregation across Employees, Contracts, Schedules, Attendance, and Payruns.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border text-xs">
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
