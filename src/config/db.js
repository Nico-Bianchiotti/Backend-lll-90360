import mongoose from 'mongoose';
import { logger } from './logger.js';

// Eventos de la conexión: permiten ver en el log si la base se cae o vuelve.
// Se registran después de la primera conexión exitosa.
const watchConnection = () => {
  mongoose.connection.on('disconnected', () => {
    logger.warning('Se perdió la conexión con MongoDB');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('Conexión con MongoDB restablecida');
  });
};

export const connectDB = async (mongoUri) => {
  logger.debug('Conectando a MongoDB...');
  // Si la base no responde, las operaciones fallan a los 10 s (por defecto son 30 s)
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  logger.info('Conexión a MongoDB establecida', { database: mongoose.connection.name });
  watchConnection();
};
