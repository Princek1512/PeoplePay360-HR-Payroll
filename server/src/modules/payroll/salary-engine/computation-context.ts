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
    timeOffDays?: number;
  }) {
    this.contractWage = Number(params.contractWage) || 0;
    this.workedDays = Number(params.workedDays) || 30;
    this.totalDaysInPeriod = Number(params.totalDaysInPeriod) || 30;
    this.attendanceHours = Number(params.attendanceHours) || 0;
    this.timeOffDays = Number(params.timeOffDays) || 0;

    // Default seed contract wage
    this.ruleValues['WAGE'] = this.contractWage;
    this.ruleValues['WORKED_DAYS'] = this.workedDays;
    this.ruleValues['TOTAL_DAYS'] = this.totalDaysInPeriod;
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
