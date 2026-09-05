import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';

function computeWeeklyHours(lines: { startTime: string; endTime: string; breakMinutes: number }[]): number {
  let totalMinutes = 0;

  for (const line of lines) {
    const [startH, startM] = line.startTime.split(':').map(Number);
    const [endH, endM] = line.endTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const diff = Math.max(0, endTotal - startTotal);
    const netDayMinutes = Math.max(0, diff - (line.breakMinutes || 0));
    totalMinutes += netDayMinutes;
  }

  const hours = totalMinutes / 60;
  return Math.round((hours + Number.EPSILON) * 100) / 100;
}

export const listSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await prisma.workingSchedule.findMany({
      include: {
        lines: { orderBy: { dayOfWeek: 'asc' } },
        employees: { select: { id: true } },
        contracts: {
          where: { status: 'running' },
          select: { employeeId: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const data = schedules.map((s) => {
      const empSet = new Set<string>();
      s.employees?.forEach((e) => empSet.add(e.id));
      s.contracts?.forEach((c) => {
        if (c.employeeId) empSet.add(c.employeeId);
      });

      return {
        ...s,
        employeesCount: empSet.size,
        totalWeeklyHours: Number(s.totalWeeklyHours)
      };
    });

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getScheduleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.workingSchedule.findUnique({
      where: { id },
      include: {
        lines: { orderBy: { dayOfWeek: 'asc' } },
        employees: { select: { id: true, name: true, email: true } }
      }
    });

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Working Schedule not found.' });
    }

    return res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

export const createSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, calendarType = 'standard', companyId, status = 'active', lines = [] } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Schedule name is required.' });
    }

    // Auto-calculate derived weekly hours
    const totalWeeklyHours = computeWeeklyHours(lines);

    const schedule = await prisma.workingSchedule.create({
      data: {
        name,
        calendarType,
        companyId: companyId || null,
        status,
        totalWeeklyHours,
        lines: {
          create: lines.map((l: any) => ({
            dayOfWeek: Number(l.dayOfWeek),
            startTime: l.startTime,
            endTime: l.endTime,
            breakMinutes: Number(l.breakMinutes || 60)
          }))
        }
      },
      include: {
        lines: { orderBy: { dayOfWeek: 'asc' } }
      }
    });

    return res.status(201).json({ success: true, message: 'Schedule created successfully.', data: schedule });
  } catch (err) {
    next(err);
  }
};

export const updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, calendarType, companyId, status, lines } = req.body;

    let totalWeeklyHours: number | undefined;
    if (Array.isArray(lines)) {
      totalWeeklyHours = computeWeeklyHours(lines);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(lines)) {
        await tx.workingScheduleLine.deleteMany({ where: { scheduleId: id } });
        await tx.workingScheduleLine.createMany({
          data: lines.map((l: any) => ({
            scheduleId: id,
            dayOfWeek: Number(l.dayOfWeek),
            startTime: l.startTime,
            endTime: l.endTime,
            breakMinutes: Number(l.breakMinutes || 60)
          }))
        });
      }

      return tx.workingSchedule.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(calendarType && { calendarType }),
          ...(companyId !== undefined && { companyId }),
          ...(status && { status }),
          ...(totalWeeklyHours !== undefined && { totalWeeklyHours })
        },
        include: {
          lines: { orderBy: { dayOfWeek: 'asc' } }
        }
      });
    });

    return res.json({ success: true, message: 'Schedule updated successfully.', data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.workingSchedule.delete({ where: { id } });
    return res.json({ success: true, message: 'Working Schedule deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
