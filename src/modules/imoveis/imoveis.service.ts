import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { deleteObject, imageStorageRules, uploadImage } from '../../shared/storage/minio.storage';
import { AppError, ForbiddenError, NotFoundError } from '../../utils/app-error';
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

const imovelWithImagesInclude = Prisma.validator<Prisma.ImovelInclude>()({
  imagens: {
    orderBy: [{ isCapa: 'desc' }, { ordem: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      url: true,
      ordem: true,
      isCapa: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
  },
});

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
      include: imovelWithImagesInclude,
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
  const imovel = await prisma.imovel.findUnique({
    where: { id },
    include: imovelWithImagesInclude,
  });

  if (!imovel) {
    throw new NotFoundError('Imóvel não encontrado');
  }

  return imovel;
}

export async function updateImovel(id: string, data: UpdateImovelInput, user: AuthenticatedUser) {
  const imovel = await prisma.imovel.findUnique({ where: { id } });

  if (!imovel) {
    throw new NotFoundError('Imóvel não encontrado');
  }

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

export async function uploadImovelImagens(
  imovelId: string,
  files: Express.Request['files'],
  user: AuthenticatedUser,
) {
  if (!files || files.length === 0) {
    throw new AppError('Nenhuma imagem enviada no campo "imagens"', 400);
  }

  const imovel = await prisma.imovel.findUnique({
    where: { id: imovelId },
    select: {
      id: true,
      corretorCaptadorId: true,
      imagens: {
        select: { id: true },
      },
    },
  });

  if (!imovel) {
    throw new NotFoundError('Imóvel não encontrado');
  }

  if (user.role !== UserRole.ADMIN && user.id !== imovel.corretorCaptadorId) {
    throw new ForbiddenError('Você não tem permissão para adicionar imagens neste imóvel');
  }

  const totalAfterUpload = imovel.imagens.length + files.length;
  if (totalAfterUpload > imageStorageRules.maxPerImovel) {
    throw new AppError(`Um imóvel pode ter no máximo ${imageStorageRules.maxPerImovel} imagens`, 400);
  }

  const uploaded: Array<{ storageKey: string; url: string; size: number; mimeType: string }> = [];

  try {
    for (const file of files) {
      const image = await uploadImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        imovelId,
        originalName: file.originalname,
      });

      uploaded.push(image);
    }

    const created = await prisma.$transaction(async (tx) => {
      const lastImage = await tx.imovelImagem.findFirst({
        where: { imovelId },
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });

      const ordemInicial = (lastImage?.ordem ?? -1) + 1;
      const isPrimeiraImagem = imovel.imagens.length === 0;

      const imagensCriadas = await Promise.all(
        uploaded.map((item, index) =>
          tx.imovelImagem.create({
            data: {
              imovelId,
              url: item.url,
              storageProvider: 'minio',
              storageKey: item.storageKey,
              mimeType: item.mimeType,
              size: item.size,
              ordem: ordemInicial + index,
              isCapa: isPrimeiraImagem && index === 0,
              uploadedByUserId: user.id,
            },
            select: {
              id: true,
              url: true,
              ordem: true,
              isCapa: true,
            },
          }),
        ),
      );

      return imagensCriadas;
    });

    return created;
  } catch (error) {
    await Promise.all(uploaded.map((item) => deleteObject(item.storageKey).catch(() => null)));
    throw error;
  }
}

export async function deleteImovelImagem(
  imovelId: string,
  imagemId: string,
  user: AuthenticatedUser,
): Promise<void> {
  const image = await prisma.imovelImagem.findUnique({
    where: { id: imagemId },
    select: {
      id: true,
      imovelId: true,
      storageKey: true,
      isCapa: true,
      imovel: {
        select: {
          corretorCaptadorId: true,
        },
      },
    },
  });

  if (!image || image.imovelId !== imovelId) {
    throw new NotFoundError('Imagem do imóvel não encontrada');
  }

  if (user.role !== UserRole.ADMIN && user.id !== image.imovel.corretorCaptadorId) {
    throw new ForbiddenError('Você não tem permissão para remover imagens deste imóvel');
  }

  await prisma.$transaction(async (tx) => {
    await deleteObject(image.storageKey);
    await tx.imovelImagem.delete({ where: { id: imagemId } });

    if (image.isCapa) {
      const nextCapa = await tx.imovelImagem.findFirst({
        where: { imovelId },
        orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
      });

      if (nextCapa) {
        await tx.imovelImagem.update({
          where: { id: nextCapa.id },
          data: { isCapa: true },
        });
      }
    }
  });
}

export async function deleteImovel(id: string) {
  const imovel = await prisma.imovel.findUnique({
    where: { id },
    select: {
      id: true,
      imagens: { select: { storageKey: true } },
    },
  });

  if (!imovel) {
    throw new NotFoundError('Imóvel não encontrado');
  }

  await Promise.all(imovel.imagens.map((imagem) => deleteObject(imagem.storageKey).catch(() => null)));
  await prisma.imovel.delete({ where: { id } });
}
