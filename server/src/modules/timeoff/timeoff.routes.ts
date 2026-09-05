import { Router } from 'express';
import {
  listTimeOffTypes,
  createTimeOffType,
  listAllocations,
  createAllocation,
  listRequests,
  createRequest,
  approveRequest,
  refuseRequest
} from './timeoff.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

// Types
router.get('/types', listTimeOffTypes);
router.post('/types', requirePermission('timeoff', 'create'), createTimeOffType);

// Allocations
router.get('/allocations', listAllocations);
router.post('/allocations', requirePermission('timeoff', 'create'), createAllocation);

// Requests
router.get('/requests', listRequests);
router.post('/requests', createRequest);
router.patch('/requests/:id/approve', requirePermission('timeoff', 'approve'), approveRequest);
router.patch('/requests/:id/refuse', requirePermission('timeoff', 'approve'), refuseRequest);

export default router;
