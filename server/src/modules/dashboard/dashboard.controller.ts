import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, employeeType, periodStart, periodEnd } = req.query;

    const payslipWhere: any = {};
    if (departmentId || (employeeType && employeeType !== 'All Types')) {
      payslipWhere.employee = {};
      if (departmentId) payslipWhere.employee.departmentId = String(departmentId);
      if (employeeType && employeeType !== 'All Types') payslipWhere.employee.employmentType = String(employeeType);
    }
    if (periodStart || periodEnd) {
      payslipWhere.periodStart = {};
      if (periodStart) payslipWhere.periodStart.gte = new Date(String(periodStart));
      if (periodEnd) payslipWhere.periodStart.lte = new Date(String(periodEnd));
    }

    const employeeWhere: any = { status: 'active' };
    if (departmentId) employeeWhere.departmentId = String(departmentId);
    if (employeeType && employeeType !== 'All Types') employeeWhere.employmentType = String(employeeType);

    const timeOffWhere: any = { status: 'approved' };
    if (departmentId || (employeeType && employeeType !== 'All Types')) {
      timeOffWhere.employee = {};
      if (departmentId) timeOffWhere.employee.departmentId = String(departmentId);
      if (employeeType && employeeType !== 'All Types') timeOffWhere.employee.employmentType = String(employeeType);
    }

    const attendanceWhere: any = {};
    if (departmentId || (employeeType && employeeType !== 'All Types')) {
      attendanceWhere.employee = {};
      if (departmentId) attendanceWhere.employee.departmentId = String(departmentId);
      if (employeeType && employeeType !== 'All Types') attendanceWhere.employee.employmentType = String(employeeType);
    }

    const [allPayslips, paidPayslips, activeEmployeesCount, approvedTimeOffs, attendanceRecords, timeOffTypes] =
      await Promise.all([
        prisma.payslip.findMany({ where: payslipWhere, select: { status: true, hasWarning: true, netSalary: true } }),
        prisma.payslip.findMany({
          where: { ...payslipWhere, status: 'paid' },
          select: { netSalary: true }
        }),
        prisma.employee.count({ where: employeeWhere }),
        prisma.timeOffRequest.findMany({
          where: timeOffWhere,
          select: { durationAmount: true }
        }),
        prisma.attendance.findMany({
          where: attendanceWhere,
          select: { status: true, workedHours: true, checkIn: true, checkOut: true }
        }),
        prisma.timeOffType.findMany({
          include: {
            requests: {
              where: departmentId ? { employee: { departmentId: String(departmentId) } } : {}
            },
            allocations: {
              where: departmentId ? { employee: { departmentId: String(departmentId) } } : {}
            }
          }
        })
      ]);

    const totalNetSalaryPaid = paidPayslips.reduce((acc, p) => acc + Number(p.netSalary), 0);
    const avgSalaryPerEmployee =
      activeEmployeesCount > 0
        ? Math.round(((totalNetSalaryPaid / activeEmployeesCount) + Number.EPSILON) * 100) / 100
        : 0;

    const payslipsGenerated = {
      total: allPayslips.length,
      paid: allPayslips.filter((p) => p.status === 'paid').length,
      done: allPayslips.filter((p) => p.status === 'done').length,
      pending: allPayslips.filter((p) => p.status === 'draft').length,
      warning: allPayslips.filter((p) => p.hasWarning).length
    };

    const approvedTimeOffDays = approvedTimeOffs.reduce(
      (acc, t) => acc + Number(t.durationAmount),
      0
    );

    const normalAttendances = attendanceRecords.filter((a) => a.status === 'normal').length;
    const lateAttendances = attendanceRecords.filter((a) => a.status === 'late').length;
    const absentAttendances = attendanceRecords.filter((a) => a.status === 'absent').length;
    const overtimeAttendances = attendanceRecords.filter((a) => a.status === 'overtime' || Number(a.workedHours) > 8).length;
    const missingCheckouts = attendanceRecords.filter((a) => !a.checkOut && a.checkIn).length;

    const attendanceHealthPercent =
      attendanceRecords.length > 0
        ? Math.round(((normalAttendances / attendanceRecords.length) * 100 + Number.EPSILON) * 10) / 10
        : 100;

    const timeOffOverview = timeOffTypes.map((tot) => {
      const approved = tot.requests
        .filter((r) => r.status === 'approved')
        .reduce((acc, r) => acc + Number(r.durationAmount), 0);
      const pending = tot.requests.filter((r) => r.status === 'pending').length;
      const totalAllocated = tot.allocations.reduce((acc, a) => acc + Number(a.allocatedDays), 0);
      const totalUsed = tot.allocations.reduce((acc, a) => acc + Number(a.usedDays), 0);
      const rem = Math.max(0, totalAllocated - totalUsed);

      return {
        type: tot.name,
        approvedDays: approved,
        pending,
        remainingBalance: rem > 0 ? `${rem} Days` : 'N/A'
      };
    });

    return res.json({
      success: true,
      data: {
        totalNetSalaryPaid: Math.round((totalNetSalaryPaid + Number.EPSILON) * 100) / 100,
        payslipsGenerated,
        avgSalaryPerEmployee,
        approvedTimeOffDays,
        attendanceHealthPercent,
        activeHeadcount: activeEmployeesCount,
        attendanceOverview: {
          present: normalAttendances,
          late: lateAttendances,
          absent: absentAttendances,
          overtime: overtimeAttendances,
          missingCheckouts,
          manualEdits: Math.max(0, attendanceRecords.length - normalAttendances - absentAttendances),
          coveragePercent: attendanceHealthPercent
        },
        timeOffOverview
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getSalaryCostByDepartment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.query;
    const deptWhere: any = {};
    if (departmentId) {
      deptWhere.id = String(departmentId);
    }

    const departments = await prisma.department.findMany({
      where: deptWhere,
      include: {
        employees: {
          where: { status: 'active' },
          include: {
            contracts: {
              where: { status: 'running' },
              take: 1
            }
          }
        }
      }
    });

    const result = departments.map((dept) => {
      let monthlyBudget = 0;
      dept.employees.forEach((emp) => {
        if (emp.contracts[0]) {
          monthlyBudget += Number(emp.contracts[0].wagePerMonth);
        }
      });

      return {
        departmentId: dept.id,
        department: dept.name,
        headcount: dept.employees.length,
        salaryCost: Math.round((monthlyBudget + Number.EPSILON) * 100) / 100
      };
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getNetSalaryTrend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.query;
    const payslipWhere: any = {};
    if (departmentId) {
      payslipWhere.employee = { departmentId: String(departmentId) };
    }

    const payruns = await prisma.payrun.findMany({
      orderBy: { periodStart: 'asc' },
      include: {
        payslips: {
          where: payslipWhere,
          select: { netSalary: true, grossSalary: true }
        }
      },
      take: 12
    });

    const trend = payruns.map((pr) => {
      const net = pr.payslips.reduce((acc, s) => acc + Number(s.netSalary), 0);
      const gross = pr.payslips.reduce((acc, s) => acc + Number(s.grossSalary), 0);
      const monthLabel = new Date(pr.periodStart).toLocaleString('default', { month: 'short', year: 'numeric' });

      return {
        payrunName: pr.name,
        month: monthLabel,
        grossSalary: Math.round((gross + Number.EPSILON) * 100) / 100,
        netSalary: Math.round((net + Number.EPSILON) * 100) / 100
      };
    });

    return res.json({ success: true, data: trend });
  } catch (err) {
    next(err);
  }
};

export const getPayrollAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.query;
    const empWhere: any = { status: 'active' };
    if (departmentId) empWhere.departmentId = String(departmentId);

    const [missingBank, expiringContracts, openAttendances] = await Promise.all([
      prisma.employee.findMany({
        where: {
          ...empWhere,
          OR: [{ bankAccountNumber: null }, { bankAccountNumber: '' }]
        },
        select: { id: true, name: true, email: true }
      }),
      prisma.contract.findMany({
        where: {
          status: 'running',
          ...(departmentId ? { employee: { departmentId: String(departmentId) } } : {}),
          endDate: {
            not: null,
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: { employee: { select: { id: true, name: true } } }
      }),
      prisma.attendance.findMany({
        where: {
          checkOut: null,
          ...(departmentId ? { employee: { departmentId: String(departmentId) } } : {}),
          checkIn: { lte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        },
        include: { employee: { select: { id: true, name: true } } }
      })
    ]);

    const alerts = [];

    if (missingBank.length > 0) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        category: 'Payroll',
        message: `${missingBank.length} employee(s) missing bank details for payout.`,
        items: missingBank.map((m) => m.name)
      });
    }

    if (expiringContracts.length > 0) {
      alerts.push({
        type: 'info',
        severity: 'medium',
        category: 'Contracts',
        message: `${expiringContracts.length} contract(s) expiring within the next 30 days.`,
        items: expiringContracts.map((c) => `${c.employee.name} (ends ${c.endDate?.toLocaleDateString()})`)
      });
    }

    if (openAttendances.length > 0) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        category: 'Attendance',
        message: `${openAttendances.length} employee(s) with missing check-outs (>12 hours).`,
        items: openAttendances.map((a) => a.employee.name)
      });
    }

    return res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
};

export const getDepartmentOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.query;
    const deptWhere: any = {};
    if (departmentId) {
      deptWhere.id = String(departmentId);
    }

    const departments = await prisma.department.findMany({
      where: deptWhere,
      include: {
        manager: { select: { id: true, name: true } },
        employees: {
          where: { status: 'active' },
          include: {
            contracts: { where: { status: 'running' }, take: 1 }
          }
        }
      }
    });

    const overview = departments.map((d) => {
      let monthlySalary = 0;
      d.employees.forEach((e) => {
        if (e.contracts[0]) monthlySalary += Number(e.contracts[0].wagePerMonth);
      });

      return {
        id: d.id,
        name: d.name,
        managerName: d.manager?.name || 'Unassigned',
        headcount: d.employees.length,
        monthlySalary: Math.round((monthlySalary + Number.EPSILON) * 100) / 100
      };
    });

    return res.json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
};
