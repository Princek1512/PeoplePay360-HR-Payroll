import { Router } from 'express';
import {
  listPayruns,
  getPayrunById,
  previewScope,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPaid,
  sendPayslips,
  listPayslips,
  getPayslipById
} from './payroll.controller.js';
import { renderPayslipHtml } from './payslip-preview.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

// Payruns
router.get('/payruns', requirePermission('payruns', 'read'), listPayruns);
router.get('/payruns/:id', requirePermission('payruns', 'read'), getPayrunById);
router.post('/payruns/scope-preview', requirePermission('payruns', 'create'), previewScope);
router.post('/payruns', requirePermission('payruns', 'create'), createPayrun);
router.post('/payruns/:id/compute', requirePermission('payruns', 'update'), computePayrun);
router.post('/payruns/:id/validate', requirePermission('payruns', 'update'), validatePayrun);
router.post('/payruns/:id/mark-paid', requirePermission('payruns', 'update'), markPaid);
router.post('/payruns/:id/send-payslips', requirePermission('payruns', 'update'), sendPayslips);

// Payslips
router.get('/payslips', listPayslips);
router.get('/payslips/:id', getPayslipById);
router.get('/payslips/:id/html', renderPayslipHtml);

export default router;
