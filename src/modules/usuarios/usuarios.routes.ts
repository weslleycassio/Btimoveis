import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import * as usuariosController from './usuarios.controller';

export const usuariosRoutes = Router();

usuariosRoutes.use(authMiddleware);
usuariosRoutes.get('/', asyncHandler(usuariosController.listUsuarios));
usuariosRoutes.put('/:id', asyncHandler(usuariosController.updateUsuario));
