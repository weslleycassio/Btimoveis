import { Request, Response } from 'express';
import { createImobiliariaSchema } from './imobiliarias.schema';
import * as imobiliariasService from './imobiliarias.service';

export async function createImobiliaria(req: Request, res: Response): Promise<void> {
  const body = createImobiliariaSchema.parse(req.body);
  const result = await imobiliariasService.createImobiliariaComAdmin(body);
  res.status(201).json(result);
}
