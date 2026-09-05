import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';

export const listContracts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, status } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = String(employeeId);
    if (status) where.status = String(status);

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        jobPosition: { select: { id: true, title: true } },
        workingSchedule: { select: { id: true, name: true, totalWeeklyHours: true } },
        salaryStructure: { select: { id: true, name: true } }
      },
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }]
    });

    return res.json({ success: true, data: contracts });
  } catch (err) {
    next(err);
  }
};

export const getContractById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        employee: true,
        department: true,
        jobPosition: true,
        workingSchedule: true,
        salaryStructure: {
          include: {
            salaryStructureRules: {
              include: { rule: true },
              orderBy: { sequence: 'asc' }
            }
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    return res.json({ success: true, data: contract });
  } catch (err) {
    next(err);
  }
};

export const createContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      wagePerMonth,
      status = 'running',
      departmentId,
      jobPositionId,
      workingScheduleId,
      salaryStructureId
    } = req.body;

    if (!employeeId || !startDate || wagePerMonth === undefined) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, startDate, and wagePerMonth are required.'
      });
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    // Strict Business Rule #1: Check for overlapping 'running' contracts for the same employee
    if (status === 'running') {
      const overlapping = await prisma.contract.findFirst({
        where: {
          employeeId,
          status: 'running',
          OR: [
            // Overlap condition
            {
              AND: [
                { startDate: { lte: end || new Date('2099-12-31') } },
                {
                  OR: [
                    { endDate: null },
                    { endDate: { gte: start } }
                  ]
                }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: Employee already has an active 'running' contract (${overlapping.id}) during this period. An employee cannot have overlapping active contracts.`
        });
      }
    }

    const contract = await prisma.contract.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        wagePerMonth,
        status,
        departmentId: departmentId || null,
        jobPositionId: jobPositionId || null,
        workingScheduleId: workingScheduleId || null,
        salaryStructureId: salaryStructureId || null
      },
      include: {
        employee: true,
        department: true,
        jobPosition: true,
        salaryStructure: true
      }
    });

    return res.status(201).json({ success: true, message: 'Contract created successfully.', data: contract });
  } catch (err) {
    next(err);
  }
};

export const updateContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      wagePerMonth,
      status,
      departmentId,
      jobPositionId,
      workingScheduleId,
      salaryStructureId
    } = req.body;

    const current = await prisma.contract.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    const newStatus = status || current.status;
    const start = startDate ? new Date(startDate) : current.startDate;
    const end = endDate !== undefined ? (endDate ? new Date(endDate) : null) : current.endDate;

    if (newStatus === 'running') {
      const overlapping = await prisma.contract.findFirst({
        where: {
          employeeId: current.employeeId,
          status: 'running',
          id: { not: id },
          AND: [
            { startDate: { lte: end || new Date('2099-12-31') } },
            {
              OR: [
                { endDate: null },
                { endDate: { gte: start } }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: `Validation Error: Employee already has another 'running' contract (${overlapping.id}) overlapping this date window.`
        });
      }
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...(startDate && { startDate: start }),
        ...(endDate !== undefined && { endDate: end }),
        ...(wagePerMonth !== undefined && { wagePerMonth }),
        ...(status && { status: newStatus }),
        ...(departmentId !== undefined && { departmentId }),
        ...(jobPositionId !== undefined && { jobPositionId }),
        ...(workingScheduleId !== undefined && { workingScheduleId }),
        ...(salaryStructureId !== undefined && { salaryStructureId })
      },
      include: {
        employee: true,
        salaryStructure: true
      }
    });

    return res.json({ success: true, message: 'Contract updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.contract.delete({ where: { id } });
    return res.json({ success: true, message: 'Contract deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
