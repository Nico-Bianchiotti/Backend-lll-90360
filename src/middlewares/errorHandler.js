import { AppError } from '../errors/customErrors.js';
import { HTTP_STATUS } from '../constants/index.js';
import { logger } from '../config/logger.js';

const DATABASE_ERROR_NAMES = ['MongoServerSelectionError', 'MongooseServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError'];

// Convierte cualquier error en un AppError del diccionario.
// Los errores de Express y Mongoose se traducen a códigos conocidos;
// lo que no se reconoce queda como INTERNAL_ERROR.
const toAppError = (err) => {
  if (err instanceof AppError) return err;

  if (err.type === 'entity.parse.failed') {
    return new AppError('INVALID_JSON');
  }
  if (err.name === 'ValidationError' && err.errors) {
    const detail = Object.values(err.errors).map((e) => e.message).join('. ');
    return new AppError('VALIDATION_ERROR', detail);
  }
  if (err.name === 'CastError') {
    return new AppError('INVALID_ID', `El valor "${err.value}" no es válido para el campo ${err.path}`);
  }
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    return new AppError('DUPLICATE_KEY', fields ? `Ya existe un registro con ese ${fields}` : undefined);
  }
  if (DATABASE_ERROR_NAMES.includes(err.name) || /buffering timed out/i.test(err.message ?? '')) {
    return new AppError('DATABASE_UNAVAILABLE', undefined, { cause: err });
  }
  return new AppError('INTERNAL_ERROR', undefined, { cause: err });
};

// Middleware global: el único lugar que arma las respuestas de error.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const error = toAppError(err);
  const route = `${req.method} ${req.originalUrl}`;

  if (error.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    // Error inesperado o del servidor: detalle completo (con stack) solo en el log;
    // al cliente le llega el mensaje del diccionario
    const original = error.cause ?? error;
    logger.error(`${error.statusCode} ${error.code} en ${route}: ${original.message}`, { stack: original.stack });
  } else {
    // Error esperado o de negocio: queda como advertencia
    logger.warning(`${error.statusCode} ${error.code} en ${route}: ${error.message}`);
  }

  res.status(error.statusCode).json({
    status: 'error',
    statusCode: error.statusCode,
    error: error.code,
    message: error.message
  });
};
