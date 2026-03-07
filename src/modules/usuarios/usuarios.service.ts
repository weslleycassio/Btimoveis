import { RegistroStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../../db/prisma';
import { UpdateMeuUsuarioInput, UpdateMinhaSenhaInput, UpdateUsuarioInput } from './usuarios.schema';

export async function listUsuarios(imobiliariaId: string): Promise<
  Array<{
    id: string;
    nome: string;
    email: string;
    telefone: string;
    role: UserRole;
    ativo: boolean;
  }>
> {
  const usuarios = await prisma.user.findMany({
    where: { imobiliariaId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      role: true,
      status: true,
    },
  });

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone,
    role: usuario.role,
    ativo: usuario.status === RegistroStatus.ATIVO,
  }));
}

export async function updateUsuario(id: string, data: UpdateUsuarioInput) {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.role && { role: data.role }),
      ...(data.telefone && { telefone: data.telefone }),
      ...(typeof data.ativo === 'boolean' && {
        status: data.ativo ? RegistroStatus.ATIVO : RegistroStatus.INATIVO,
      }),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      role: true,
      status: true,
    },
  });
}

export async function updateMeuUsuario(userId: string, data: UpdateMeuUsuarioInput) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.nome && { nome: data.nome }),
      ...(data.email && { email: data.email }),
      ...(data.telefone && { telefone: data.telefone }),
    },
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      role: true,
      status: true,
    },
  });
}


export async function updateMinhaSenha(data: UpdateMinhaSenhaInput & { userId: string }) {
  const usuario = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, passwordHash: true },
  });

  if (!usuario) {
    throw new Error('Usuário não encontrado');
  }

  const senhaConfere = await bcrypt.compare(data.senhaAtual, usuario.passwordHash);

  if (!senhaConfere) {
    throw new Error('Senha atual inválida');
  }

  if (data.novaSenha !== data.confirmarNovaSenha) {
    throw new Error('Nova senha e confirmação da senha não conferem');
  }

  const novaSenhaHash = await bcrypt.hash(data.novaSenha, 10);

  await prisma.user.update({
    where: { id: data.userId },
    data: {
      passwordHash: novaSenhaHash,
    },
  });

  return {
    message: 'Senha atualizada com sucesso',
  };
}
