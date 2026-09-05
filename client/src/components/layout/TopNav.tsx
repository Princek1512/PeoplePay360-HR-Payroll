import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { Clock, LogOut, Bell, Shield, User, Building } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { user, logout } = useAuth();
  const { isCheckedIn, toggleWidget } = useAttendance();

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <header className="h-16 bg-background/95 backdrop-blur border-b border-border sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left side: Context badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary border border-border text-xs font-medium text-muted-foreground">
          <Building className="w-3.5 h-3.5 text-primary" />
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
          className="relative flex items-center gap-2 px-3 py-1.5 rounded-md bg-background hover:bg-secondary border border-input text-foreground text-xs font-medium transition-colors shadow-sm"
        >
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>Attendance</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isCheckedIn ? 'bg-emerald-500 live-dot' : 'bg-muted-foreground/40'
            }`}
          />
        </button>

        {/* Current Active Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase font-mono">
          <Shield className="w-3.5 h-3.5" />
          <span>{primaryRole}</span>
        </div>

        {/* User profile dropdown & logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="flex items-center gap-2.5">
            {user?.employee?.avatarUrl ? (
              <img
                src={user.employee.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-foreground leading-tight truncate max-w-[140px]">
                {user?.employee?.name || user?.email}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
