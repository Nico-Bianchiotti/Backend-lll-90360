// Error de la aplicación: lleva el status HTTP desde la lógica de negocio
// hasta el middleware de errores, sin que el Service conozca Express.
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export default AppError;
