import { Router } from 'express';
import {
  getDashboardSummary,
  getSalaryCostByDepartment,
  getNetSalaryTrend,
  getPayrollAlerts,
  getDepartmentOverview
} from './dashboard.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);
router.use(requirePermission('dashboard', 'read'));

router.get('/summary', getDashboardSummary);
router.get('/salary-cost-by-department', getSalaryCostByDepartment);
router.get('/net-salary-trend', getNetSalaryTrend);
router.get('/alerts', getPayrollAlerts);
router.get('/departments', getDepartmentOverview);

export default router;
