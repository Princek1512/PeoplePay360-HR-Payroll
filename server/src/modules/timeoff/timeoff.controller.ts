import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { UserRoleType } from '../../shared/types/roles.enum.js';

// --- Time Off Types ---
export const listTimeOffTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await prisma.timeOffType.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
};

export const createTimeOffType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, unit = 'days', requiresAllocation = true, approvalFlow = 'manager', affectsPayroll = true } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Time off type name is required.' });
    }

    const type = await prisma.timeOffType.create({
      data: { name, unit, requiresAllocation, approvalFlow, affectsPayroll }
    });
    return res.status(201).json({ success: true, data: type });
  } catch (err) {
    next(err);
  }
};

// --- Allocations ---
export const listAllocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, status } = req.query;
    const where: any = {};

    const isRegularEmployee =
      req.user?.roles.length === 1 && req.user.roles.includes(UserRoleType.EMPLOYEE);

    if (isRegularEmployee && req.user?.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (status) where.status = String(status);

    const allocations = await prisma.timeOffAllocation.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true } },
        timeOffType: true
      },
      orderBy: { validFrom: 'desc' }
    });

    return res.json({ success: true, data: allocations });
  } catch (err) {
    next(err);
  }
};

export const createAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, timeOffTypeId, allocatedAmount, validFrom, validTo, status = 'approved' } = req.body;

    if (!employeeId || !timeOffTypeId || allocatedAmount === undefined || !validFrom || !validTo) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, timeOffTypeId, allocatedAmount, validFrom, and validTo are required.'
      });
    }

    const allocation = await prisma.timeOffAllocation.create({
      data: {
        employeeId,
        timeOffTypeId,
        allocatedAmount,
        takenAmount: 0,
        remainingAmount: allocatedAmount,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        status
      },
      include: {
        employee: true,
        timeOffType: true
      }
    });

    return res.status(201).json({ success: true, message: 'Allocation created.', data: allocation });
  } catch (err) {
    next(err);
  }
};

// --- Requests ---
export const listRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, status } = req.query;
    const where: any = {};

    const isRegularEmployee =
      req.user?.roles.length === 1 && req.user.roles.includes(UserRoleType.EMPLOYEE);

    if (isRegularEmployee && req.user?.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (status) where.status = String(status);

    const requests = await prisma.timeOffRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: { select: { name: true } }
          }
        },
        timeOffType: true,
        allocation: true
      },
      orderBy: { startDate: 'desc' }
    });

    return res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
};

export const createRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeOffTypeId, startDate, endDate, durationAmount, reason } = req.body;
    let employeeId = req.body.employeeId;

    if (!employeeId && req.user?.employeeId) {
      employeeId = req.user.employeeId;
    }

    if (!employeeId || !timeOffTypeId || !startDate || !endDate || durationAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, timeOffTypeId, startDate, endDate, and durationAmount are required.'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Number(durationAmount);

    const type = await prisma.timeOffType.findUnique({ where: { id: timeOffTypeId } });
    if (!type) {
      return res.status(404).json({ success: false, message: 'Time off type not found.' });
    }

    let matchingAllocationId: string | null = null;

    if (type.requiresAllocation) {
      // Find an approved allocation for this employee with enough remaining balance
      const allocation = await prisma.timeOffAllocation.findFirst({
        where: {
          employeeId,
          timeOffTypeId,
          status: 'approved',
          validFrom: { lte: start },
          validTo: { gte: end },
          remainingAmount: { gte: duration }
        }
      });

      if (!allocation) {
        return res.status(400).json({
          success: false,
          message: `Insufficient time off balance or no approved allocation found for '${type.name}'. Available balance is less than ${duration} ${type.unit}.`
        });
      }
      matchingAllocationId = allocation.id;
    }

    const newRequest = await prisma.timeOffRequest.create({
      data: {
        employeeId,
        timeOffTypeId,
        allocationId: matchingAllocationId,
        startDate: start,
        endDate: end,
        durationAmount: duration,
        status: 'submitted',
        reason: reason || null
      },
      include: {
        employee: true,
        timeOffType: true
      }
    });

    return res.status(201).json({ success: true, message: 'Time off request submitted.', data: newRequest });
  } catch (err) {
    next(err);
  }
};

export const approveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Transactional atomic balance deduction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.timeOffRequest.findUnique({
        where: { id },
        include: { timeOffType: true, allocation: true }
      });

      if (!request) {
        throw new Error('Time off request not found.');
      }

      if (request.status === 'approved') {
        return request;
      }

      const duration = Number(request.durationAmount);

      // Decrement allocation balance if required
      if (request.timeOffType.requiresAllocation && request.allocationId) {
        const alloc = await tx.timeOffAllocation.findUnique({
          where: { id: request.allocationId }
        });

        if (!alloc) {
          throw new Error('Associated allocation record not found.');
        }

        const remaining = Number(alloc.remainingAmount);
        if (remaining < duration) {
          throw new Error(`Cannot approve: allocation only has ${remaining} ${request.timeOffType.unit} remaining.`);
        }

        const newTaken = Number(alloc.takenAmount) + duration;
        const newRemaining = remaining - duration;

        await tx.timeOffAllocation.update({
          where: { id: alloc.id },
          data: {
            takenAmount: newTaken,
            remainingAmount: newRemaining
          }
        });
      }

      return tx.timeOffRequest.update({
        where: { id },
        data: { status: 'approved' },
        include: {
          employee: true,
          timeOffType: true,
          allocation: true
        }
      });
    });

    return res.json({
      success: true,
      message: 'Time off request approved and allocation balance updated.',
      data: updatedRequest
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const refuseRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const request = await prisma.timeOffRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // If it was already approved, revert balance in transaction
    const updated = await prisma.$transaction(async (tx) => {
      if (request.status === 'approved' && request.allocationId) {
        const alloc = await tx.timeOffAllocation.findUnique({ where: { id: request.allocationId } });
        if (alloc) {
          const duration = Number(request.durationAmount);
          await tx.timeOffAllocation.update({
            where: { id: alloc.id },
            data: {
              takenAmount: Math.max(0, Number(alloc.takenAmount) - duration),
              remainingAmount: Number(alloc.remainingAmount) + duration
            }
          });
        }
      }

      return tx.timeOffRequest.update({
        where: { id },
        data: { status: 'refused' },
        include: {
          employee: true,
          timeOffType: true
        }
      });
    });

    return res.json({ success: true, message: 'Time off request refused.', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
