import { Request, Response } from 'express';
import {
  createImovelSchema,
  idParamSchema,
  listImoveisQuerySchema,
  updateImovelSchema,
} from './imoveis.schema';
import * as imoveisService from './imoveis.service';

export async function createImovel(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new Error('Usuário não autenticado');
  }

  const body = createImovelSchema.parse(req.body);
  const result = await imoveisService.createImovel(body, req.user);
  res.status(201).json(result);
}

export async function listImoveis(req: Request, res: Response): Promise<void> {
  const query = listImoveisQuerySchema.parse(req.query);
  const result = await imoveisService.listImoveis(query);
  res.status(200).json(result);
}

export async function getImovelById(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const result = await imoveisService.getImovelById(id);
  res.status(200).json(result);
}

export async function updateImovel(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const body = updateImovelSchema.parse(req.body);
  const result = await imoveisService.updateImovel(id, body);
  res.status(200).json(result);
}

export async function deleteImovel(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  await imoveisService.deleteImovel(id);
  res.status(204).send();
}
