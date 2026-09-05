import { Request, Response, NextFunction } from 'express';
import { PayslipRenderService } from '../pdf/payslip-render.service.js';
import { UserRoleType } from '../../shared/types/roles.enum.js';
import { prisma } from '../../config/db.js';

export const renderPayslipHtml = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      select: { employeeId: true }
    });

    if (!payslip) {
      return res.status(404).send('<h1>Payslip not found</h1>');
    }

    // Role check: Employee can only see their own payslip
    if (
      req.user?.roles.length === 1 &&
      req.user.roles.includes(UserRoleType.EMPLOYEE) &&
      req.user.employeeId !== payslip.employeeId
    ) {
      return res.status(403).send('<h1>Forbidden: You cannot view other employees’ payslips</h1>');
    }

    const html = await PayslipRenderService.renderPayslipHtml(id);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    next(err);
  }
};
