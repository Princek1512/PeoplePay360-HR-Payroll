import { Router } from 'express';
import { login, getCurrentUser, refreshToken, changePassword } from './auth.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticateJwt, getCurrentUser);
router.post('/change-password', authenticateJwt, changePassword);

export default router;
