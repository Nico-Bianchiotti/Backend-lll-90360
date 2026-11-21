import { InvalidIdError } from '../errors/customErrors.js';

// Un ID de MongoDB (ObjectId) son 24 caracteres hexadecimales.
// Se valida con una expresión regular para no depender de Mongoose fuera de los repositories.
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const isValidId = (value) => typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

// Lanza INVALID_ID (400) si el valor no tiene formato de ID
export const assertValidId = (value, field) => {
  if (!isValidId(value)) {
    throw new InvalidIdError(field, value);
  }
};
