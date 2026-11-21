import { isValidId } from '../utils/validators.js';
import { InvalidIdError } from '../errors/customErrors.js';

// Se engancha con router.param('id', validateIdParam): corre antes del controller
// en cualquier ruta que tenga :id y corta con 400 INVALID_ID si el formato es incorrecto.
// Así, 400 = "el ID está mal escrito" y 404 = "el ID es válido pero no existe".
export const validateIdParam = (req, res, next, value, name) => {
  if (!isValidId(value)) {
    return next(new InvalidIdError(name, value));
  }
  next();
};
