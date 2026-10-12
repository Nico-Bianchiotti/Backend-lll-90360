import { HTTP_STATUS } from '../constants/index.js';

// Único lugar que arma las respuestas de error.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message;

  if (err.name === 'ValidationError') {
    // Validaciones del schema de Mongoose (campo obligatorio, mínimo, enum...)
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.code === 11000) {
    // Clave duplicada (campos unique: email, code)
    statusCode = HTTP_STATUS.CONFLICT;
    message = `Ya existe un registro con ese ${Object.keys(err.keyValue || {}).join(', ')}`;
  } else if (err.type === 'entity.parse.failed') {
    // JSON mal formado en el body
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'El body no es un JSON válido';
  }

  if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    // Error inesperado: detalle completo en el log, mensaje genérico al cliente
    console.error(err);
    message = 'Error interno del servidor';
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};
