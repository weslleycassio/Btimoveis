import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import * as authController from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(authController.register));
authRoutes.post('/login', asyncHandler(authController.login));
