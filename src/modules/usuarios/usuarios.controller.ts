import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import * as usuariosService from './usuarios.service';

export async function listUsuarios(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const usuarioAutenticado = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, role: true, imobiliariaId: true },
  });

  if (!usuarioAutenticado) {
    res.status(401).json({ message: 'Usuário autenticado não encontrado' });
    return;
  }

  if (usuarioAutenticado.role !== UserRole.ADMIN) {
    res.status(403).json({ message: 'Sem permissão para esta operação' });
    return;
  }

  const usuarios = await usuariosService.listUsuarios(usuarioAutenticado.imobiliariaId);

  res.status(200).json({
    data: usuarios,
    total: usuarios.length,
  });
}
