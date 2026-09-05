import { ComputationContext, RuleComputationResult } from './computation-context.js';

export interface SalaryRuleExecutable {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  computationMethod: string;
  amount?: number | null;
  percentageOf?: string | null;
  formula?: string | null;
}

export interface ExecutionResult {
  lines: {
    salaryRuleId: string;
    label: string;
    code: string;
    category: string;
    amount: number;
    sequence: number;
  }[];
  grossSalary: number;
  netSalary: number;
  warnings: string[];
}

export class SalaryRuleEngine {
  public static execute(
    rules: SalaryRuleExecutable[],
    params: {
      contractWage: number;
      workedDays: number;
      totalDaysInPeriod?: number;
      attendanceHours?: number;
      timeOffDays?: number;
    }
  ): ExecutionResult {
    const context = new ComputationContext(params);
    const warnings: string[] = [];
    const lines: ExecutionResult['lines'] = [];

    // Sort rules strictly by sequence ascending
    const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);

    for (const rule of sortedRules) {
      let calculatedAmount = 0;

      switch (rule.computationMethod.toLowerCase()) {
        case 'fixed': {
          if (rule.amount !== null && rule.amount !== undefined) {
            calculatedAmount = Number(rule.amount);
          } else if (rule.category === 'basic' && params.contractWage > 0) {
            // Default basic if not explicitly set
            calculatedAmount = params.contractWage;
          }
          break;
        }

        case 'percentage': {
          const targetKey = (rule.percentageOf || 'BASIC').toUpperCase();
          const targetValue = context.ruleValues[targetKey] || 0;
          const percentage = Number(rule.amount || 0); // e.g., 50 for 50%
          calculatedAmount = (targetValue * percentage) / 100;
          break;
        }

        case 'formula': {
          if (rule.formula) {
            calculatedAmount = context.evaluateFormula(rule.formula);
          }
          break;
        }

        default:
          warnings.push(`Unknown computation method '${rule.computationMethod}' for rule '${rule.name}'`);
      }

      // Handle Category Specific Overrides if formula isn't provided
      if (rule.category === 'net' && calculatedAmount === 0) {
        calculatedAmount = context.gross - context.deductions;
      } else if (rule.category === 'gross' && calculatedAmount === 0) {
        calculatedAmount = context.gross;
      }

      calculatedAmount = Math.max(0, Math.round((calculatedAmount + Number.EPSILON) * 100) / 100);

      // Register with context
      context.registerRuleResult(rule.code, rule.category, calculatedAmount);

      lines.push({
        salaryRuleId: rule.id,
        label: rule.name,
        code: rule.code,
        category: rule.category,
        amount: calculatedAmount,
        sequence: rule.sequence
      });
    }

    const finalGross = Math.round((context.gross + Number.EPSILON) * 100) / 100;
    const finalNet = Math.max(0, Math.round(((context.gross - context.deductions) + Number.EPSILON) * 100) / 100);

    return {
      lines,
      grossSalary: finalGross,
      netSalary: finalNet,
      warnings
    };
  }
}
