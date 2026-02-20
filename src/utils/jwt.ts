import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    subject: payload.sub,
  });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
