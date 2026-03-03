import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { ForbiddenError, NotFoundError } from '../../utils/app-error';
import {
  CreateImovelInput,
  ListImoveisQuery,
  UpdateImovelInput,
} from './imoveis.schema';
import {
  assertCanEditImovel,
  resolveUpdatedCorretorCaptadorId,
} from './imoveis.permissions';

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
    throw new ForbiddenError('Usuário sem permissão para cadastrar imóvel');
  }

  if (!requestedCorretorCaptadorId) {
    return user.id;
  }

  if (isAdminOrCord) {
    return requestedCorretorCaptadorId;
  }

  if (requestedCorretorCaptadorId !== user.id) {
    throw new ForbiddenError('Corretor só pode cadastrar imóvel para si mesmo');
  }

  return user.id;
}

async function ensureCorretorExists(corretorCaptadorId: string) {
  const corretor = await prisma.user.findUnique({
    where: { id: corretorCaptadorId },
    select: { id: true },
  });

  if (!corretor) {
    throw new NotFoundError('Corretor captador informado não existe');
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
    throw new NotFoundError('Imóvel não encontrado');
  }

  return imovel;
}

export async function updateImovel(id: string, data: UpdateImovelInput, user: AuthenticatedUser) {
  const imovel = await getImovelById(id);

  assertCanEditImovel(user, imovel);

  const { motivoEdicao, ...updateData } = data;
  const corretorCaptadorId = resolveUpdatedCorretorCaptadorId(
    updateData.corretorCaptadorId,
    user,
    imovel,
  );

  await ensureCorretorExists(corretorCaptadorId);

  const finalUpdateData: Prisma.ImovelUncheckedUpdateInput = {
    ...updateData,
    corretorCaptadorId,
  };

  const camposAlterados = Object.keys(updateData).filter((field) => {
    if (field === 'corretorCaptadorId') {
      return corretorCaptadorId !== imovel.corretorCaptadorId;
    }

    const fieldKey = field as keyof typeof imovel;
    return updateData[field as keyof typeof updateData] !== imovel[fieldKey];
  });

  return prisma.$transaction(async (tx) => {
    const updatedImovel = await tx.imovel.update({
      where: { id },
      data: finalUpdateData,
    });

    await tx.imovelEdicao.create({
      data: {
        imovelId: id,
        editadoPorUserId: user.id,
        motivoEdicao,
        camposAlterados,
      },
    });

    return updatedImovel;
  });
}

export async function deleteImovel(id: string) {
  await getImovelById(id);

  await prisma.imovel.delete({ where: { id } });
}
