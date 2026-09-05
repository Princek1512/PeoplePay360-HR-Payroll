import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployeeKanbanPage } from '../features/employees/EmployeeKanbanPage';
import { EmployeeDetailPage } from '../features/employees/EmployeeDetailPage';
import { ContractListPage } from '../features/contracts/ContractListPage';
import { ScheduleListPage } from '../features/schedules/ScheduleListPage';
import { AttendanceListPage } from '../features/attendance/AttendanceListPage';
import { TimeOffRequestsPage } from '../features/timeoff/TimeOffRequestsPage';
import { TimeOffAllocationsPage } from '../features/timeoff/TimeOffAllocationsPage';
import { PayrunListPage } from '../features/payroll/PayrunListPage';
import { PayrunDetailPage } from '../features/payroll/PayrunDetailPage';
import { PayslipListPage } from '../features/payroll/PayslipListPage';
import { PayslipDetailPage } from '../features/payroll/PayslipDetailPage';
import { RuleListPage } from '../features/salary-config/RuleListPage';
import { StructureListPage } from '../features/salary-config/StructureListPage';
import { UserManagementPage } from '../features/users/UserManagementPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ module?: string; action?: 'read' | 'create' | 'update' | 'delete' | 'approve'; adminOnly?: boolean }> = ({
  module,
  action = 'read',
  adminOnly = false
}) => {
  const { isAuthenticated, isLoading, can, hasRole, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-500 font-mono text-xs">Authenticating PeoplePay360 session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !hasRole('Admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (module && !can(module, action)) {
    // If regular employee tries to access dashboard or manager pages, redirect to their attendance/payslips
    if (user?.roles.length === 1 && user?.roles[0] === 'Employee') {
      return <Navigate to="/attendance" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.roles.length === 1 && user?.roles[0] === 'Employee') {
    return <Navigate to="/attendance" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <RootRedirect />
          },
          {
            path: 'dashboard',
            element: <DashboardPage />
          },
          {
            path: 'employees',
            element: <EmployeeKanbanPage />
          },
          {
            path: 'employees/:id',
            element: <EmployeeDetailPage />
          },
          {
            path: 'contracts',
            element: <ContractListPage />
          },
          {
            path: 'schedules',
            element: <ScheduleListPage />
          },
          {
            path: 'attendance',
            element: <AttendanceListPage />
          },
          {
            path: 'timeoff',
            element: <TimeOffRequestsPage />
          },
          {
            path: 'timeoff/allocations',
            element: <TimeOffAllocationsPage />
          },
          {
            path: 'payruns',
            element: <PayrunListPage />
          },
          {
            path: 'payruns/:id',
            element: <PayrunDetailPage />
          },
          {
            path: 'payslips',
            element: <PayslipListPage />
          },
          {
            path: 'payslips/:id',
            element: <PayslipDetailPage />
          },
          {
            path: 'salary-config',
            element: <RuleListPage />
          },
          {
            path: 'salary-config/structures',
            element: <StructureListPage />
          },
          {
            path: 'users',
            element: <ProtectedRoute adminOnly={true} />,
            children: [
              {
                index: true,
                element: <UserManagementPage />
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
