import { Router } from 'express';
import { login, getCurrentUser, refreshToken } from './auth.controller.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticateJwt, getCurrentUser);

export default router;
