import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './middlewares/error.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { imobiliariasRoutes } from './modules/imobiliarias/imobiliarias.routes';
import { imoveisRoutes } from './modules/imoveis/imoveis.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/imobiliarias', imobiliariasRoutes);
app.use('/auth', authRoutes);
app.use('/imoveis', imoveisRoutes);

app.use(errorMiddleware);
