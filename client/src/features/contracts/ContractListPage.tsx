import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ContractModal } from './ContractModal';
import { useAuth } from '../../context/AuthContext';
import { FileSignature, Plus, Search, Edit2, AlertCircle } from 'lucide-react';

export const ContractListPage: React.FC = () => {
  const { can } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any | null>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/contracts');
      setContracts(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingContract(null);
    setIsModalOpen(true);
  };

  const filtered = contracts.filter((c) =>
    c.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.employee?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Employment Contracts</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active wage baselines, salary structures, and schedule attachments. (Max 1 running contract per active period)
          </p>
        </div>

        {can('contracts', 'create') && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter contracts by employee..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Wage / Month</th>
                <th className="px-6 py-3.5">Validity Range</th>
                <th className="px-6 py-3.5">Structure & Schedule</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    Loading contracts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    No contracts found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const isRunning = c.status === 'running';

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        isRunning
                          ? 'bg-brand-950/15 hover:bg-brand-950/25'
                          : 'hover:bg-slate-850/40 text-slate-400'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          {isRunning && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" title="Active Running Contract" />
                          )}
                          <span>{c.employee?.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.employee?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-base text-white">
                        {formatCurrency(c.wagePerMonth)}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {formatDate(c.startDate)} <span className="text-slate-500">➔</span> {c.endDate ? formatDate(c.endDate) : 'Indefinite'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{c.salaryStructure?.name || 'Default'}</div>
                        <div className="text-[11px] text-slate-500">{c.workingSchedule?.name || 'Standard 40h'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {can('contracts', 'update') && (
                          <button
                            onClick={() => handleEdit(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchContracts}
        contractToEdit={editingContract}
      />
    </div>
  );
};
