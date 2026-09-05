import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractToEdit?: any | null;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contractToEdit
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wagePerMonth, setWagePerMonth] = useState('');
  const [status, setStatus] = useState('running');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [workingScheduleId, setWorkingScheduleId] = useState('');

  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/employees').then((res) => setEmployees(res.data.data || [])).catch(console.error);
      apiClient.get('/salary-config/structures').then((res) => setStructures(res.data.data || [])).catch(console.error);
      apiClient.get('/schedules').then((res) => setSchedules(res.data.data || [])).catch(console.error);

      if (contractToEdit) {
        setEmployeeId(contractToEdit.employeeId || '');
        setStartDate(contractToEdit.startDate ? contractToEdit.startDate.split('T')[0] : '');
        setEndDate(contractToEdit.endDate ? contractToEdit.endDate.split('T')[0] : '');
        setWagePerMonth(String(contractToEdit.wagePerMonth || ''));
        setStatus(contractToEdit.status || 'running');
        setSalaryStructureId(contractToEdit.salaryStructureId || '');
        setWorkingScheduleId(contractToEdit.workingScheduleId || '');
      } else {
        setEmployeeId('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate('');
        setWagePerMonth('');
        setStatus('running');
        setSalaryStructureId('');
        setWorkingScheduleId('');
      }
      setError(null);
    }
  }, [isOpen, contractToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      employeeId,
      startDate,
      endDate: endDate || null,
      wagePerMonth: Number(wagePerMonth),
      status,
      salaryStructureId: salaryStructureId || null,
      workingScheduleId: workingScheduleId || null
    };

    try {
      if (contractToEdit) {
        await apiClient.patch(`/contracts/${contractToEdit.id}`, payload);
      } else {
        await apiClient.post('/contracts', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save contract.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contractToEdit ? 'Edit Employment Contract' : 'Create Employment Contract'}
      subtitle="Defines payroll wage baseline, salary structure calculation, and schedule terms"
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
            Employee
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            disabled={!!contractToEdit}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 disabled:opacity-50"
            required
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Monthly Wage ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={wagePerMonth}
              onChange={(e) => setWagePerMonth(e.target.value)}
              placeholder="e.g. 7500.00"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Contract Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="running">Running (Active)</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Salary Structure
            </label>
            <select
              value={salaryStructureId}
              onChange={(e) => setSalaryStructureId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Default Structure --</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Working Schedule
            </label>
            <select
              value={workingScheduleId}
              onChange={(e) => setWorkingScheduleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">-- Match Employee Schedule --</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Validating...' : contractToEdit ? 'Save Changes' : 'Create Contract'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
