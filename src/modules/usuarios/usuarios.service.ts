import { prisma } from '../../db/prisma';

export async function listUsuarios(imobiliariaId: string): Promise<
  Array<{
    id: string;
    nome: string;
    email: string;
    role: string;
  }>
> {
  const usuarios = await prisma.user.findMany({
    where: { imobiliariaId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
    },
  });

  return usuarios;
}
