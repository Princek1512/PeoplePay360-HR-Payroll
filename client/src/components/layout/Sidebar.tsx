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
  const { can, hasRole, user } = useAuth();

  const isManagerOrAdmin = user?.roles?.some((r) =>
    ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'].includes(r)
  );

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
          show: isManagerOrAdmin && can('employees', 'read')
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
    <aside className="w-64 bg-card text-card-foreground border-r border-border flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-border bg-card">
        <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-lg shadow-sm">
          360
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5 font-serif">
            PeoplePay<span className="text-primary opacity-80">360</span>
          </h1>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase block">
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
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </div>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <item.icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive ? 'opacity-100 text-primary-foreground' : 'text-muted-foreground'
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
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
          <span>System Connected & Operational</span>
        </div>
      </div>
    </aside>
  );
};
