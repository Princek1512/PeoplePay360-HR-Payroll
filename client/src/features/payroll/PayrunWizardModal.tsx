import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';
import { formatCurrency } from '../../lib/formatters';
import { CircleDollarSign, Users, AlertTriangle, ArrowRight, ArrowLeft, Check, Search, Filter } from 'lucide-react';

interface PayrunWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPayrunId?: string) => void;
}

export const PayrunWizardModal: React.FC<PayrunWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Scope inputs
  const [name, setName] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [structures, setStructures] = useState<any[]>([]);

  // Step 2 Employee Selection & Filters
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [hoursFilter, setHoursFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideAlreadyPaid, setHideAlreadyPaid] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      setName(`Payrun — ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      setPeriodStart(monthStart);
      setPeriodEnd(monthEnd);

      apiClient.get('/salary-config/structures').then((res) => {
        setStructures(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSalaryStructureId(res.data.data[0].id);
        }
      }).catch(console.error);

      setEligibleEmployees([]);
      setSelectedEmpIds([]);
      setDeptFilter('');
      setHoursFilter('');
      setSearchQuery('');
      setHideAlreadyPaid(true);
      setError(null);
    }
  }, [isOpen]);

  // Helper check to identify already paid / processed employees
  const checkIsAlreadyPaid = (emp: any) => {
    if (!emp.warnings || emp.warnings.length === 0) return false;
    return emp.warnings.some((w: string) =>
      w.toLowerCase().includes('already has a payslip') || w.toLowerCase().includes('already paid')
    );
  };

  // Step 1 Continue: Fetch scope preview (no DB persistence!)
  const handleContinueToStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryStructureId || !periodStart || !periodEnd) {
      setError('Please choose structure and period date range.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/payruns/scope-preview', {
        salaryStructureId,
        periodStart,
        periodEnd
      });

      const employees = res.data.data.employees || [];
      setEligibleEmployees(employees);

      // Auto-select ONLY eligible employees who are not already paid for this period
      const unpaidEmployees = employees.filter((e: any) => !checkIsAlreadyPaid(e));
      setSelectedEmpIds(unpaidEmployees.map((e: any) => e.id));
      setDeptFilter('');
      setHoursFilter('');
      setSearchQuery('');
      setHideAlreadyPaid(true);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch eligible employees for period.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectEmployee = (empId: string) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter((id) => id !== empId));
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  // Compute unique filter dropdown options
  const uniqueDepartments = Array.from(
    new Set(eligibleEmployees.map((e) => e.department).filter(Boolean))
  );
  const uniqueHours = Array.from(
    new Set(eligibleEmployees.map((e) => e.weeklyHours).filter((h) => h !== undefined && h !== null))
  ).sort((a: any, b: any) => Number(a) - Number(b));

  // Compute filtered employee list based on department, weekly target, search, and already paid toggle
  const filteredEmployees = eligibleEmployees.filter((emp) => {
    if (hideAlreadyPaid && checkIsAlreadyPaid(emp)) {
      return false;
    }
    if (deptFilter && emp.department !== deptFilter) {
      return false;
    }
    if (hoursFilter && String(emp.weeklyHours) !== String(hoursFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = emp.name.toLowerCase().includes(q);
      const matchDept = emp.department.toLowerCase().includes(q);
      if (!matchName && !matchDept) return false;
    }
    return true;
  });

  const isAllFilteredSelected =
    filteredEmployees.length > 0 && filteredEmployees.every((e) => selectedEmpIds.includes(e.id));

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredEmployees.map((e) => e.id);
    if (isAllFilteredSelected) {
      setSelectedEmpIds(selectedEmpIds.filter((id) => !filteredIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedEmpIds, ...filteredIds]));
      setSelectedEmpIds(combined);
    }
  };

  // Step 2 Submit: Persist Payrun with only checked employees
  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      setError('You must select at least one employee to create a payrun.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/payruns', {
        name,
        salaryStructureId,
        periodStart,
        periodEnd,
        employeeIds: selectedEmpIds
      });

      onSuccess(res.data.data?.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payrun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'New Pay Run — Step 1: Define Scope' : 'New Pay Run — Step 2: Select Employees'}
      subtitle={
        step === 1
          ? 'Select salary structure and payroll period. This step does not save any records.'
          : `Confirm which of the ${filteredEmployees.length} eligible records to include in this run.`
      }
      maxWidth={step === 1 ? 'md' : '2xl'}
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Stepper indicator */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className={`flex items-center gap-2 text-xs font-semibold ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary text-muted-foreground'}`}>
            1
          </span>
          <span>Period & Structure</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary text-muted-foreground'}`}>
            2
          </span>
          <span>Select Eligible Records</span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleContinueToStep2} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Pay Run Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Salary Structure
            </label>
            <select
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                Period Start Date
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                Period End Date
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Finding Records...' : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Step 2 Employee Selection */
        <div className="space-y-4 font-sans">
          {/* Step 2 Filter Bar */}
          <div className="space-y-3 bg-secondary/50 p-3 rounded-lg border border-border">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name or department..."
                  className="w-full bg-background border border-input rounded-md py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full sm:w-auto bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Weekly Target Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0 font-mono">Target:</span>
                <select
                  value={hoursFilter}
                  onChange={(e) => setHoursFilter(e.target.value)}
                  className="w-full sm:w-auto bg-background border border-input rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                >
                  <option value="">All Targets</option>
                  {uniqueHours.map((h) => (
                    <option key={String(h)} value={String(h)}>{h}h/week</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Already Paid Toggle */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={hideAlreadyPaid}
                  onChange={(e) => setHideAlreadyPaid(e.target.checked)}
                  className="rounded border-input text-primary"
                />
                <span>Hide already paid / processed employees</span>
              </label>

              <div className="text-[11px] font-mono text-muted-foreground">
                Showing <span className="font-bold text-foreground">{filteredEmployees.length}</span> of {eligibleEmployees.length} eligible
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-muted-foreground font-medium">
              <span className="font-bold text-foreground">{selectedEmpIds.length}</span> employees selected for pay run
            </span>
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="text-xs text-primary hover:underline font-medium"
            >
              {isAllFilteredSelected ? 'Deselect Visible' : 'Select All Visible'}
            </button>
          </div>

          {/* Table */}
          <div className="rounded-md border border-border overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-bold border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 w-8"></th>
                  <th className="px-4 py-2.5">Employee</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Wage / Mo</th>
                  <th className="px-4 py-2.5">Weekly Target</th>
                  <th className="px-4 py-2.5">Warning Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                      No employees match the selected department, weekly target, or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isChecked = selectedEmpIds.includes(emp.id);
                    const isPaid = checkIsAlreadyPaid(emp);

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => toggleSelectEmployee(emp.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? 'bg-secondary' : 'hover:bg-secondary/40'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-input text-primary"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-foreground">
                          {emp.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{emp.department}</td>
                        <td className="px-4 py-3 font-mono font-bold text-foreground">
                          {formatCurrency(emp.wagePerMonth)}
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {emp.weeklyHours}h
                        </td>
                        <td className="px-4 py-3">
                          {emp.hasWarning ? (
                            <div className={`flex items-center gap-1 text-[11px] ${
                              isPaid ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[180px]">{emp.warnings[0]}</span>
                            </div>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
                              <Check className="w-3.5 h-3.5" />
                              Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleCreatePayrun}
              disabled={loading || selectedEmpIds.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Payrun...' : `Create Payrun (${selectedEmpIds.length} Employees)`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
