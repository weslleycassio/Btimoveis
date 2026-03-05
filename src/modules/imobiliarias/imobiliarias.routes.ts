import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import * as imobiliariasController from './imobiliarias.controller';

export const imobiliariasRoutes = Router();

imobiliariasRoutes.post('/', asyncHandler(imobiliariasController.createImobiliaria));
