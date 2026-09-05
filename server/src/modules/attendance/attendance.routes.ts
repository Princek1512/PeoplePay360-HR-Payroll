import { Router } from 'express';
import {
  listAttendance,
  getAttendanceStatus,
  toggleCheckIn,
  correctAttendance
} from './attendance.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.guard.js';

const router = Router();

router.use(authenticateJwt);

router.get('/', listAttendance);
router.get('/status', getAttendanceStatus);
router.post('/toggle', toggleCheckIn);
router.patch('/:id', requirePermission('attendance', 'update'), correctAttendance);

export default router;
