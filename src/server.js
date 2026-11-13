import { logger, configureLogger, exitAfterLogging } from './config/logger.js';

// Fallas que nadie capturó: se registran como fatales y se cierra el proceso
process.on('uncaughtException', (error) => {
  logger.fatal(`Excepción no capturada: ${error.message}`, { stack: error.stack });
  exitAfterLogging(1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal(`Promesa rechazada sin manejar: ${reason?.message ?? reason}`, { stack: reason?.stack });
  exitAfterLogging(1);
});

const start = async () => {
  // La configuración se carga primero. Se importa de forma dinámica para que,
  // si falta una variable crítica, el error quede registrado como fatal en el log.
  let config;
  try {
    ({ config } = await import('./config/env.config.js'));
  } catch (error) {
    logger.fatal(`El servidor no puede arrancar: ${error.message}`);
    return exitAfterLogging(1);
  }

  configureLogger(config);

  const { connectDB } = await import('./config/db.js');
  const { default: app } = await import('./app.js');

  try {
    await connectDB(config.mongoUri);
  } catch (error) {
    logger.fatal(`No se pudo conectar a MongoDB: ${error.message}`);
    return exitAfterLogging(1);
  }

  app.listen(config.port, () => {
    logger.info(`Servidor ShipNow escuchando en el puerto ${config.port} (entorno: ${config.nodeEnv})`);
  });
};

start();
