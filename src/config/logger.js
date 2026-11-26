import winston from 'winston';
import 'winston-daily-rotate-file';

// Logger centralizado de ShipNow (Winston).
// Todos los archivos importan este mismo logger: la configuración vive solo acá.

// Niveles personalizados: cuanto más bajo el número, más grave.
// Un transporte con nivel "info" registra info, warning, error y fatal.
export const LOG_LEVELS = Object.freeze({
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5
});

winston.addColors({
  fatal: 'bold white redBG',
  error: 'red',
  warning: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
});

// Nivel mínimo que se muestra según el entorno
const LEVEL_BY_ENVIRONMENT = Object.freeze({
  development: 'debug',
  test: 'warning',
  production: 'info'
});

const LOGS_DIR = 'logs';
const LEVEL = Symbol.for('level');
const LONGEST_LEVEL = Math.max(...Object.keys(LOG_LEVELS).map((name) => name.length));

// Formato: "2026-08-01 10:12:03 [info]    mensaje {"metadatos":"..."}"
// Si el log trae un stack (errores), se agrega en las líneas siguientes.
const lineFormat = winston.format.printf((info) => {
  const { timestamp, level, message, stack, ...meta } = info;
  const padding = ' '.repeat(LONGEST_LEVEL - info[LEVEL].length);
  const metaText = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const stackText = stack ? `\n${stack}` : '';
  return `${timestamp} [${level}]${padding} ${message}${metaText}${stackText}`;
});

const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' });

const consoleTransport = new winston.transports.Console({
  level: LEVEL_BY_ENVIRONMENT.development,
  format: winston.format.combine(timestamp, winston.format.colorize(), lineFormat)
});

// Solo error y fatal, un archivo por día, se conservan 14 días
const errorFileTransport = new winston.transports.DailyRotateFile({
  level: 'error',
  dirname: LOGS_DIR,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(timestamp, lineFormat)
});

// Historial general (respeta el nivel del entorno), un archivo por día, se conservan 7 días
const combinedFileTransport = new winston.transports.DailyRotateFile({
  level: LEVEL_BY_ENVIRONMENT.development,
  dirname: LOGS_DIR,
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d',
  format: winston.format.combine(timestamp, lineFormat)
});

export const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: 'debug',
  transports: [consoleTransport, errorFileTransport, combinedFileTransport]
});

// Ajusta el logger al entorno definido en la configuración (módulo 1).
// Se llama al arrancar, apenas se validan las variables de entorno.
// Hasta ese momento el logger usa los valores de desarrollo.
export const configureLogger = (config) => {
  const level = LEVEL_BY_ENVIRONMENT[config.nodeEnv] ?? LEVEL_BY_ENVIRONMENT.production;
  consoleTransport.level = level;
  combinedFileTransport.level = level;
  // En testing la consola queda en silencio para no mezclar logs con el reporte de Mocha
  // (los archivos de logs/ siguen registrando).
  consoleTransport.silent = config.nodeEnv === 'test';
  logger.debug(`Logger configurado para el entorno "${config.nodeEnv}" (nivel mínimo: ${level})`);
};

export const getLoggerSettings = () => ({
  levels: Object.keys(LOG_LEVELS),
  consoleLevel: consoleTransport.level,
  files: {
    errors: `${LOGS_DIR}/error-AAAA-MM-DD.log (solo error y fatal, se conservan 14 días)`,
    combined: `${LOGS_DIR}/combined-AAAA-MM-DD.log (nivel ${combinedFileTransport.level} en adelante, se conservan 7 días)`
  }
});

// Espera a que los archivos terminen de escribirse antes de cerrar el proceso,
// para no perder el último log (por ejemplo, un fatal al arrancar).
export const exitAfterLogging = (code) => {
  const fileTransports = [errorFileTransport, combinedFileTransport];
  let pending = fileTransports.length;

  // Por las dudas, si algo se traba, el proceso se cierra igual a los 3 segundos
  setTimeout(() => process.exit(code), 3000).unref();

  // Se deja pasar un instante para que los últimos logs lleguen a los archivos
  setTimeout(() => {
    fileTransports.forEach((transport) => {
      transport.once('finish', () => {
        pending -= 1;
        if (pending === 0) process.exit(code);
      });
      transport.close();
    });
  }, 100);
};
