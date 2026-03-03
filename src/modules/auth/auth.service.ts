import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { signJwt } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

export async function register(data: RegisterInput): Promise<{ token: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

 const token = signJwt({
  sub: String(user.id),
  email: user.email,
  role: user.role,
});

  return { token };
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
