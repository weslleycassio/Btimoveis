import { Request, Response } from 'express';
import {
  createImovelSchema,
  idParamSchema,
  listImoveisQuerySchema,
  updateImovelSchema,
} from './imoveis.schema';
import * as imoveisService from './imoveis.service';

function ensureImobiliariaId(req: Request): string {
  if (!req.user?.imobiliariaId) {
    throw new Error('Usuário sem imobiliária vinculada');
  }

  return req.user.imobiliariaId;
}

export async function createImovel(req: Request, res: Response): Promise<void> {
  const body = createImovelSchema.parse(req.body);
  const result = await imoveisService.createImovel(body, ensureImobiliariaId(req));
  res.status(201).json(result);
}

export async function listImoveis(req: Request, res: Response): Promise<void> {
  const query = listImoveisQuerySchema.parse(req.query);
  const result = await imoveisService.listImoveis(query, ensureImobiliariaId(req));
  res.status(200).json(result);
}

export async function getImovelById(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const result = await imoveisService.getImovelById(id, ensureImobiliariaId(req));
  res.status(200).json(result);
}

export async function updateImovel(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  const body = updateImovelSchema.parse(req.body);
  const result = await imoveisService.updateImovel(id, body, ensureImobiliariaId(req));
  res.status(200).json(result);
}

export async function deleteImovel(req: Request, res: Response): Promise<void> {
  const { id } = idParamSchema.parse(req.params);
  await imoveisService.deleteImovel(id, ensureImobiliariaId(req));
  res.status(204).send();
}
