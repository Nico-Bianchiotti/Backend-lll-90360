import { logger } from '../config/logger.js';

// Proveedor de email simulado: en lugar de enviar, deja constancia en el log
const emailProvider = {
  send: async (message) => {
    logger.debug(`[EMAIL simulado] ${message}`);
  }
};

export default emailProvider;
