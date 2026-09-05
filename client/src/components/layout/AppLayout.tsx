import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { AttendanceWidget } from '../shared/AttendanceWidget';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Attendance popup */}
      <AttendanceWidget />
    </div>
  );
};
