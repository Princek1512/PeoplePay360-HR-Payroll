import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { formatDate } from '../../lib/formatters';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Clock, Filter, Edit2, Play, Square } from 'lucide-react';

export const AttendanceListPage: React.FC = () => {
  const { can } = useAuth();
  const { isCheckedIn, toggleCheckIn, lastPunchTimestamp } = useAttendance();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);

  const fetchRecords = async () => {
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
    fetchRecords();
  }, [statusFilter, lastPunchTimestamp]);

  const handleCorrect = (record: any) => {
    setSelectedRecord(record);
    setIsCorrectionOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Time & Attendance</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time biometric punch logs, hours worked, and audited corrections.
          </p>
        </div>

        {/* Global check in/out action */}
        <button
          onClick={toggleCheckIn}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium shadow-sm transition-all ${
            isCheckedIn
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white'
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
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-input rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Logs</option>
            <option value="normal">Normal Attendance</option>
            <option value="exception">Exceptions / Adjustments</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
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
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No attendance records logged.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const checkIn = new Date(r.checkIn);
                  const checkOut = r.checkOut ? new Date(r.checkOut) : null;
                  const isException = r.status === 'exception';

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-secondary/60 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-foreground">
                        {r.employee?.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {formatDate(checkIn)} {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">
                        {checkOut
                          ? `${formatDate(checkOut)} ${checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Active Session</span>
                        }
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {r.workedHours != null ? `${Number(r.workedHours).toFixed(1)} hrs` : 'In progress'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          isException
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {r.correctionNote ? (
                          <div className="max-w-[200px] truncate" title={r.correctionNote}>
                            {r.correctionNote}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {can('attendance', 'update') && (
                          <button
                            onClick={() => handleCorrect(r)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Audited Correction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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

      <AttendanceCorrectionModal
        isOpen={isCorrectionOpen}
        onClose={() => setIsCorrectionOpen(false)}
        onSuccess={fetchRecords}
        attendance={selectedRecord}
      />
    </div>
  );
};
