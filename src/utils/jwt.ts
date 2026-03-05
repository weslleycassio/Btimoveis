import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  imobiliariaId: string;
};

export function signJwt(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN ?? '1d') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
