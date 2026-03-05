import bcrypt from 'bcrypt';
import { RegistroStatus, UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { signJwt } from '../../utils/jwt';
import { CreateImobiliariaInput } from './imobiliarias.schema';

export async function createImobiliariaComAdmin(input: CreateImobiliariaInput) {
  const emailExists = await prisma.user.findUnique({ where: { email: input.admin.email } });

  if (emailExists) {
    throw new Error('Email do admin já cadastrado');
  }

  const passwordHash = await bcrypt.hash(input.admin.password, 10);

  const { imobiliaria, admin } = await prisma.$transaction(async (tx) => {
    const imobiliaria = await tx.imobiliaria.create({
      data: {
        nome: input.imobiliaria.nome,
        telefone: input.imobiliaria.telefone,
        email: input.imobiliaria.email,
        cnpj: input.imobiliaria.cnpj,
        status: RegistroStatus.ATIVO,
      },
    });

    const admin = await tx.user.create({
      data: {
        nome: input.admin.nome,
        telefone: input.admin.telefone,
        email: input.admin.email,
        passwordHash,
        role: UserRole.ADMIN,
        status: RegistroStatus.ATIVO,
        imobiliariaId: imobiliaria.id,
      },
      select: {
        id: true,
        nome: true,
        telefone: true,
        email: true,
        role: true,
        status: true,
        imobiliariaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { imobiliaria, admin };
  });

  const token = input.returnToken
    ? signJwt({
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        imobiliariaId: admin.imobiliariaId,
      })
    : undefined;

  return { imobiliaria, admin, token };
}
