import { Router } from 'express';
import {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract
} from './contracts.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('contracts', 'read'), listContracts);
router.get('/:id', requirePermission('contracts', 'read'), getContractById);
router.post('/', requirePermission('contracts', 'create'), createContract);
router.patch('/:id', requirePermission('contracts', 'update'), updateContract);
router.delete('/:id', requirePermission('contracts', 'delete'), deleteContract);

export default router;
