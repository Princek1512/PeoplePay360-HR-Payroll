import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Clock, LogOut, Bell, Shield, User, Building } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const { isCheckedIn, toggleWidget } = useAttendance();

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left side: Context badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
          <Building className="w-3.5 h-3.5 text-brand-400" />
          <span>PeoplePay360 Global Corp</span>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4">
        {/* Attendance Widget Trigger (Clock Icon) */}
        <button
          type="button"
          onClick={toggleWidget}
          title="Toggle Attendance Widget"
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-brand-500/50 text-slate-200 text-xs font-semibold transition-all shadow-sm"
        >
          <Clock className="w-4 h-4 text-brand-400" />
          <span>Attendance</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isCheckedIn ? 'bg-emerald-500 live-dot' : 'bg-slate-500'
            }`}
          />
        </button>

        {/* Current Active Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide uppercase font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>{primaryRole}</span>
        </div>

        {/* User profile dropdown & logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-2.5">
            {user?.employee?.avatarUrl ? (
              <img
                src={user.employee.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                {user?.employee?.name || user?.email}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
