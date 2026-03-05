import { prisma } from '../../db/prisma';

export async function listUsuarios(imobiliariaId: string): Promise<
  Array<{
    id: string;
    nome: string;
    telefone: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const usuarios = await prisma.user.findMany({
    where: { imobiliariaId, createdByRegister: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nome: true,
      telefone: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return usuarios;
}
