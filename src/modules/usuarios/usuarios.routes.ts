import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import * as usuariosController from './usuarios.controller';

export const usuariosRoutes = Router();

usuariosRoutes.use(authMiddleware);
usuariosRoutes.get('/', requireRole([UserRole.ADMIN, UserRole.CORRETOR]), asyncHandler(usuariosController.listUsuarios));
