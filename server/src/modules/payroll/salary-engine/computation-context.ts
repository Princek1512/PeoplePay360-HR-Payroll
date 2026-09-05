export interface RuleComputationResult {
  ruleId: string;
  code: string;
  name: string;
  category: string;
  sequence: number;
  amount: number;
}

export class ComputationContext {
  public contractWage: number;
  public workedDays: number;
  public totalDaysInPeriod: number;
  public attendanceHours: number;
  public targetHours: number;
  public regularHours: number;
  public overtimeHours: number;
  public hourlyRate: number;
  public overtimeRate: number;
  public regularPay: number;
  public overtimePay: number;
  public timeOffDays: number;

  // Running category subtotals
  public basic: number = 0;
  public allowances: number = 0;
  public gross: number = 0;
  public deductions: number = 0;
  public net: number = 0;

  // Rule values by uppercase code for formula referencing
  public ruleValues: Record<string, number> = {};

  constructor(params: {
    contractWage: number;
    workedDays: number;
    totalDaysInPeriod?: number;
    attendanceHours?: number;
    regularHours?: number;
    overtimeHours?: number;
    targetHours?: number;
    timeOffDays?: number;
  }) {
    this.contractWage = Number(params.contractWage) || 0;
    this.workedDays = Number(params.workedDays) || 30;
    this.totalDaysInPeriod = Number(params.totalDaysInPeriod) || 30;
    this.attendanceHours = Number(params.attendanceHours) || 0;
    this.targetHours = Number(params.targetHours) || 160;
    this.timeOffDays = Number(params.timeOffDays) || 0;

    // Shift Schedule & Attendance calculations
    this.regularHours = params.regularHours !== undefined ? Number(params.regularHours) : Math.min(this.attendanceHours, this.targetHours);
    this.overtimeHours = params.overtimeHours !== undefined ? Number(params.overtimeHours) : Math.max(0, this.attendanceHours - this.targetHours);

    // Regular Hourly Rate
    this.hourlyRate = this.targetHours > 0 ? this.contractWage / this.targetHours : 0;

    // Reduced Overtime Hourly Rate (80% of regular hourly rate to motivate shift completion)
    this.overtimeRate = this.hourlyRate * 0.8;

    // Earned Regular Wage (1.0x rate for in-range core shift hours)
    this.regularPay = Math.round((this.regularHours * this.hourlyRate + Number.EPSILON) * 100) / 100;

    // Earned Overtime Pay (0.8x rate for out-of-range hours)
    this.overtimePay = Math.round((this.overtimeHours * this.overtimeRate + Number.EPSILON) * 100) / 100;

    // Register variables for formula evaluations
    this.ruleValues['WAGE'] = this.contractWage;
    this.ruleValues['WORKED_DAYS'] = this.workedDays;
    this.ruleValues['TOTAL_DAYS'] = this.totalDaysInPeriod;
    this.ruleValues['TARGET_HOURS'] = this.targetHours;
    this.ruleValues['ATTENDANCE_HOURS'] = this.attendanceHours;
    this.ruleValues['REGULAR_HOURS'] = this.regularHours;
    this.ruleValues['OVERTIME_HOURS'] = this.overtimeHours;
    this.ruleValues['HOURLY_RATE'] = Math.round((this.hourlyRate + Number.EPSILON) * 100) / 100;
    this.ruleValues['OVERTIME_RATE'] = Math.round((this.overtimeRate + Number.EPSILON) * 100) / 100;
    this.ruleValues['REGULAR_PAY'] = this.regularPay;
    this.ruleValues['OVERTIME_PAY'] = this.overtimePay;
  }

  public registerRuleResult(code: string, category: string, amount: number) {
    const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
    this.ruleValues[code.toUpperCase()] = rounded;

    switch (category.toLowerCase()) {
      case 'basic':
        this.basic += rounded;
        this.gross += rounded;
        break;
      case 'allowance':
        this.allowances += rounded;
        this.gross += rounded;
        break;
      case 'gross':
        // If an explicit gross rule is calculated
        this.gross = rounded;
        break;
      case 'deduction':
        this.deductions += rounded;
        break;
      case 'net':
        this.net = rounded;
        break;
    }

    // Always keep standard summary variables updated in context
    this.ruleValues['BASIC'] = Math.round((this.basic + Number.EPSILON) * 100) / 100;
    this.ruleValues['ALLOWANCES'] = Math.round((this.allowances + Number.EPSILON) * 100) / 100;
    this.ruleValues['GROSS'] = Math.round((this.gross + Number.EPSILON) * 100) / 100;
    this.ruleValues['DEDUCTIONS'] = Math.round((this.deductions + Number.EPSILON) * 100) / 100;
    this.ruleValues['NET'] = Math.round(((this.gross - this.deductions) + Number.EPSILON) * 100) / 100;
  }

  public evaluateFormula(formula: string): number {
    try {
      // Safe sandboxed formula evaluation
      // Replace known symbols in formula with numeric context values
      // Tokens allowed: alphanumeric, +, -, *, /, (, ), ., whitespace
      const sanitized = formula.trim();

      // Check if dangerous tokens exist
      if (/[;{}()[\]=><!&|]/.test(sanitized.replace(/[()]/g, '')) || /import|require|process|global|window|eval|Function/.test(sanitized)) {
        console.warn(`Disallowed token in formula: "${formula}"`);
        return 0;
      }

      // Prepare scope
      const scopeKeys = Object.keys(this.ruleValues);
      const scopeValues = Object.values(this.ruleValues);

      // Create sandboxed function with explicit argument names
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const evaluator = new Function(...scopeKeys, `"use strict"; return (${sanitized});`);
      const result = evaluator(...scopeValues);

      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.max(0, result);
      }
      return 0;
    } catch (err) {
      console.error(`Error evaluating formula "${formula}":`, err);
      return 0;
    }
  }
}
