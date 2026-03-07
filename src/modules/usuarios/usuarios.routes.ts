import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import * as usuariosController from './usuarios.controller';

export const usuariosRoutes = Router();

usuariosRoutes.use(authMiddleware);
usuariosRoutes.get('/', asyncHandler(usuariosController.listUsuarios));
usuariosRoutes.put('/me', asyncHandler(usuariosController.updateMeuUsuario));
usuariosRoutes.put('/id/:id', asyncHandler(usuariosController.updateUsuario));
usuariosRoutes.put('/:id((?!me$)[^/]+)', asyncHandler(usuariosController.updateUsuario));
