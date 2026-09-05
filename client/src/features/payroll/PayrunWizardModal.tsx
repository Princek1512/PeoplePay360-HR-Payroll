import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { CircleDollarSign, Users, AlertTriangle, ArrowRight, ArrowLeft, Check } from 'lucide-react';

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

  // Step 2 Employee Selection
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
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
      setError(null);
    }
  }, [isOpen]);

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

      // Select all by default
      setSelectedEmpIds(employees.map((e: any) => e.id));
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

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e.id));
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
          : `Confirm which of the ${eligibleEmployees.length} eligible contract holders to include in this run.`
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
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-muted-foreground font-medium">
              {selectedEmpIds.length} of {eligibleEmployees.length} employees selected
            </span>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs text-primary hover:underline font-medium"
            >
              {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
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
                {eligibleEmployees.map((emp) => {
                  const isChecked = selectedEmpIds.includes(emp.id);

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
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">{emp.warnings[0]}</span>
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
                })}
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
