import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { useAuth } from './AuthContext';

interface AttendanceContextType {
  isCheckedIn: boolean;
  activeSession: any | null;
  elapsedSeconds: number;
  todayHours: number;
  isWidgetOpen: boolean;
  toggleWidget: () => void;
  setIsWidgetOpen: (open: boolean) => void;
  toggleCheckIn: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [todayHours, setTodayHours] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);

  const refreshStatus = useCallback(async () => {
    if (!isAuthenticated || !user?.employeeId) return;
    try {
      const res = await apiClient.get('/attendance/status');
      const data = res.data.data;
      setIsCheckedIn(data.isCheckedIn);
      setActiveSession(data.activeSession);
      setTodayHours(data.todayHours || 0);

      if (data.isCheckedIn && data.activeSession?.checkIn) {
        const checkInTime = new Date(data.activeSession.checkIn).getTime();
        const diff = Math.floor((Date.now() - checkInTime) / 1000);
        setElapsedSeconds(Math.max(0, diff));
      } else {
        setElapsedSeconds(0);
      }
    } catch (err) {
      // Ignore if user has no employee profile
    }
  }, [isAuthenticated, user?.employeeId]);

  // Initial load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Real-time ticking timer when checked in
  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn && activeSession?.checkIn) {
      interval = setInterval(() => {
        const checkInTime = new Date(activeSession.checkIn).getTime();
        const diff = Math.floor((Date.now() - checkInTime) / 1000);
        setElapsedSeconds(Math.max(0, diff));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, activeSession]);

  const toggleCheckIn = async () => {
    try {
      await apiClient.post('/attendance/toggle');
      await refreshStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error toggling attendance status.');
    }
  };

  const toggleWidget = () => setIsWidgetOpen((prev) => !prev);

  return (
    <AttendanceContext.Provider
      value={{
        isCheckedIn,
        activeSession,
        elapsedSeconds,
        todayHours,
        isWidgetOpen,
        toggleWidget,
        setIsWidgetOpen,
        toggleCheckIn,
        refreshStatus
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
