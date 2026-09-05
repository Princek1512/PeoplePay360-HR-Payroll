import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';

export const listEmployees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, status, search } = req.query;

    const where: any = {};
    if (departmentId) where.departmentId = String(departmentId);
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { jobPosition: { title: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        jobPosition: { select: { id: true, title: true } },
        workingSchedule: { select: { id: true, name: true, totalWeeklyHours: true } },
        contracts: {
          where: { status: 'running' },
          select: { id: true, wagePerMonth: true, status: true, startDate: true, endDate: true },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({
      success: true,
      data: employees.map((emp) => ({
        ...emp,
        currentWage: emp.contracts[0] ? Number(emp.contracts[0].wagePerMonth) : null,
        activeContractId: emp.contracts[0]?.id || null
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        jobPosition: true,
        manager: { select: { id: true, name: true, email: true } },
        workingSchedule: {
          include: {
            lines: { orderBy: { dayOfWeek: 'asc' } }
          }
        },
        contracts: {
          orderBy: { startDate: 'desc' },
          include: {
            salaryStructure: true
          }
        },
        timeOffAllocations: {
          include: {
            timeOffType: true
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    return res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeSmartMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [contractsCount, attendanceCount, timeOffRequestsCount, allocationsCount, payslipsCount] =
      await Promise.all([
        prisma.contract.count({ where: { employeeId: id } }),
        prisma.attendance.count({ where: { employeeId: id } }),
        prisma.timeOffRequest.count({ where: { employeeId: id } }),
        prisma.timeOffAllocation.count({ where: { employeeId: id } }),
        prisma.payslip.count({ where: { employeeId: id } })
      ]);

    return res.json({
      success: true,
      data: {
        contractsCount,
        attendanceCount,
        timeOffRequestsCount,
        allocationsCount,
        payslipsCount
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      avatarUrl,
      bankAccountNumber,
      bankName,
      bankIfsc,
      panNumber,
      departmentId,
      managerId,
      jobPositionId,
      workingScheduleId,
      status = 'active'
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const existing = await prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An employee with this email already exists.' });
    }

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone || null,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        bankAccountNumber: bankAccountNumber || null,
        bankName: bankName || null,
        bankIfsc: bankIfsc || null,
        panNumber: panNumber || null,
        departmentId: departmentId || null,
        managerId: managerId || null,
        jobPositionId: jobPositionId || null,
        workingScheduleId: workingScheduleId || null,
        status
      },
      include: {
        department: true,
        jobPosition: true,
        workingSchedule: true
      }
    });

    return res.status(201).json({ success: true, message: 'Employee created successfully.', data: employee });
  } catch (err) {
    next(err);
  }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      avatarUrl,
      bankAccountNumber,
      bankName,
      bankIfsc,
      panNumber,
      departmentId,
      managerId,
      jobPositionId,
      workingScheduleId,
      status
    } = req.body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(bankName !== undefined && { bankName }),
        ...(bankIfsc !== undefined && { bankIfsc }),
        ...(panNumber !== undefined && { panNumber }),
        ...(departmentId !== undefined && { departmentId }),
        ...(managerId !== undefined && { managerId }),
        ...(jobPositionId !== undefined && { jobPositionId }),
        ...(workingScheduleId !== undefined && { workingScheduleId }),
        ...(status !== undefined && { status })
      },
      include: {
        department: true,
        jobPosition: true,
        workingSchedule: true
      }
    });

    return res.json({ success: true, message: 'Employee updated successfully.', data: employee });
  } catch (err) {
    next(err);
  }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.employee.delete({ where: { id } });
    return res.json({ success: true, message: 'Employee deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
