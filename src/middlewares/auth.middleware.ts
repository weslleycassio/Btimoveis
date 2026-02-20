import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Token não informado' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Token malformado' });
    return;
  }

  try {
    const decoded = verifyJwt(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
