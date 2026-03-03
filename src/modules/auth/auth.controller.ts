import { Request, Response } from 'express';
import { loginSchema, registerSchema } from './auth.schema';
import * as authService from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {

  const body = registerSchema.parse(req.body);
  console.log("chegou aqui")
  const result = await authService.register(body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body);
  res.status(200).json(result);
}
