import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/async-handler';
import * as imoveisController from './imoveis.controller';

export const imoveisRoutes = Router();

imoveisRoutes.use(authMiddleware);

imoveisRoutes.post('/', asyncHandler(imoveisController.createImovel));
imoveisRoutes.get('/', asyncHandler(imoveisController.listImoveis));
imoveisRoutes.get('/:id', asyncHandler(imoveisController.getImovelById));
imoveisRoutes.put('/:id', asyncHandler(imoveisController.updateImovel));
imoveisRoutes.delete('/:id', asyncHandler(imoveisController.deleteImovel));
