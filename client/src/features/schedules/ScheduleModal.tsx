import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scheduleToEdit?: any | null;
}

interface LineState {
  dayOfWeek: number;
  dayName: string;
  active: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

const DEFAULT_DAYS = [
  { dayOfWeek: 1, dayName: 'Monday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 2, dayName: 'Tuesday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 3, dayName: 'Wednesday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 4, dayName: 'Thursday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 5, dayName: 'Friday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 6, dayName: 'Saturday', active: false, startTime: '09:00', endTime: '14:00', breakMinutes: 0 },
  { dayOfWeek: 0, dayName: 'Sunday', active: false, startTime: '09:00', endTime: '14:00', breakMinutes: 0 },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scheduleToEdit
}) => {
  const [name, setName] = useState('');
  const [calendarType, setCalendarType] = useState('standard');
  const [days, setDays] = useState<LineState[]>(DEFAULT_DAYS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setName(scheduleToEdit.name || '');
        setCalendarType(scheduleToEdit.calendarType || 'standard');

        // Populate days from lines
        const mapped = DEFAULT_DAYS.map((d) => {
          const line = scheduleToEdit.lines?.find((l: any) => l.dayOfWeek === d.dayOfWeek);
          if (line) {
            return {
              ...d,
              active: true,
              startTime: line.startTime,
              endTime: line.endTime,
              breakMinutes: line.breakMinutes
            };
          }
          return { ...d, active: false };
        });
        setDays(mapped);
      } else {
        setName('');
        setCalendarType('standard');
        setDays(DEFAULT_DAYS);
      }
      setError(null);
    }
  }, [isOpen, scheduleToEdit]);

  // Real-time weekly hours calculation
  const computedTotalWeeklyHours = React.useMemo(() => {
    let totalMinutes = 0;
    days.filter((d) => d.active).forEach((d) => {
      const [startH, startM] = d.startTime.split(':').map(Number);
      const [endH, endM] = d.endTime.split(':').map(Number);
      const diff = Math.max(0, (endH * 60 + endM) - (startH * 60 + startM));
      totalMinutes += Math.max(0, diff - (d.breakMinutes || 0));
    });
    return Math.round(((totalMinutes / 60) + Number.EPSILON) * 100) / 100;
  }, [days]);

  const updateDay = (dayOfWeek: number, field: keyof LineState, value: any) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const activeLines = days
      .filter((d) => d.active)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        breakMinutes: Number(d.breakMinutes)
      }));

    const payload = {
      name,
      calendarType,
      lines: activeLines
    };

    try {
      if (scheduleToEdit) {
        await apiClient.patch(`/schedules/${scheduleToEdit.id}`, payload);
      } else {
        await apiClient.post('/schedules', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save working schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={scheduleToEdit ? 'Edit Working Schedule' : 'Create Working Schedule'}
      subtitle="Define daily shift lines. Total weekly hours are automatically computed from schedule lines."
      maxWidth="2xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Schedule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard 40h Work Week"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Calendar Type
            </label>
            <select
              value={calendarType}
              onChange={(e) => setCalendarType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              <option value="standard">Standard Full-Time</option>
              <option value="flexible">Flexible / Remote</option>
              <option value="part_time">Part-Time</option>
            </select>
          </div>
        </div>

        {/* Live derived hours readout banner */}
        <div className="p-4 rounded-xl bg-brand-950/40 border border-brand-800/40 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">
            Total Auto-Derived Weekly Hours:
          </span>
          <span className="text-lg font-bold text-brand-400 font-mono">
            {computedTotalWeeklyHours} hrs / week
          </span>
        </div>

        {/* Weekly Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Weekly Shift Grid & Breaks
          </label>
          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Working Day</th>
                  <th className="px-4 py-2.5">Start Time</th>
                  <th className="px-4 py-2.5">End Time</th>
                  <th className="px-4 py-2.5">Break (Mins)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {days.map((d) => (
                  <tr key={d.dayOfWeek} className={d.active ? '' : 'opacity-40'}>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'active', e.target.checked)}
                        className="rounded border-slate-700 text-brand-600"
                      />
                      <span className="font-semibold text-white">{d.dayName}</span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        value={d.startTime}
                        disabled={!d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'startTime', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        value={d.endTime}
                        disabled={!d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'endTime', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={d.breakMinutes}
                        disabled={!d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'breakMinutes', Number(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            {loading ? 'Saving...' : scheduleToEdit ? 'Save Schedule' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
