import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileSignature,
  CalendarDays,
  Clock,
  PlaneTakeoff,
  CircleDollarSign,
  ReceiptText,
  SlidersHorizontal,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { can, hasRole } = useAuth();

  const navGroups = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          to: '/dashboard',
          icon: LayoutDashboard,
          show: can('dashboard', 'read')
        }
      ]
    },
    {
      title: 'Workforce',
      items: [
        {
          name: 'Employees',
          to: '/employees',
          icon: Users,
          show: can('employees', 'read')
        },
        {
          name: 'Contracts',
          to: '/contracts',
          icon: FileSignature,
          show: can('contracts', 'read')
        },
        {
          name: 'Working Schedules',
          to: '/schedules',
          icon: CalendarDays,
          show: can('schedules', 'read')
        }
      ]
    },
    {
      title: 'Time & Attendance',
      items: [
        {
          name: 'Attendance',
          to: '/attendance',
          icon: Clock,
          show: can('attendance', 'read')
        },
        {
          name: 'Time Off',
          to: '/timeoff',
          icon: PlaneTakeoff,
          show: can('timeoff', 'read')
        }
      ]
    },
    {
      title: 'Payroll Management',
      items: [
        {
          name: 'Payruns',
          to: '/payruns',
          icon: CircleDollarSign,
          show: can('payruns', 'read')
        },
        {
          name: 'Payslips',
          to: '/payslips',
          icon: ReceiptText,
          show: can('payslips', 'read')
        },
        {
          name: 'Salary Config',
          to: '/salary-config',
          icon: SlidersHorizontal,
          show: can('salaryStructures', 'read')
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          name: 'User Management',
          to: '/users',
          icon: ShieldCheck,
          show: hasRole('Admin')
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-900/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-brand-500/20">
          360
        </div>
        <div>
          <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 font-mono">
            PeoplePay<span className="text-brand-400">360</span>
          </h1>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
            HR & Payroll Platform
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <item.icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive ? 'opacity-100 text-brand-200' : 'text-slate-400'
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer system status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
          <span>System Connected & Operational</span>
        </div>
      </div>
    </aside>
  );
};
