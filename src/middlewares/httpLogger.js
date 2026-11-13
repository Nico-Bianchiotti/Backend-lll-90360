import { logger } from '../config/logger.js';

// Registra cada petición HTTP (nivel http) con su status y duración.
// Ejemplo: "GET /api/orders 200 - 12.4 ms"
export const httpLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)} ms`);
  });

  next();
};
