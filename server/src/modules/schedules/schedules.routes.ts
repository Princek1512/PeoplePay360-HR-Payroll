import { Router } from 'express';
import {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from './schedules.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('schedules', 'read'), listSchedules);
router.get('/:id', requirePermission('schedules', 'read'), getScheduleById);
router.post('/', requirePermission('schedules', 'create'), createSchedule);
router.patch('/:id', requirePermission('schedules', 'update'), updateSchedule);
router.delete('/:id', requirePermission('schedules', 'delete'), deleteSchedule);

export default router;
