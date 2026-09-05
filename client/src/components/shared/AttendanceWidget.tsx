import React from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { formatDuration } from '../../lib/formatters';
import { Clock, Play, Square, X, Calendar } from 'lucide-react';

export const AttendanceWidget: React.FC = () => {
  const { user } = useAuth();
  const {
    isCheckedIn,
    elapsedSeconds,
    todayHours,
    isWidgetOpen,
    setIsWidgetOpen,
    toggleCheckIn
  } = useAttendance();

  if (!isWidgetOpen) return null;

  return (
    <div className="fixed top-16 right-6 z-50 w-80 bg-card text-card-foreground border border-border rounded-xl shadow-2xl backdrop-blur-xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 live-dot' : 'bg-muted-foreground'}`} />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Punch Clock
          </span>
        </div>
        <button
          onClick={() => setIsWidgetOpen(false)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">Welcome back,</p>
        <h4 className="font-serif text-sm font-bold text-foreground mt-0.5 truncate">
          {user?.employee?.name || user?.email}
        </h4>

        {/* Live Elapsed Time Readout */}
        <div className="mt-4 p-4 rounded-lg bg-secondary border border-border">
          <div className="text-3xl font-bold tracking-wider text-foreground font-mono">
            {isCheckedIn ? formatDuration(elapsedSeconds) : '00:00:00'}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground mt-1 block">
            {isCheckedIn ? 'Session in progress' : 'No active session'}
          </span>
        </div>

        {/* Big Check In / Check Out Toggle Button */}
        <button
          onClick={toggleCheckIn}
          className={`w-full mt-4 py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            isCheckedIn
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Today Logged:</span>
        </div>
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {todayHours.toFixed(1)} hrs
        </span>
      </div>
    </div>
  );
};
