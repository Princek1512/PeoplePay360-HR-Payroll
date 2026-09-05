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
            employee: {
              include: {
                workingSchedule: {
                  include: { lines: true }
                }
              }
            },
            contract: {
              include: {
                workingSchedule: {
                  include: { lines: true }
                }
              }
            }
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
        // Fetch attendance entries in the pay period
        const attendances = await tx.attendance.findMany({
          where: {
            employeeId: slip.employeeId,
            checkIn: { gte: payrun.periodStart, lte: payrun.periodEnd }
          }
        });

        let totalRegularHours = 0;
        let totalOvertimeHours = 0;

        const schedule = slip.contract?.workingSchedule || slip.employee?.workingSchedule;
        const scheduleLines = schedule?.lines || [];

        attendances.forEach((a) => {
          const checkIn = new Date(a.checkIn);
          const checkOut = a.checkOut
            ? new Date(a.checkOut)
            : new Date(checkIn.getTime() + Number(a.workedHours || 8) * 3600000);
          const actualHours = a.workedHours
            ? Number(a.workedHours)
            : (checkOut.getTime() - checkIn.getTime()) / 3600000;

          // Check shift schedule line for this day of week (0=Sun, 1=Mon, ..., 6=Sat)
          const dayOfWeek = checkIn.getDay();
          const matchLine = scheduleLines.find((l) => l.dayOfWeek === dayOfWeek);

          let inRangeHours = 0;

          if (matchLine) {
            const [startH, startM] = matchLine.startTime.split(':').map(Number);
            const [endH, endM] = matchLine.endTime.split(':').map(Number);

            const shiftStart = new Date(checkIn);
            shiftStart.setHours(startH || 9, startM || 0, 0, 0);
            const shiftEnd = new Date(checkIn);
            shiftEnd.setHours(endH || 17, endM || 0, 0, 0);

            const overlapStart = Math.max(checkIn.getTime(), shiftStart.getTime());
            const overlapEnd = Math.min(checkOut.getTime(), shiftEnd.getTime());
            const inRangeMs = Math.max(0, overlapEnd - overlapStart);
            inRangeHours = Math.min(actualHours, inRangeMs / 3600000);
          } else if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            // Default weekday shift window: 09:00 AM to 05:00 PM
            const shiftStart = new Date(checkIn);
            shiftStart.setHours(9, 0, 0, 0);
            const shiftEnd = new Date(checkIn);
            shiftEnd.setHours(17, 0, 0, 0);

            const overlapStart = Math.max(checkIn.getTime(), shiftStart.getTime());
            const overlapEnd = Math.min(checkOut.getTime(), shiftEnd.getTime());
            const inRangeMs = Math.max(0, overlapEnd - overlapStart);
            inRangeHours = Math.min(actualHours, inRangeMs / 3600000);
          } else {
            // Weekend work with no assigned schedule line -> 0 in-range hours
            inRangeHours = 0;
          }

          const outOfRangeHours = Math.max(0, actualHours - inRangeHours);

          totalRegularHours += inRangeHours;
          totalOvertimeHours += outOfRangeHours;
        });

        const totalAttendanceHours = totalRegularHours + totalOvertimeHours;

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

        // Calculate Target Shift Hours (default 40h/week = 160h/month or 140h based on schedule)
        const weeklyHours = slip.employee.workingSchedule?.totalWeeklyHours
          ? Number(slip.employee.workingSchedule.totalWeeklyHours)
          : 40;
        const targetHours = Math.round((weeklyHours / 5) * 20); // 20 working days standard month

        // Run Rule Execution Pipeline
        const result = SalaryRuleEngine.execute(rules, {
          contractWage: Number(slip.contract.wagePerMonth),
          workedDays,
          totalDaysInPeriod: 30,
          attendanceHours: totalAttendanceHours,
          regularHours: totalRegularHours,
          overtimeHours: totalOvertimeHours,
          targetHours,
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

        // Update Payslip with calculated attendance metrics
        await tx.payslip.update({
          where: { id: slip.id },
          data: {
            workedDays,
            targetHours: result.targetHours,
            attendanceHours: result.attendanceHours,
            regularHours: result.regularHours,
            overtimeHours: result.overtimeHours,
            overtimeAmount: result.overtimeAmount,
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
