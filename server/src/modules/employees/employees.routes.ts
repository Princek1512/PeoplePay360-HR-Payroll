import { Router } from 'express';
import {
  listEmployees,
  getEmployeeById,
  getEmployeeSmartMetrics,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from './employees.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

const requireEmployeeReadOrSelf = (req: any, res: any, next: any) => {
  if (req.user?.employeeId && req.user.employeeId === req.params.id) {
    return next();
  }
  return requirePermission('employees', 'read')(req, res, next);
};

router.get('/', requirePermission('employees', 'read'), listEmployees);
router.get('/:id', requireEmployeeReadOrSelf, getEmployeeById);
router.get('/:id/smart-metrics', requireEmployeeReadOrSelf, getEmployeeSmartMetrics);
router.post('/', requirePermission('employees', 'create'), createEmployee);
router.patch('/:id', requirePermission('employees', 'update'), updateEmployee);
router.delete('/:id', requirePermission('employees', 'delete'), deleteEmployee);

export default router;
