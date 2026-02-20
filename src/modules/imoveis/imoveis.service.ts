import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { CreateImovelInput, ListImoveisQuery, UpdateImovelInput } from './imoveis.schema';

export async function createImovel(data: CreateImovelInput) {
  return prisma.imovel.create({ data });
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
