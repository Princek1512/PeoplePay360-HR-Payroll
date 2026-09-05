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

router.get('/', requirePermission('employees', 'read'), listEmployees);
router.get('/:id', requirePermission('employees', 'read'), getEmployeeById);
router.get('/:id/smart-metrics', requirePermission('employees', 'read'), getEmployeeSmartMetrics);
router.post('/', requirePermission('employees', 'create'), createEmployee);
router.patch('/:id', requirePermission('employees', 'update'), updateEmployee);
router.delete('/:id', requirePermission('employees', 'delete'), deleteEmployee);

export default router;
