import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDateTime } from '../../lib/formatters';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Clock, Edit2, Play, Square, Filter, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export const AttendanceListPage: React.FC = () => {
  const { can } = useAuth();
  const { isCheckedIn, toggleCheckIn } = useAttendance();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance', {
        params: { status: statusFilter || undefined }
      });
      setRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter]);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Attendance & Work Logs</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time punch records, calculated worked hours, exception flags, and manual HR adjustments
          </p>
        </div>

        {/* Quick Check-in/out button */}
        <button
          onClick={toggleCheckIn}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
            isCheckedIn
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
          }`}
        >
          {isCheckedIn ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Punch Out</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Punch In</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Logs</option>
            <option value="normal">Normal Attendance</option>
            <option value="exception">Exceptions / Adjustments</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Check-In</th>
                <th className="px-6 py-3.5">Check-Out</th>
                <th className="px-6 py-3.5">Worked Hours</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Correction Audit</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{r.employee?.name}</div>
                      <div className="text-[11px] text-slate-400">{r.employee?.department?.name || 'Staff'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {formatDateTime(r.checkIn)}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {r.checkOut ? (
                        formatDateTime(r.checkOut)
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
                          Active Now
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                      {r.workedHours ? `${Number(r.workedHours).toFixed(1)} hrs` : 'In Progress'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {r.correctedBy ? (
                        <div>
                          <span className="text-amber-400 font-medium">Modified by {r.correctedBy.email}</span>
                          <span className="block text-[10px] text-slate-500 font-mono">
                            {formatDateTime(r.correctedAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {can('attendance', 'update') && (
                        <button
                          onClick={() => handleEdit(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AttendanceCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAttendance}
        recordToEdit={editingRecord}
      />
    </div>
  );
};
