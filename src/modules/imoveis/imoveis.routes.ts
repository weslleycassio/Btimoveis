import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { memoryMultipartArray } from '../../middlewares/multipart.middleware';
import { asyncHandler } from '../../utils/async-handler';
import * as imoveisController from './imoveis.controller';

export const imoveisRoutes = Router();

imoveisRoutes.use(authMiddleware);

imoveisRoutes.post('/', asyncHandler(imoveisController.createImovel));
imoveisRoutes.get('/', asyncHandler(imoveisController.listImoveis));
imoveisRoutes.get('/:id', asyncHandler(imoveisController.getImovelById));
imoveisRoutes.post(
  '/:id/imagens',
  memoryMultipartArray('imagens', 10),
  asyncHandler(imoveisController.uploadImovelImagens),
);
imoveisRoutes.delete('/:id/imagens/:imagemId', asyncHandler(imoveisController.deleteImovelImagem));
imoveisRoutes.put('/:id', asyncHandler(imoveisController.updateImovel));
imoveisRoutes.delete('/:id', asyncHandler(imoveisController.deleteImovel));
