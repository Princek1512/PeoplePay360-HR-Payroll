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
    <div className="space-y-8">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Executive Payroll Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live aggregation across Employees, Contracts, Working Schedules, Attendance, and Payruns.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
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
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          variant="emerald"
        />
        <KpiCard
          title="Payslips Generated"
          value={`${summary?.payslipsGenerated?.total || 0} Total`}
          subtitle={`${summary?.payslipsGenerated?.paid || 0} Paid • ${summary?.payslipsGenerated?.done || 0} Done`}
          icon={<ReceiptText className="w-4 h-4 text-blue-400" />}
          variant="brand"
        />
        <KpiCard
          title="Avg Salary / Employee"
          value={formatCurrency(summary?.avgSalaryPerEmployee)}
          subtitle={`${summary?.activeHeadcount || 0} active employees`}
          icon={<Users className="w-4 h-4 text-indigo-400" />}
          variant="indigo"
        />
        <KpiCard
          title="Approved Time Off"
          value={`${summary?.approvedTimeOffDays || 0} Days`}
          subtitle="Deducted from balance"
          icon={<PlaneTakeoff className="w-4 h-4 text-amber-400" />}
          variant="amber"
        />
        <KpiCard
          title="Attendance Health"
          value={`${summary?.attendanceHealthPercent || 100}%`}
          subtitle="Normal vs exception logs"
          icon={<Activity className="w-4 h-4 text-purple-400" />}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Salary Cost by Department */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Monthly Salary Cost by Department</h3>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated contract wages by business unit</p>
            </div>
            <Building className="w-4 h-4 text-brand-400" />
          </div>

          <div className="space-y-4 pt-2">
            {deptCosts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No department records available.</p>
            ) : (
              deptCosts.map((d) => {
                const pct = Math.min(100, Math.max(8, (d.salaryCost / maxDeptCost) * 100));

                return (
                  <div key={d.departmentId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{d.department}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 text-[11px]">{d.headcount} staff</span>
                        <span className="font-bold text-white">{formatCurrency(d.salaryCost)}</span>
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500"
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
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Monthly Net Salary Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Historical payroll run distribution</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-4 pt-2">
            {netTrend.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No payruns recorded yet.</p>
            ) : (
              netTrend.map((t, idx) => {
                const pctNet = Math.min(100, Math.max(10, (t.netSalary / maxTrend) * 100));
                const pctGross = Math.min(100, Math.max(10, (t.grossSalary / maxTrend) * 100));

                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-brand-300">{t.payrunName}</span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-400">Gross: {formatCurrency(t.grossSalary)}</span>
                        <span className="text-emerald-400 font-bold">Net: {formatCurrency(t.netSalary)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pctNet}%` }}
                        />
                      </div>
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
        <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Active Payroll Alerts</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
              {alerts.length} Issues
            </span>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero blocking alerts. All records validated.</span>
              </div>
            ) : (
              alerts.map((al, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{al.category} Alert</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                      {al.severity}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{al.message}</p>
                  {al.items?.length > 0 && (
                    <div className="pt-1 text-[10px] text-slate-500 font-mono">
                      Impacted: {al.items.join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Overview Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Department Workforce & Budget</h3>
              <p className="text-xs text-slate-400 mt-0.5">Headcount and active contract budget per division</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Manager</th>
                  <th className="px-4 py-2.5">Headcount</th>
                  <th className="px-4 py-2.5 text-right">Monthly Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {departments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">
                      {d.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {d.managerName || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                      {d.headcount} members
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">
                      {formatCurrency(d.monthlySalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
