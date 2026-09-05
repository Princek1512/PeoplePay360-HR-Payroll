import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { UserRoleType } from '../../shared/types/roles.enum.js';

export const listAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;

    const where: any = {};

    // If regular employee, only show their own attendance
    const isRegularEmployee =
      req.user?.roles.length === 1 && req.user.roles.includes(UserRoleType.EMPLOYEE);

    if (isRegularEmployee && req.user?.employeeId) {
      where.employeeId = req.user.employeeId;
    } else if (employeeId) {
      where.employeeId = String(employeeId);
    }

    if (status) {
      where.status = String(status);
    }

    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) where.checkIn.gte = new Date(String(startDate));
      if (endDate) where.checkIn.lte = new Date(String(endDate));
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            department: { select: { name: true } }
          }
        },
        correctedBy: {
          select: { id: true, email: true }
        }
      },
      orderBy: { checkIn: 'desc' }
    });

    return res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

export const getAttendanceStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee record linked to the current user.'
      });
    }

    // Find the latest attendance record for this employee
    const latest = await prisma.attendance.findFirst({
      where: { employeeId },
      orderBy: { checkIn: 'desc' }
    });

    const isCheckedIn = latest ? latest.checkOut === null : false;

    // Today's total worked hours
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRecords = await prisma.attendance.findMany({
      where: {
        employeeId,
        checkIn: { gte: todayStart }
      }
    });

    let todayHours = 0;
    for (const rec of todayRecords) {
      if (rec.workedHours) {
        todayHours += Number(rec.workedHours);
      } else if (rec.checkIn && !rec.checkOut) {
        const diffHours = (Date.now() - new Date(rec.checkIn).getTime()) / (1000 * 60 * 60);
        todayHours += Math.max(0, diffHours);
      }
    }

    return res.json({
      success: true,
      data: {
        isCheckedIn,
        activeSession: isCheckedIn ? latest : null,
        todayHours: Math.round((todayHours + Number.EPSILON) * 100) / 100
      }
    });
  } catch (err) {
    next(err);
  }
};

export const toggleCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee record linked to current user.'
      });
    }

    const openRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        checkOut: null
      },
      orderBy: { checkIn: 'desc' }
    });

    const now = new Date();

    if (!openRecord) {
      // Check in
      const record = await prisma.attendance.create({
        data: {
          employeeId,
          checkIn: now,
          status: 'normal'
        }
      });

      return res.json({
        success: true,
        action: 'check_in',
        message: 'Checked in successfully.',
        data: record
      });
    } else {
      // Check out
      const diffMs = now.getTime() - new Date(openRecord.checkIn).getTime();
      const workedHours = Math.round(((diffMs / (1000 * 60 * 60)) + Number.EPSILON) * 100) / 100;

      const record = await prisma.attendance.update({
        where: { id: openRecord.id },
        data: {
          checkOut: now,
          workedHours
        }
      });

      return res.json({
        success: true,
        action: 'check_out',
        message: `Checked out successfully. Logged ${workedHours} hours.`,
        data: record
      });
    }
  } catch (err) {
    next(err);
  }
};

export const correctAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, status } = req.body;

    const inDate = checkIn ? new Date(checkIn) : undefined;
    const outDate = checkOut ? new Date(checkOut) : undefined;

    let workedHours: number | undefined;
    if (inDate && outDate) {
      const diffMs = outDate.getTime() - inDate.getTime();
      workedHours = Math.max(0, Math.round(((diffMs / (1000 * 60 * 60)) + Number.EPSILON) * 100) / 100);
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        ...(inDate && { checkIn: inDate }),
        ...(outDate && { checkOut: outDate }),
        ...(workedHours !== undefined && { workedHours }),
        ...(status && { status }),
        correctedById: req.user?.id || null,
        correctedAt: new Date()
      },
      include: {
        employee: true,
        correctedBy: { select: { id: true, email: true } }
      }
    });

    return res.json({ success: true, message: 'Attendance corrected successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};
