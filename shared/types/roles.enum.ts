export enum UserRoleType {
  EMPLOYEE = 'Employee',
  HR_MANAGER = 'HR Manager',
  HR_PAYROLL_USER = 'HR Payroll User',
  HR_PAYROLL_MANAGER = 'HR Payroll Manager',
  ADMIN = 'Admin'
}

export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'approve';

export interface ModulePermissions {
  [module: string]: PermissionAction[];
}

/**
 * 5-Tier Role Permissions Matrix defined in §7 of the PeoplePay360 Specification
 */
export const ROLE_PERMISSIONS: Record<UserRoleType, ModulePermissions> = {
  [UserRoleType.EMPLOYEE]: {
    profile: ['read', 'update'],
    attendance: ['read', 'create'], // check-in/out own
    timeoff: ['read', 'create'], // own requests/balance
    payslips: ['read'], // own payslips
  },
  [UserRoleType.HR_MANAGER]: {
    profile: ['read', 'update'],
    employees: ['read', 'create', 'update', 'delete'],
    contracts: ['read', 'create', 'update', 'delete'],
    schedules: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update', 'delete', 'approve'],
    timeoff: ['read', 'create', 'update', 'delete', 'approve'],
    dashboard: ['read'],
  },
  [UserRoleType.HR_PAYROLL_USER]: {
    profile: ['read', 'update'],
    employees: ['read', 'create', 'update', 'delete'],
    contracts: ['read', 'create', 'update', 'delete'],
    schedules: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update', 'delete', 'approve'],
    timeoff: ['read', 'create', 'update', 'delete', 'approve'],
    payruns: ['read', 'create', 'update'],
    payslips: ['read', 'create', 'update'],
    salaryStructures: ['read'],
    salaryRules: ['read'],
    dashboard: ['read'],
  },
  [UserRoleType.HR_PAYROLL_MANAGER]: {
    profile: ['read', 'update'],
    employees: ['read', 'create', 'update', 'delete'],
    contracts: ['read', 'create', 'update', 'delete'],
    schedules: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update', 'delete', 'approve'],
    timeoff: ['read', 'create', 'update', 'delete', 'approve'],
    payruns: ['read', 'create', 'update', 'delete', 'approve'],
    payslips: ['read', 'create', 'update', 'delete'],
    salaryStructures: ['read', 'create', 'update', 'delete'],
    salaryRules: ['read', 'create', 'update', 'delete'],
    dashboard: ['read'],
  },
  [UserRoleType.ADMIN]: {
    profile: ['read', 'update'],
    users: ['read', 'create', 'update', 'delete'],
    employees: ['read', 'create', 'update', 'delete'],
    contracts: ['read', 'create', 'update', 'delete'],
    schedules: ['read', 'create', 'update', 'delete'],
    attendance: ['read', 'create', 'update', 'delete', 'approve'],
    timeoff: ['read', 'create', 'update', 'delete', 'approve'],
    payruns: ['read', 'create', 'update', 'delete', 'approve'],
    payslips: ['read', 'create', 'update', 'delete'],
    salaryStructures: ['read', 'create', 'update', 'delete'],
    salaryRules: ['read', 'create', 'update', 'delete'],
    dashboard: ['read'],
  }
};

export function hasPermission(
  roles: (UserRoleType | string)[],
  module: string,
  action: PermissionAction
): boolean {
  return roles.some((role) => {
    const roleKey = role as UserRoleType;
    const permissions = ROLE_PERMISSIONS[roleKey];
    if (!permissions) return false;
    const modulePerms = permissions[module];
    if (!modulePerms) return false;
    return modulePerms.includes(action);
  });
}
