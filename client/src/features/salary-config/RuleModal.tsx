import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ruleToEdit?: any | null;
}

export const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ruleToEdit
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('allowance');
  const [sequence, setSequence] = useState('10');
  const [computationMethod, setComputationMethod] = useState('percentage');
  const [amount, setAmount] = useState('');
  const [percentageOf, setPercentageOf] = useState('BASIC');
  const [formula, setFormula] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (ruleToEdit) {
        setName(ruleToEdit.name || '');
        setCode(ruleToEdit.code || '');
        setCategory(ruleToEdit.category || 'allowance');
        setSequence(String(ruleToEdit.sequence || 10));
        setComputationMethod(ruleToEdit.computationMethod || 'fixed');
        setAmount(ruleToEdit.amount !== null && ruleToEdit.amount !== undefined ? String(ruleToEdit.amount) : '');
        setPercentageOf(ruleToEdit.percentageOf || 'BASIC');
        setFormula(ruleToEdit.formula || '');
      } else {
        setName('');
        setCode('');
        setCategory('allowance');
        setSequence('50');
        setComputationMethod('percentage');
        setAmount('10');
        setPercentageOf('BASIC');
        setFormula('');
      }
      setError(null);
    }
  }, [isOpen, ruleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name,
      code: code.toUpperCase().trim(),
      category,
      sequence: Number(sequence),
      computationMethod,
      amount: amount ? Number(amount) : null,
      percentageOf: computationMethod === 'percentage' ? percentageOf : null,
      formula: computationMethod === 'formula' ? formula : null
    };

    try {
      if (ruleToEdit) {
        await apiClient.patch(`/salary-config/rules/${ruleToEdit.id}`, payload);
      } else {
        await apiClient.post('/salary-config/rules', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save salary rule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ruleToEdit ? 'Edit Salary Rule' : 'Create Salary Rule'}
      subtitle="Defines sequenced payroll calculation. Rules run strictly in sequence order."
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Travel Allowance"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Code (Unique)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. TRAV"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono uppercase"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="basic">Basic</option>
              <option value="allowance">Allowance</option>
              <option value="gross">Gross</option>
              <option value="deduction">Deduction</option>
              <option value="net">Net</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Sequence (Order)
            </label>
            <input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
            Computation Method
          </label>
          <select
            value={computationMethod}
            onChange={(e) => setComputationMethod(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="fixed">Fixed Amount</option>
            <option value="percentage">Percentage</option>
            <option value="formula">Custom Expression / Formula</option>
          </select>
        </div>

        {computationMethod === 'fixed' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Fixed Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 250.00"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              required
            />
          </div>
        )}

        {computationMethod === 'percentage' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 40"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Percentage Of
              </label>
              <select
                value={percentageOf}
                onChange={(e) => setPercentageOf(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              >
                <option value="WAGE">WAGE (Contract Base)</option>
                <option value="BASIC">BASIC (Basic Salary)</option>
                <option value="GROSS">GROSS (Gross Salary)</option>
              </select>
            </div>
          </div>
        )}

        {computationMethod === 'formula' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Formula Expression
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. BASIC * 0.12 or GROSS * 0.10"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              required
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Available variables: WAGE, BASIC, HRA, GROSS, PF, WORKED_DAYS, TOTAL_DAYS
            </span>
          </div>
        )}

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
            {loading ? 'Saving...' : ruleToEdit ? 'Save Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
