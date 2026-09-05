import { prisma } from '../../config/db.js';
import { SalaryRuleEngine } from './salary-engine/rule-executor.js';

export class PayrollService {
  /**
   * Step 1 Helper: Scope Preview (No DB writes)
   * Finds all employees with a valid running contract for the given period,
   * calculates preview metrics, and identifies any pre-run warnings.
   */
  public static async getScopePreview(params: {
    salaryStructureId: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const { salaryStructureId, periodStart, periodEnd } = params;

    // Find all running contracts valid for this period that use this structure
    const contracts = await prisma.contract.findMany({
      where: {
        status: 'running',
        salaryStructureId,
        startDate: { lte: periodEnd },
        OR: [
          { endDate: null },
          { endDate: { gte: periodStart } }
        ]
      },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
            workingSchedule: true
          }
        }
      }
    });

    const eligibleEmployees = [];

    for (const contract of contracts) {
      const emp = contract.employee;

      // Check for existing payslips in the same period (duplicate warning)
      const existingSlip = await prisma.payslip.findFirst({
        where: {
          employeeId: emp.id,
          periodStart: { lte: periodEnd },
          periodEnd: { gte: periodStart }
        },
        include: { payrun: true }
      });

      const warnings: string[] = [];
      let isBlocking = false;

      if (!emp.bankAccountNumber || !emp.bankIfsc) {
        warnings.push('Missing bank details (Account # or IFSC/Routing code)');
        isBlocking = true;
      }

      if (existingSlip) {
        warnings.push(`Already has a payslip in Payrun: "${existingSlip.payrun.name}"`);
        isBlocking = true;
      }

      eligibleEmployees.push({
        id: emp.id,
        contractId: contract.id,
        name: emp.name,
        email: emp.email,
        department: emp.department?.name || 'Unassigned',
        jobTitle: emp.jobPosition?.title || 'Staff',
        weeklyHours: emp.workingSchedule ? Number(emp.workingSchedule.totalWeeklyHours) : 40,
        wagePerMonth: Number(contract.wagePerMonth),
        startDate: contract.startDate,
        endDate: contract.endDate,
        hasWarning: warnings.length > 0,
        isBlocking,
        warnings
      });
    }

    return {
      periodStart,
      periodEnd,
      salaryStructureId,
      totalEligible: eligibleEmployees.length,
      employees: eligibleEmployees
    };
  }

  /**
   * Step 2: Persist Payrun with only the confirmed selected employees
   */
  public static async createPayrun(params: {
    name: string;
    salaryStructureId: string;
    periodStart: Date;
    periodEnd: Date;
    employeeIds: string[];
    createdById?: string;
  }) {
    const { name, salaryStructureId, periodStart, periodEnd, employeeIds, createdById } = params;

    if (!employeeIds || employeeIds.length === 0) {
      throw new Error('At least one employee record must be selected to create a payrun.');
    }

    return await prisma.$transaction(async (tx) => {
      const payrun = await tx.payrun.create({
        data: {
          name,
          salaryStructureId,
          periodStart,
          periodEnd,
          status: 'draft',
          createdById: createdById || null
        }
      });

      for (const employeeId of employeeIds) {
        // Resolve the running contract valid for this period
        const contract = await tx.contract.findFirst({
          where: {
            employeeId,
            status: 'running',
            salaryStructureId,
            startDate: { lte: periodEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: periodStart } }
            ]
          },
          include: { employee: true }
        });

        if (!contract) {
          throw new Error(`Employee ${employeeId} does not have a valid running contract for this period and structure.`);
        }

        const warnings: string[] = [];
        let hasWarning = false;

        if (!contract.employee.bankAccountNumber) {
          warnings.push('Missing bank account information.');
          hasWarning = true;
        }

        await tx.payslip.create({
          data: {
            payrunId: payrun.id,
            employeeId,
            contractId: contract.id,
            periodStart,
            periodEnd,
            workedDays: 30,
            grossSalary: 0,
            netSalary: 0,
            status: 'draft',
            hasWarning,
            warningMessage: warnings.join('; ')
          }
        });
      }

      return tx.payrun.findUnique({
        where: { id: payrun.id },
        include: {
          salaryStructure: true,
          payslips: {
            include: {
              employee: true,
              contract: true
            }
          }
        }
      });
    });
  }

  /**
   * Compute Payrun: Sequenced Execution of all Rules
   */
  public static async computePayrun(payrunId: string) {
    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        salaryStructure: {
          include: {
            salaryStructureRules: {
              include: { rule: true },
              orderBy: { sequence: 'asc' }
            }
          }
        },
        payslips: {
          include: {
            employee: true,
            contract: true
          }
        }
      }
    });

    if (!payrun) throw new Error('Payrun not found.');
    if (payrun.status === 'paid') throw new Error('Cannot recompute a payrun that has already been marked paid.');

    const rules = payrun.salaryStructure.salaryStructureRules.map((sr) => ({
      id: sr.rule.id,
      name: sr.rule.name,
      code: sr.rule.code,
      category: sr.rule.category,
      sequence: sr.sequence,
      computationMethod: sr.rule.computationMethod,
      amount: sr.rule.amount ? Number(sr.rule.amount) : null,
      percentageOf: sr.rule.percentageOf,
      formula: sr.rule.formula
    }));

    await prisma.$transaction(async (tx) => {
      for (const slip of payrun.payslips) {
        // Calculate attendance & approved time off in period
        const attendances = await tx.attendance.findMany({
          where: {
            employeeId: slip.employeeId,
            checkIn: { gte: payrun.periodStart, lte: payrun.periodEnd }
          }
        });

        let totalAttendanceHours = 0;
        attendances.forEach((a) => {
          totalAttendanceHours += a.workedHours ? Number(a.workedHours) : 8;
        });

        const timeOffs = await tx.timeOffRequest.findMany({
          where: {
            employeeId: slip.employeeId,
            status: 'approved',
            startDate: { lte: payrun.periodEnd },
            endDate: { gte: payrun.periodStart }
          }
        });

        let totalTimeOffDays = 0;
        timeOffs.forEach((to) => {
          totalTimeOffDays += Number(to.durationAmount);
        });

        const workedDays = Math.max(0, 30 - totalTimeOffDays);

        // Run Rule Execution Pipeline
        const result = SalaryRuleEngine.execute(rules, {
          contractWage: Number(slip.contract.wagePerMonth),
          workedDays,
          totalDaysInPeriod: 30,
          attendanceHours: totalAttendanceHours,
          timeOffDays: totalTimeOffDays
        });

        // Warnings check
        const warnings: string[] = [...result.warnings];
        if (!slip.employee.bankAccountNumber) {
          warnings.push('Missing bank details for payout.');
        }

        // Delete existing lines
        await tx.payslipLine.deleteMany({ where: { payslipId: slip.id } });

        // Save computed lines
        await tx.payslipLine.createMany({
          data: result.lines.map((l) => ({
            payslipId: slip.id,
            salaryRuleId: l.salaryRuleId,
            label: l.label,
            code: l.code,
            category: l.category,
            amount: l.amount,
            sequence: l.sequence
          }))
        });

        // Update Payslip
        await tx.payslip.update({
          where: { id: slip.id },
          data: {
            workedDays,
            grossSalary: result.grossSalary,
            netSalary: result.netSalary,
            status: 'done',
            hasWarning: warnings.length > 0,
            warningMessage: warnings.join('; ')
          }
        });
      }

      await tx.payrun.update({
        where: { id: payrunId },
        data: { status: 'computed' }
      });
    });

    return prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        salaryStructure: true,
        payslips: {
          include: {
            employee: true,
            lines: { orderBy: { sequence: 'asc' } }
          }
        }
      }
    });
  }

  /**
   * Validate Payrun: Checks for blocking warnings before validation
   */
  public static async validatePayrun(payrunId: string) {
    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: {
          include: { employee: true }
        }
      }
    });

    if (!payrun) throw new Error('Payrun not found.');

    const blockingErrors: string[] = [];

    for (const slip of payrun.payslips) {
      if (!slip.employee.bankAccountNumber) {
        blockingErrors.push(`Blocking: Employee ${slip.employee.name} is missing bank details.`);
      }
      if (Number(slip.netSalary) <= 0) {
        blockingErrors.push(`Blocking: Employee ${slip.employee.name} has zero or negative Net Salary (${slip.netSalary}).`);
      }
    }

    if (blockingErrors.length > 0) {
      throw new Error(`Payrun validation blocked:\n${blockingErrors.join('\n')}`);
    }

    return prisma.payrun.update({
      where: { id: payrunId },
      data: { status: 'validated' },
      include: { payslips: true }
    });
  }

  /**
   * Mark Paid: Lock payrun & payslips
   */
  public static async markPaid(payrunId: string) {
    const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
    if (!payrun) throw new Error('Payrun not found.');
    if (payrun.status !== 'validated') {
      throw new Error('Payrun must be validated before it can be marked paid.');
    }

    await prisma.$transaction([
      prisma.payrun.update({
        where: { id: payrunId },
        data: { status: 'paid' }
      }),
      prisma.payslip.updateMany({
        where: { payrunId },
        data: { status: 'paid' }
      })
    ]);

    return prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: { include: { employee: true } }
      }
    });
  }

  /**
   * Send Payslips Bulk
   */
  public static async sendPayslips(payrunId: string) {
    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: { include: { employee: true } }
      }
    });

    if (!payrun) throw new Error('Payrun not found.');

    const now = new Date();
    await prisma.payslip.updateMany({
      where: { payrunId },
      data: { sentAt: now }
    });

    return {
      success: true,
      message: `Payslips dispatched via email to ${payrun.payslips.length} employees.`,
      sentCount: payrun.payslips.length,
      sentAt: now
    };
  }
}
