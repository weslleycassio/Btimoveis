import { RegistroStatus, UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import {
  updateMeuUsuarioSchema,
  updateMinhaSenhaSchema,
  updateUsuarioSchema,
  usuarioIdParamSchema,
} from './usuarios.schema';
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

export async function updateUsuario(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  // Fallback defensivo: garante o comportamento correto para /usuarios/me
  // mesmo se houver algum problema de resolução de rota no runtime.
  if (req.params.id === 'me') {
    await updateMeuUsuario(req, res);
    return;
  }

  const { id } = usuarioIdParamSchema.parse(req.params);
  const body = updateUsuarioSchema.parse(req.body);

  const usuarioAutenticado = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, role: true, imobiliariaId: true },
  });

  if (!usuarioAutenticado) {
    res.status(401).json({ message: 'Usuário autenticado não encontrado' });
    return;
  }

  if (usuarioAutenticado.role !== UserRole.ADMIN) {
    res.status(403).json({ message: 'Acesso negado' });
    return;
  }

  const usuarioAlvo = await prisma.user.findUnique({
    where: { id },
    select: { id: true, imobiliariaId: true },
  });

  if (!usuarioAlvo) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  if (usuarioAlvo.imobiliariaId !== usuarioAutenticado.imobiliariaId) {
    res.status(403).json({ message: 'Você não pode editar usuários de outra imobiliária' });
    return;
  }

  const usuarioAtualizado = await usuariosService.updateUsuario(id, body);

  res.status(200).json({
    message: 'Usuário atualizado com sucesso',
    data: {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      telefone: usuarioAtualizado.telefone,
      role: usuarioAtualizado.role,
      ativo: usuarioAtualizado.status === RegistroStatus.ATIVO,
    },
  });
}

export async function updateMeuUsuario(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const body = updateMeuUsuarioSchema.parse(req.body);

  const usuarioAutenticado = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true },
  });

  if (!usuarioAutenticado) {
    res.status(404).json({ message: 'Usuário não encontrado' });
    return;
  }

  if (body.email && body.email !== usuarioAutenticado.email) {
    const emailEmUso = await prisma.user.findFirst({
      where: {
        email: body.email,
        id: { not: usuarioAutenticado.id },
      },
      select: { id: true },
    });

    if (emailEmUso) {
      res.status(400).json({ error: 'E-mail já está em uso' });
      return;
    }
  }

  const usuarioAtualizado = await usuariosService.updateMeuUsuario(usuarioAutenticado.id, body);

  res.status(200).json({
    message: 'Dados atualizados com sucesso',
    data: {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      telefone: usuarioAtualizado.telefone,
      role: usuarioAtualizado.role,
      ativo: usuarioAtualizado.status === RegistroStatus.ATIVO,
    },
  });
}


export async function updateMinhaSenha(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const body = updateMinhaSenhaSchema.parse(req.body);

  const result = await usuariosService.updateMinhaSenha({
    userId: req.user.id,
    senhaAtual: body.senhaAtual,
    novaSenha: body.novaSenha,
    confirmarNovaSenha: body.confirmarNovaSenha,
  });

  res.status(200).json(result);
}
