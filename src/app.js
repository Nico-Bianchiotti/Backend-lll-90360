import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.router.js';
import productsRouter from './routes/products.router.js';
import ordersRouter from './routes/orders.router.js';
import deliveriesRouter from './routes/deliveries.router.js';
import mocksRouter from './routes/mocks.router.js';
import loggerTestRouter from './routes/loggerTest.router.js';
import { config } from './config/env.config.js';
import { setupSwagger } from './config/swagger.js';
import { RouteNotFoundError } from './errors/customErrors.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { HTTP_STATUS } from './constants/index.js';

const app = express();

app.use(httpLogger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Documentación interactiva (Swagger UI) en /api/docs
setupSwagger(app);

app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/deliveries', deliveriesRouter);

// Endpoint interno para verificar que el logger registra todos los niveles
app.use('/api/loggerTest', loggerTestRouter);

// Los mocks son una herramienta de desarrollo: no existen en producción
if (!config.isProduction) {
  app.use('/api/mocks', mocksRouter);
}

app.use((req, res, next) => {
  next(new RouteNotFoundError(req.method, req.originalUrl));
});

app.use(errorHandler);

export default app;
