import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/apiClient';
import { ScheduleModal } from './ScheduleModal';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Plus, Edit2, Trash2 } from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatWorkingDays(lines?: any[]) {
  if (!lines || lines.length === 0) return 'Mon-Fri';
  const dayNums = lines.map((l: any) => l.dayOfWeek).sort((a: number, b: number) => a - b);
  if (dayNums.length === 5 && dayNums.every((d: number, idx: number) => d === idx + 1)) {
    return 'Mon-Fri';
  }
  return dayNums.map((d: number) => DAY_NAMES[d]).join(', ');
}

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

  const handleCreate = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleDelete = async (schedule: any) => {
    if (!window.confirm(`Are you sure you want to delete the schedule "${schedule.name}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/schedules/${schedule.id}`);
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete schedule.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight">Working Schedules</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Weekly working calendars. Weekly hours are automatically calculated and customizable per shift line.
          </p>
        </div>

        {can('schedules', 'create') && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-secondary text-muted-foreground uppercase tracking-wider text-[10px] font-bold border-b border-border">
              <tr>
                <th className="px-6 py-3.5">Schedule Name</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Working Days</th>
                <th className="px-6 py-3.5">Weekly Hours</th>
                <th className="px-6 py-3.5">Assigned Employees</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    Loading schedules...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No working schedules configured.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const isActive = s.status === 'active' || s.isActive;
                  const calendarTypeLabel = (s.calendarType || s.type || 'standard').replace('_', ' ');

                  return (
                    <tr key={s.id} className="hover:bg-secondary/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        {s.name}
                      </td>
                      <td className="px-6 py-4 capitalize text-foreground">
                        {calendarTypeLabel}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatWorkingDays(s.lines)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {Number(s.totalWeeklyHours).toFixed(1)} hrs/wk
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground font-semibold">
                        {s.employeesCount ?? 0} staff
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                      {can('schedules', 'update') && (
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          title="Edit Schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {can('schedules', 'delete') && (
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSchedules}
        scheduleToEdit={editingSchedule}
      />
    </div>
  );
};
