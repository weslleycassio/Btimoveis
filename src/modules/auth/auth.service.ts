import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { signJwt } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

function normalizeUserIdBase(nome: string): string {
  const sanitized = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!sanitized) {
    throw new Error('Nome inválido para geração de identificador');
  }

  return sanitized;
}

async function generateUniqueUserId(nome: string, tx: Prisma.TransactionClient): Promise<string> {
  const baseId = normalizeUserIdBase(nome);

  for (let suffix = 0; ; suffix += 1) {
    const candidateId = suffix === 0 ? baseId : `${baseId}${suffix}`;
    const existingUser = await tx.user.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!existingUser) {
      return candidateId;
    }
  }
}

export async function register(data: RegisterInput): Promise<{ token: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.$transaction(async (tx) => {
    const userId = await generateUniqueUserId(data.nome, tx);

    const user = await tx.user.create({
      data: {
        id: userId,
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        passwordHash,
        role: data.role,
      },
    });

    try {
      const token = signJwt({
        sub: String(user.id),
        email: user.email,
        role: user.role,
      });

      return { token };
    } catch {
      throw new Error('Falha ao gerar token de autenticação');
    }
  });
}

export async function login(data: LoginInput): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatch) {
    throw new Error('Credenciais inválidas');
  }

  const token = signJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return { token };
}
