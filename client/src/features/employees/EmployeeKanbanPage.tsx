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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
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
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, search]);

  // Group employees by department for Kanban view
  const rawDepartmentGroups = departments.map((dept) => ({
    ...dept,
    employees: employees.filter((e) => e.departmentId === dept.id)
  }));

  const unassignedEmployees = employees.filter((e) => !e.departmentId);
  if (unassignedEmployees.length > 0) {
    rawDepartmentGroups.push({
      id: 'unassigned',
      name: 'General / Unassigned',
      managerName: 'N/A',
      headcount: unassignedEmployees.length,
      employees: unassignedEmployees
    });
  }

  // Filter columns so that when a department or search filter is applied, only matching department columns are shown
  const visibleGroups = rawDepartmentGroups.filter((group) => {
    if (selectedDept) {
      return group.id === selectedDept;
    }
    if (search.trim()) {
      return group.employees.length > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Workforce Directory</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total {employees.length} employee records managed across active working departments
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center p-1 rounded-md bg-secondary border border-border">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
          </div>

          {can('employees', 'create') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium shadow-sm hover:bg-primary/90 transition-all"
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
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, role, or email..."
            className="w-full bg-background border border-input rounded-md py-1.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
        visibleGroups.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No department members found matching the selected filter</p>
          </div>
        ) : (
          <div className={`flex gap-5 overflow-x-auto pb-6 items-start scrollbar-thin ${selectedDept ? 'justify-start' : ''}`}>
            {visibleGroups.map((group) => (
              <div
                key={group.id}
                className={`rounded-xl bg-card border border-border p-4 space-y-4 shadow-sm shrink-0 ${
                  selectedDept ? 'w-full max-w-xl' : 'flex-1 min-w-[280px] max-w-[380px]'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-foreground">
                      {group.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-[10px] font-mono text-muted-foreground">
                    {group.employees.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[150px]">
                  {group.employees.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-lg">
                      No members in this department
                    </div>
                  ) : (
                    group.employees.map((emp: any) => (
                      <div
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="group p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:translate-y-[-2px]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={emp.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name)}`}
                              alt={emp.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name)}`;
                              }}
                              className="w-10 h-10 rounded-lg border border-border object-cover shadow-sm"
                            />
                            <div>
                              <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {emp.name}
                              </h4>
                              <p className="text-[11px] text-muted-foreground">
                                {emp.jobPosition?.title || 'Staff'}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={emp.status} size="sm" />
                        </div>

                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground font-mono">
                            {emp.currentWage ? formatCurrency(emp.currentWage) + '/mo' : 'No Contract'}
                          </span>
                          <span className="text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
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
        )
      ) : (
        /* List View */
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Job Title</th>
                <th className="px-6 py-3.5">Monthly Wage</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-secondary/60 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={emp.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name)}`}
                      alt={emp.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.name)}`;
                      }}
                      className="w-8 h-8 rounded-lg object-cover border border-border"
                    />
                    <div>
                      <div className="font-semibold text-foreground">{emp.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{emp.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{emp.department?.name || '—'}</td>
                  <td className="px-6 py-4">{emp.jobPosition?.title || '—'}</td>
                  <td className="px-6 py-4 font-mono font-semibold text-foreground">
                    {emp.currentWage ? formatCurrency(emp.currentWage) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.status} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-primary hover:underline font-medium inline-flex items-center gap-1">
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
