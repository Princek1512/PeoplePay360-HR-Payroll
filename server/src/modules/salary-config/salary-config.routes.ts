import { Router } from 'express';
import {
  listStructures,
  getStructureById,
  createStructure,
  updateStructure,
  listRules,
  createRule,
  updateRule,
  deleteRule
} from './salary-config.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

// Structures
router.get('/structures', requirePermission('salaryStructures', 'read'), listStructures);
router.get('/structures/:id', requirePermission('salaryStructures', 'read'), getStructureById);
router.post('/structures', requirePermission('salaryStructures', 'create'), createStructure);
router.patch('/structures/:id', requirePermission('salaryStructures', 'update'), updateStructure);

// Rules
router.get('/rules', requirePermission('salaryRules', 'read'), listRules);
router.post('/rules', requirePermission('salaryRules', 'create'), createRule);
router.patch('/rules/:id', requirePermission('salaryRules', 'update'), updateRule);
router.delete('/rules/:id', requirePermission('salaryRules', 'delete'), deleteRule);

export default router;
