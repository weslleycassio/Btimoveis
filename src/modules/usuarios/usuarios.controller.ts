import { Request, Response } from 'express';
import * as usuariosService from './usuarios.service';

export async function listUsuarios(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const usuarios = await usuariosService.listUsuarios(req.user.imobiliariaId);

  res.status(200).json({
    data: usuarios,
    total: usuarios.length,
  });
}
