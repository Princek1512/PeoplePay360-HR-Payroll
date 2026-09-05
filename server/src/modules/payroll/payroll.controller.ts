import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { PayrollService } from './payrun.service.js';
import { UserRoleType } from '../../shared/types/roles.enum.js';

// --- Payruns ---
export const listPayruns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = String(status);

    const payruns = await prisma.payrun.findMany({
      where,
      include: {
        salaryStructure: true,
        createdBy: { select: { id: true, email: true } },
        payslips: {
          select: {
            id: true,
            grossSalary: true,
            netSalary: true,
            hasWarning: true,
            warningMessage: true,
            status: true
          }
        }
      },
      orderBy: { periodStart: 'desc' }
    });

    const data = payruns.map((p) => {
      let totalGross = 0;
      let totalNet = 0;
      let blockingCount = 0;

      p.payslips.forEach((s) => {
        totalGross += Number(s.grossSalary);
        totalNet += Number(s.netSalary);
        if (s.hasWarning) blockingCount++;
      });

      return {
        id: p.id,
        name: p.name,
        salaryStructureId: p.salaryStructureId,
        salaryStructureName: p.salaryStructure.name,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        status: p.status,
        totalEmployees: p.payslips.length,
        totalGross: Math.round((totalGross + Number.EPSILON) * 100) / 100,
        totalNet: Math.round((totalNet + Number.EPSILON) * 100) / 100,
        hasBlockingWarnings: blockingCount > 0,
        blockingCount,
        createdBy: p.createdBy?.email
      };
    });

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getPayrunById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payrun = await prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: {
          include: {
            salaryStructureRules: {
              include: { rule: true },
              orderBy: { sequence: 'asc' }
            }
          }
        },
        createdBy: { select: { id: true, email: true } },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                bankAccountNumber: true,
                bankName: true,
                bankIfsc: true,
                department: { select: { name: true } },
                jobPosition: { select: { title: true } }
              }
            },
            lines: { orderBy: { sequence: 'asc' } }
          }
        }
      }
    });

    if (!payrun) {
      return res.status(404).json({ success: false, message: 'Payrun not found.' });
    }

    let totalGross = 0;
    let totalNet = 0;
    const warnings: string[] = [];

    payrun.payslips.forEach((s) => {
      totalGross += Number(s.grossSalary);
      totalNet += Number(s.netSalary);
      if (s.hasWarning && s.warningMessage) {
        warnings.push(`${s.employee.name}: ${s.warningMessage}`);
      }
    });

    return res.json({
      success: true,
      data: {
        ...payrun,
        totalEmployees: payrun.payslips.length,
        totalGross: Math.round((totalGross + Number.EPSILON) * 100) / 100,
        totalNet: Math.round((totalNet + Number.EPSILON) * 100) / 100,
        hasBlockingWarnings: warnings.length > 0,
        blockingWarnings: warnings
      }
    });
  } catch (err) {
    next(err);
  }
};

export const previewScope = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { salaryStructureId, periodStart, periodEnd } = req.body;
    if (!salaryStructureId || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'salaryStructureId, periodStart, and periodEnd are required for Step 1 preview.'
      });
    }

    const preview = await PayrollService.getScopePreview({
      salaryStructureId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd)
    });

    return res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
};

export const createPayrun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, salaryStructureId, periodStart, periodEnd, employeeIds } = req.body;

    if (!name || !salaryStructureId || !periodStart || !periodEnd || !employeeIds) {
      return res.status(400).json({
        success: false,
        message: 'name, salaryStructureId, periodStart, periodEnd, and employeeIds are required.'
      });
    }

    const payrun = await PayrollService.createPayrun({
      name,
      salaryStructureId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      employeeIds,
      createdById: req.user?.id
    });

    return res.status(201).json({
      success: true,
      message: 'Payrun created successfully with selected employees.',
      data: payrun
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const computePayrun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const computed = await PayrollService.computePayrun(id);
    return res.json({ success: true, message: 'Payrun computed successfully.', data: computed });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const validatePayrun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validated = await PayrollService.validatePayrun(id);
    return res.json({ success: true, message: 'Payrun validated successfully.', data: validated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const markPaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const paid = await PayrollService.markPaid(id);
    return res.json({ success: true, message: 'Payrun marked as Paid.', data: paid });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const sendPayslips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await PayrollService.sendPayslips(id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// --- Payslips ---
export const listPayslips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payrunId, employeeId, status } = req.query;
    const where: any = {};

    const isRegularEmployee =
      req.user?.roles.length === 1 && req.user.roles.includes(UserRoleType.EMPLOYEE);

    if (isRegularEmployee && req.user?.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (payrunId) where.payrunId = String(payrunId);
    if (status) where.status = String(status);

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { name: true } },
            jobPosition: { select: { title: true } }
          }
        },
        payrun: { select: { id: true, name: true, periodStart: true, periodEnd: true } }
      },
      orderBy: { periodStart: 'desc' }
    });

    return res.json({ success: true, data: payslips });
  } catch (err) {
    next(err);
  }
};

export const getPayslipById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
            workingSchedule: true
          }
        },
        contract: true,
        payrun: {
          include: { salaryStructure: true }
        },
        lines: { orderBy: { sequence: 'asc' } }
      }
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found.' });
    }

    // Role check: Employee can only see their own payslip
    if (
      req.user?.roles.length === 1 &&
      req.user.roles.includes(UserRoleType.EMPLOYEE) &&
      req.user.employeeId !== payslip.employeeId
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot view other employees’ payslips.' });
    }

    return res.json({ success: true, data: payslip });
  } catch (err) {
    next(err);
  }
};
