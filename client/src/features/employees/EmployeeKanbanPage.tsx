import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency } from '../../lib/formatters';
import { EmployeeModal } from './EmployeeModal';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Building,
  Mail,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export const EmployeeKanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        apiClient.get('/employees', {
          params: {
            departmentId: selectedDept || undefined,
            search: search || undefined
          }
        }),
        apiClient.get('/dashboard/departments')
      ]);
      setEmployees(empRes.data.data || []);
      setDepartments(deptRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, search]);

  // Group employees by department for Kanban view
  const departmentGroups = departments.map((dept) => ({
    ...dept,
    employees: employees.filter((e) => e.departmentId === dept.id)
  }));

  const unassignedEmployees = employees.filter((e) => !e.departmentId);
  if (unassignedEmployees.length > 0) {
    departmentGroups.push({
      id: 'unassigned',
      name: 'General / Unassigned',
      managerName: 'N/A',
      headcount: unassignedEmployees.length,
      employees: unassignedEmployees
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Workforce Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total {employees.length} employee records managed across active working departments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {can('employees', 'create') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {departmentGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {group.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                  {group.employees.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[150px]">
                {group.employees.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
                    No members in this department
                  </div>
                ) : (
                  group.employees.map((emp: any) => (
                    <div
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="group p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-brand-500/60 transition-all duration-200 cursor-pointer shadow-md hover:shadow-brand-500/10 hover:translate-y-[-2px]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name)}`}
                            alt={emp.name}
                            className="w-10 h-10 rounded-xl border border-slate-700 object-cover shadow-sm"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors">
                              {emp.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {emp.jobPosition?.title || 'Staff'}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={emp.status} size="sm" />
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-mono">
                          {emp.currentWage ? formatCurrency(emp.currentWage) + '/mo' : 'No Contract'}
                        </span>
                        <span className="text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                          Profile
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Job Title</th>
                <th className="px-6 py-3.5">Monthly Wage</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-slate-850/40 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={emp.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name)}`}
                      alt={emp.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <div className="font-bold text-white">{emp.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{emp.department?.name || '—'}</td>
                  <td className="px-6 py-4">{emp.jobPosition?.title || '—'}</td>
                  <td className="px-6 py-4 font-mono font-semibold text-white">
                    {emp.currentWage ? formatCurrency(emp.currentWage) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1">
                      View Hub <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};
