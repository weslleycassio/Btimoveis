import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { CreateImovelInput, ListImoveisQuery, UpdateImovelInput } from './imoveis.schema';

type AuthenticatedUser = {
  id: string;
  role: string;
};

function resolveCorretorCaptadorId(
  requestedCorretorCaptadorId: string | undefined,
  user: AuthenticatedUser,
): string {
  const isAdminOrCord = user.role === UserRole.ADMIN || user.role === UserRole.CORD;
  const isCorretor = user.role === UserRole.CORRETOR;

  if (!isAdminOrCord && !isCorretor) {
    throw new Error('Usuário sem permissão para cadastrar imóvel');
  }

  if (!requestedCorretorCaptadorId) {
    return user.id;
  }

  if (isAdminOrCord) {
    return requestedCorretorCaptadorId;
  }

  if (requestedCorretorCaptadorId !== user.id) {
    throw new Error('Corretor só pode cadastrar imóvel para si mesmo');
  }

  return user.id;
}

async function ensureCorretorExists(corretorCaptadorId: string) {
  const corretor = await prisma.user.findUnique({
    where: { id: corretorCaptadorId },
    select: { id: true },
  });

  if (!corretor) {
    throw new Error('Corretor captador informado não existe');
  }
}

export async function createImovel(data: CreateImovelInput, user: AuthenticatedUser) {
  const corretorCaptadorId = resolveCorretorCaptadorId(data.corretorCaptadorId, user);
  await ensureCorretorExists(corretorCaptadorId);

  return prisma.imovel.create({
    data: {
      ...data,
      corretorCaptadorId,
    },
  });
}

export async function listImoveis(query: ListImoveisQuery) {
  const { page, limit, minPreco, maxPreco, ...filters } = query;

  const where: Prisma.ImovelWhereInput = {
    ...filters,
    preco:
      minPreco !== undefined || maxPreco !== undefined
        ? {
            gte: minPreco,
            lte: maxPreco,
          }
        : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.imovel.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.imovel.count({ where }),
  ]);

  return {
    data: items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getImovelById(id: string) {
  const imovel = await prisma.imovel.findUnique({ where: { id } });

  if (!imovel) {
    throw new Error('Imóvel não encontrado');
  }

  return imovel;
}

export async function updateImovel(id: string, data: UpdateImovelInput) {
  await getImovelById(id);

  return prisma.imovel.update({
    where: { id },
    data,
  });
}

export async function deleteImovel(id: string) {
  await getImovelById(id);

  await prisma.imovel.delete({ where: { id } });
}
