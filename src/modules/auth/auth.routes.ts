import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import * as authController from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', authMiddleware, requireRole([UserRole.ADMIN]), asyncHandler(authController.register));
authRoutes.post('/login', asyncHandler(authController.login));
