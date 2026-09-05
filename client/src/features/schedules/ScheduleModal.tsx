import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';
import { Sparkles, Copy } from 'lucide-react';

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
  breakMinutes: number | string;
}

const DEFAULT_DAYS: LineState[] = [
  { dayOfWeek: 1, dayName: 'Monday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 2, dayName: 'Tuesday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 3, dayName: 'Wednesday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 4, dayName: 'Thursday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 5, dayName: 'Friday', active: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  { dayOfWeek: 6, dayName: 'Saturday', active: false, startTime: '09:00', endTime: '14:00', breakMinutes: '' },
  { dayOfWeek: 0, dayName: 'Sunday', active: false, startTime: '09:00', endTime: '14:00', breakMinutes: '' },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scheduleToEdit
}) => {
  const [name, setName] = useState('');
  const [calendarType, setCalendarType] = useState('standard');
  const [targetWeeklyHours, setTargetWeeklyHours] = useState<number | string>(40);
  const [days, setDays] = useState<LineState[]>(DEFAULT_DAYS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate end times from target weekly hours
  const autoAdjustShiftTimings = (targetHours: number, daysList: LineState[]): LineState[] => {
    const activeDays = daysList.filter((d) => d.active);
    if (activeDays.length === 0 || targetHours <= 0) return daysList;

    const dailyWorkMinutes = (targetHours * 60) / activeDays.length;

    return daysList.map((d) => {
      if (!d.active) return d;

      const [startH, startM] = (d.startTime || '09:00').split(':').map(Number);
      const startTotalMinutes = (startH || 9) * 60 + (startM || 0);
      const breakMins = Number(d.breakMinutes || 0);

      const endTotalMinutes = Math.min(1439, Math.round(startTotalMinutes + dailyWorkMinutes + breakMins));
      const endH = Math.floor(endTotalMinutes / 60);
      const endM = endTotalMinutes % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      return {
        ...d,
        endTime: endTimeStr
      };
    });
  };

  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setName(scheduleToEdit.name || '');
        setCalendarType(scheduleToEdit.calendarType || 'standard');
        const initialHours = scheduleToEdit.totalWeeklyHours ? Number(scheduleToEdit.totalWeeklyHours) : 40;
        setTargetWeeklyHours(initialHours);

        // Populate days from lines
        const mapped = DEFAULT_DAYS.map((d) => {
          const line = scheduleToEdit.lines?.find((l: any) => l.dayOfWeek === d.dayOfWeek);
          if (line) {
            return {
              ...d,
              active: true,
              startTime: line.startTime,
              endTime: line.endTime,
              breakMinutes: line.breakMinutes || (line.breakMinutes === 0 ? '' : '')
            };
          }
          return { ...d, active: false, breakMinutes: '' };
        });
        setDays(mapped);
      } else {
        setName('');
        setCalendarType('standard');
        setTargetWeeklyHours(40);
        setDays(autoAdjustShiftTimings(40, DEFAULT_DAYS));
      }
      setError(null);
    }
  }, [isOpen, scheduleToEdit]);

  // Real-time weekly hours calculation from shift lines
  const computedTotalWeeklyHours = React.useMemo(() => {
    let totalMinutes = 0;
    days.filter((d) => d.active).forEach((d) => {
      const [startH, startM] = d.startTime.split(':').map(Number);
      const [endH, endM] = d.endTime.split(':').map(Number);
      const diff = Math.max(0, (endH * 60 + endM) - (startH * 60 + startM));
      const bMins = Number(d.breakMinutes || 0);
      totalMinutes += Math.max(0, diff - bMins);
    });
    return Math.round(((totalMinutes / 60) + Number.EPSILON) * 100) / 100;
  }, [days]);

  // When target weekly hours change, recalculate shift end times
  const handleTargetHoursChange = (valStr: string) => {
    if (valStr === '') {
      setTargetWeeklyHours('');
      return;
    }
    const val = parseFloat(valStr);
    if (isNaN(val)) return;
    setTargetWeeklyHours(val);
    if (val > 0) {
      setDays((prev) => autoAdjustShiftTimings(val, prev));
    }
  };

  const updateDay = (dayOfWeek: number, field: keyof LineState, value: any) => {
    setDays((prev) => {
      const updated = prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d));
      // If toggling active day, auto-recalculate timings to fit target weekly hours
      const numHours = Number(targetWeeklyHours) || 40;
      if (field === 'active') {
        return autoAdjustShiftTimings(numHours, updated);
      }
      return updated;
    });
  };

  // Copy full row's shift timings (startTime, endTime, breakMinutes) to all active selected days
  const applyRowToAllActive = (sourceDayOfWeek: number) => {
    const source = days.find((d) => d.dayOfWeek === sourceDayOfWeek);
    if (!source) return;

    setDays((prev) =>
      prev.map((d) => {
        if (!d.active) return d;
        return {
          ...d,
          startTime: source.startTime,
          endTime: source.endTime,
          breakMinutes: source.breakMinutes
        };
      })
    );
  };

  // Copy a specific field from the first active day to all active selected days
  const applyFirstActiveField = (field: 'startTime' | 'endTime' | 'breakMinutes') => {
    const firstActive = days.find((d) => d.active);
    if (!firstActive) return;
    const val = firstActive[field];

    setDays((prev) =>
      prev.map((d) => {
        if (!d.active) return d;
        return { ...d, [field]: val };
      })
    );
  };

  const handleApplyAutoTimings = () => {
    const numHours = Number(targetWeeklyHours) || 40;
    setDays((prev) => autoAdjustShiftTimings(numHours, prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const numHours = Number(targetWeeklyHours);
    if (!targetWeeklyHours || isNaN(numHours) || numHours <= 0) {
      setError('Target weekly hours must be greater than zero (cannot be 0).');
      setLoading(false);
      return;
    }

    const activeLines = days
      .filter((d) => d.active)
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        breakMinutes: Number(d.breakMinutes || 0)
      }));

    if (activeLines.length === 0) {
      setError('Please select at least one active working day for this schedule.');
      setLoading(false);
      return;
    }

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
      subtitle="Configure target weekly hours and daily shift lines. Shift timings auto-calculate based on target hours."
      maxWidth="2xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Schedule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard 40h Work Week"
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Calendar Type
            </label>
            <select
              value={calendarType}
              onChange={(e) => setCalendarType(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="standard">Standard Full-Time</option>
              <option value="flexible">Flexible / Remote</option>
              <option value="part_time">Part-Time</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Target Weekly Hours
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                max="168"
                step="0.5"
                value={targetWeeklyHours}
                onChange={(e) => handleTargetHoursChange(e.target.value)}
                onBlur={() => {
                  if (!targetWeeklyHours || Number(targetWeeklyHours) <= 0) {
                    setTargetWeeklyHours(40);
                    setDays((prev) => autoAdjustShiftTimings(40, prev));
                  }
                }}
                placeholder="e.g. 40"
                className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">hrs/wk</span>
            </div>
          </div>
        </div>

        {/* Live derived hours readout banner & Auto-sync button */}
        <div className="p-4 rounded-md bg-secondary border border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">
              Calculated Total Shift Hours:
            </span>
            <span className="text-lg font-bold text-primary font-mono">
              {computedTotalWeeklyHours} hrs / week
            </span>
          </div>

          <button
            type="button"
            onClick={handleApplyAutoTimings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium border border-primary/30 transition-all"
            title="Recalculate shift end times based on target weekly hours"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Auto-Set Shift Timings</span>
          </button>
        </div>

        {/* Weekly Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Weekly Shift Grid & Breaks
          </label>

          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-left text-xs text-foreground">
              <thead className="bg-secondary text-muted-foreground uppercase text-[10px] font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Working Day</th>
                  <th className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span>Start Time</span>
                      <button
                        type="button"
                        onClick={() => applyFirstActiveField('startTime')}
                        className="text-[9px] font-semibold text-primary hover:underline lowercase normal-case tracking-normal"
                        title="Apply 1st active day's start time to all selected days"
                      >
                        Apply to All
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span>End Time</span>
                      <button
                        type="button"
                        onClick={() => applyFirstActiveField('endTime')}
                        className="text-[9px] font-semibold text-primary hover:underline lowercase normal-case tracking-normal"
                        title="Apply 1st active day's end time to all selected days"
                      >
                        Apply to All
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span>Break (Mins)</span>
                      <button
                        type="button"
                        onClick={() => applyFirstActiveField('breakMinutes')}
                        className="text-[9px] font-semibold text-primary hover:underline lowercase normal-case tracking-normal"
                        title="Apply 1st active day's break minutes to all selected days"
                      >
                        Apply to All
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right">Quick Apply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {days.map((d) => (
                  <tr key={d.dayOfWeek} className={d.active ? '' : 'opacity-40'}>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'active', e.target.checked)}
                        className="rounded border-input text-primary"
                      />
                      <span className="font-semibold text-foreground">{d.dayName}</span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        value={d.startTime}
                        disabled={!d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'startTime', e.target.value)}
                        className="bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground font-mono disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="time"
                        value={d.endTime}
                        disabled={!d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'endTime', e.target.value)}
                        className="bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground font-mono disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={d.breakMinutes === 0 || d.breakMinutes === '0' || d.breakMinutes === '' ? '' : d.breakMinutes}
                        disabled={!d.active}
                        onChange={(e) => updateDay(d.dayOfWeek, 'breakMinutes', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder=""
                        className="w-16 bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground font-mono disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {d.active && (
                        <button
                          type="button"
                          onClick={() => applyRowToAllActive(d.dayOfWeek)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary hover:bg-accent text-primary text-[10px] font-semibold border border-border transition-all"
                          title={`Copy ${d.dayName}'s shift timing (${d.startTime} - ${d.endTime}) to all selected active days`}
                        >
                          <Copy className="w-3 h-3 text-primary" />
                          <span>Apply to All Selected</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : scheduleToEdit ? 'Save Schedule' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
