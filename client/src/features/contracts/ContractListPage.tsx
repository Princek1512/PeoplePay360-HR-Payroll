import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ContractModal } from './ContractModal';
import { useAuth } from '../../context/AuthContext';
import { FileSignature, Plus, Search, Edit2 } from 'lucide-react';

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

  const handleCreate = () => {
    setEditingContract(null);
    setIsModalOpen(true);
  };

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setIsModalOpen(true);
  };

  const filtered = contracts.filter((c) =>
    c.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.salaryStructure?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Employment Contracts</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Active wage baselines, salary structures, and schedule attachments. (Max 1 running contract per active period)
          </p>
        </div>

        {can('contracts', 'create') && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter contracts by employee..."
          className="w-full bg-background border border-input rounded-md py-1.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Wage / Month</th>
                <th className="px-6 py-3.5">Validity Range</th>
                <th className="px-6 py-3.5">Structure & Schedule</th>
                <th className="px-6 py-3.5">Status</th>
                {can('contracts', 'update') && (
                  <th className="px-6 py-3.5 text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    Loading contracts...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No employment contracts found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-secondary/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      {c.employee?.name}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                      {formatCurrency(c.wagePerMonth)}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {formatDate(c.startDate)} — {c.endDate ? formatDate(c.endDate) : 'Indefinite'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{c.salaryStructure?.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.workingSchedule?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    {can('contracts', 'update') && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Edit Contract"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
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
