export type ContractStatus = 'draft' | 'running' | 'expired';
export type AttendanceStatus = 'normal' | 'exception';
export type TimeOffRequestStatus = 'draft' | 'submitted' | 'approved' | 'refused';
export type TimeOffAllocationStatus = 'pending' | 'approved';
export type TimeOffUnit = 'days' | 'hours';
export type SalaryRuleCategory = 'basic' | 'allowance' | 'gross' | 'deduction' | 'net';
export type ComputationMethod = 'fixed' | 'percentage' | 'formula';
export type PayrunStatus = 'draft' | 'computed' | 'validated' | 'paid';
export type PayslipStatus = 'draft' | 'done' | 'paid';

export interface UserDTO {
  id: string;
  email: string;
  isActive: boolean;
  employeeId?: string | null;
  roles: string[];
  createdAt: string;
}

export interface EmployeeDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankIfsc?: string | null;
  panNumber?: string | null;
  departmentId?: string | null;
  departmentName?: string;
  managerId?: string | null;
  managerName?: string;
  jobPositionId?: string | null;
  jobTitle?: string;
  workingScheduleId?: string | null;
  workingScheduleName?: string;
  status: 'active' | 'inactive';
  currentWage?: number;
  contractStatus?: ContractStatus;
}

export interface ContractDTO {
  id: string;
  employeeId: string;
  employeeName?: string;
  startDate: string;
  endDate?: string | null;
  wagePerMonth: number;
  status: ContractStatus;
  departmentId?: string | null;
  jobPositionId?: string | null;
  workingScheduleId?: string | null;
  salaryStructureId?: string | null;
  salaryStructureName?: string;
}

export interface WorkingScheduleLineDTO {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  computedDayHours?: number;
}

export interface WorkingScheduleDTO {
  id: string;
  name: string;
  calendarType: string;
  companyId?: string | null;
  status: 'active' | 'inactive';
  totalWeeklyHours: number;
  lines: WorkingScheduleLineDTO[];
}

export interface AttendanceDTO {
  id: string;
  employeeId: string;
  employeeName?: string;
  checkIn: string;
  checkOut?: string | null;
  workedHours?: number | null;
  status: AttendanceStatus;
  correctedById?: string | null;
  correctedByName?: string | null;
  correctedAt?: string | null;
}

export interface TimeOffTypeDTO {
  id: string;
  name: string;
  unit: TimeOffUnit;
  requiresAllocation: boolean;
  approvalFlow: string;
  affectsPayroll: boolean;
}

export interface TimeOffAllocationDTO {
  id: string;
  employeeId: string;
  employeeName?: string;
  timeOffTypeId: string;
  timeOffTypeName?: string;
  allocatedAmount: number;
  takenAmount: number;
  remainingAmount: number;
  validFrom: string;
  validTo: string;
  status: TimeOffAllocationStatus;
}

export interface TimeOffRequestDTO {
  id: string;
  employeeId: string;
  employeeName?: string;
  timeOffTypeId: string;
  timeOffTypeName?: string;
  startDate: string;
  endDate: string;
  durationAmount: number;
  status: TimeOffRequestStatus;
  allocationId?: string | null;
  reason?: string | null;
}

export interface SalaryRuleDTO {
  id: string;
  name: string;
  code: string;
  category: SalaryRuleCategory;
  sequence: number;
  computationMethod: ComputationMethod;
  amount?: number | null;
  percentageOf?: string | null;
  formula?: string | null;
}

export interface SalaryStructureDTO {
  id: string;
  name: string;
  isActive: boolean;
  rules: {
    rule: SalaryRuleDTO;
    sequence: number;
  }[];
  employeesCount?: number;
}

export interface PayrunScopeDTO {
  name: string;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
}

export interface CreatePayrunDTO extends PayrunScopeDTO {
  employeeIds: string[];
}

export interface PayslipLineDTO {
  id?: string;
  salaryRuleId?: string | null;
  label: string;
  code: string;
  category: SalaryRuleCategory;
  amount: number;
  sequence: number;
}

export interface PayslipDTO {
  id: string;
  payrunId: string;
  payrunName?: string;
  employeeId: string;
  employeeName?: string;
  departmentName?: string;
  contractId: string;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  grossSalary: number;
  netSalary: number;
  status: PayslipStatus;
  hasWarning: boolean;
  warningMessage?: string | null;
  lines: PayslipLineDTO[];
}

export interface PayrunDTO {
  id: string;
  name: string;
  salaryStructureId: string;
  salaryStructureName?: string;
  periodStart: string;
  periodEnd: string;
  status: PayrunStatus;
  totalGross: number;
  totalNet: number;
  totalEmployees: number;
  hasBlockingWarnings: boolean;
  blockingWarnings: string[];
  payslips: PayslipDTO[];
}

export interface DashboardSummaryDTO {
  totalNetSalaryPaid: number;
  payslipsGenerated: {
    total: number;
    paid: number;
    done: number;
    pending: number;
    warning: number;
  };
  avgSalaryPerEmployee: number;
  approvedTimeOffDays: number;
  attendanceHealthPercent: number;
}
