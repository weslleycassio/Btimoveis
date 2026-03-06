import { Request, Response } from 'express';
import { loginSchema, registerSchema } from './auth.schema';
import * as authService from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const { nome, email, password, telefone } = req.body as {
    nome?: string;
    email?: string;
    password?: string;
    telefone?: string;
  };

  if (!nome || nome.trim() === '') {
    res.status(400).json({ error: 'Nome é obrigatório' });
    return;
  }

  if (!email || email.trim() === '') {
    res.status(400).json({ error: 'Email é obrigatório' });
    return;
  }

  if (!password || password.trim() === '') {
    res.status(400).json({ error: 'Senha é obrigatória' });
    return;
  }

  if (!telefone || telefone.trim() === '') {
    res.status(400).json({ error: 'Telefone é obrigatório' });
    return;
  }

  const body = registerSchema.parse(req.body);

  if (!req.user) {
    res.status(401).json({ message: 'Usuário não autenticado' });
    return;
  }

  const result = await authService.register(body, req.user.imobiliariaId);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);
  res.status(200).json(result);
}
