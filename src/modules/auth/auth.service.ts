import bcrypt from 'bcrypt';
import { prisma } from '../../db/prisma';
import { signJwt } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

export async function register(
  data: RegisterInput,
  imobiliariaId: string,
): Promise<{ id: string; nome: string; telefone: string; email: string; role: string; imobiliariaId: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      nome: data.nome,
      telefone: data.telefone,
      email: data.email,
      passwordHash,
      role: data.role,
      createdByRegister: true,
      imobiliariaId,
    },
    select: {
      id: true,
      nome: true,
      telefone: true,
      email: true,
      role: true,
      imobiliariaId: true,
    },
  });

  return user;
}

export async function login(data: LoginInput): Promise<{
  token: string;
  user: {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    role: string;
    imobiliariaId: string;
  };
}> {
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
    imobiliariaId: user.imobiliariaId,
  });

  return {
    token,
    user: {
      id: user.id,
      nome: user.nome,
      telefone: user.telefone,
      email: user.email,
      role: user.role,
      imobiliariaId: user.imobiliariaId,
    },
  };
}
