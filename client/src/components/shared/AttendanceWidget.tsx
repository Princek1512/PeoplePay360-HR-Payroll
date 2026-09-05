import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatDuration } from '../../lib/formatters';
import { Clock, Play, Square, X, Calendar, CheckCircle2 } from 'lucide-react';

export const AttendanceWidget: React.FC = () => {
  const { user } = useAuth();
  const {
    isCheckedIn,
    activeSession,
    elapsedSeconds,
    todayHours,
    isWidgetOpen,
    setIsWidgetOpen,
    toggleCheckIn
  } = useAttendance();

  if (!isWidgetOpen) return null;

  return (
    <div className="fixed top-16 right-6 z-50 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 live-dot' : 'bg-slate-500'}`} />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Attendance Widget
          </span>
        </div>
        <button
          onClick={() => setIsWidgetOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-4 text-center">
        <p className="text-xs text-slate-400">Welcome back,</p>
        <h4 className="text-sm font-bold text-white mt-0.5 truncate">
          {user?.employee?.name || user?.email}
        </h4>

        {/* Live Elapsed Time Readout */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="text-3xl font-black tracking-wider text-white font-mono">
            {isCheckedIn ? formatDuration(elapsedSeconds) : '00:00:00'}
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-1 block">
            {isCheckedIn ? 'Session in progress' : 'No active session'}
          </span>
        </div>

        {/* Big Check In / Check Out Toggle Button */}
        <button
          onClick={toggleCheckIn}
          className={`w-full mt-4 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            isCheckedIn
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
          }`}
        >
          {isCheckedIn ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              Check Out Now
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Check In Now
            </>
          )}
        </button>
      </div>

      {/* Today summary row */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Today Logged:</span>
        </div>
        <span className="font-mono font-semibold text-emerald-400">
          {todayHours.toFixed(1)} hrs
        </span>
      </div>
    </div>
  );
};
