import { Router } from 'express';
import { listUsers, createUser, updateUserRoles } from './users.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/rbac.guard.js';
import { UserRoleType } from '../../shared/types/roles.enum.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireRoles(UserRoleType.ADMIN));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUserRoles);

export default router;
