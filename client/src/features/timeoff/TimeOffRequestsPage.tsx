import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/formatters';
import { TimeOffRequestModal } from './TimeOffRequestModal';
import { useAuth } from '../../context/AuthContext';
import { PlaneTakeoff, Plus, CheckCircle2, XCircle, Filter, Calendar } from 'lucide-react';

export const TimeOffRequestsPage: React.FC = () => {
  const { can } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/timeoff/requests', {
        params: { status: statusFilter || undefined }
      });
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoadingId(id);
      await apiClient.patch(`/timeoff/requests/${id}/approve`);
      await fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefuse = async (id: string) => {
    try {
      setActionLoadingId(id);
      await apiClient.patch(`/timeoff/requests/${id}/refuse`);
      await fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to refuse request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Time Off Requests</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Leave approval workflow. Approving a request atomically decrements the matching employee allocation balance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
        >
          <option value="">All Requests</option>
          <option value="submitted">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="refused">Refused</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Time Off Type</th>
                <th className="px-6 py-3.5">Date Window</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Reason / Notes</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No time off requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const isPending = r.status === 'submitted' || r.status === 'draft';
                  const isActing = actionLoadingId === r.id;

                  return (
                    <tr key={r.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{r.employee?.name}</div>
                        <div className="text-[11px] text-slate-400">{r.employee?.department?.name || 'Staff'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {r.timeOffType?.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {formatDate(r.startDate)} <span className="text-slate-500">➔</span> {formatDate(r.endDate)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-brand-400 text-sm">
                        {Number(r.durationAmount)} {r.timeOffType?.unit || 'days'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 italic max-w-xs truncate">
                        {r.reason || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {can('timeoff', 'approve') && isPending ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={isActing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRefuse(r.id)}
                              disabled={isActing}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refuse</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">
                            {r.status === 'approved' ? 'Processed' : 'Closed'}
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
      </div>

      <TimeOffRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
};
