import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.router.js';
import productsRouter from './routes/products.router.js';
import mocksRouter from './routes/mocks.router.js';
import { config } from './config/env.config.js';
import AppError from './utils/errors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { HTTP_STATUS } from './constants/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);

// Los mocks son una herramienta de desarrollo: no existen en producción
if (!config.isProduction) {
  app.use('/api/mocks', mocksRouter);
}

app.use((req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
});

app.use(errorHandler);

export default app;
