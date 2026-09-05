import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ScheduleModal } from './ScheduleModal';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Plus, Edit2 } from 'lucide-react';

export const ScheduleListPage: React.FC = () => {
  const { can } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/schedules');
      setSchedules(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Working Schedules</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Weekly working calendars. Weekly hours are derived strictly from shift lines (never typed by hand).
          </p>
        </div>

        {can('schedules', 'create') && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Schedule Name</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Working Days</th>
                <th className="px-6 py-3.5">Derived Weekly Hours</th>
                <th className="px-6 py-3.5">Assigned Employees</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Loading schedules...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    No working schedules configured.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-300">
                      {s.calendarType}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {s.lines?.length || 0} days / week
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand-400 text-sm">
                      {Number(s.totalWeeklyHours).toFixed(1)} hrs
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {s._count?.employees || 0} employees
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {can('schedules', 'update') && (
                        <button
                          onClick={() => handleEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
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

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSchedules}
        scheduleToEdit={editingSchedule}
      />
    </div>
  );
};
