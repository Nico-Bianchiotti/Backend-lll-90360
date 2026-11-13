import { logger, getLoggerSettings } from '../config/logger.js';
import { HTTP_STATUS } from '../constants/index.js';

// Herramienta interna: genera un log de cada nivel para verificar la configuración.
// No representa una funcionalidad del negocio.
class LoggerTestController {
  run(req, res) {
    const simulatedError = new Error('El campo "deliveryAddress.city" es obligatorio');
    simulatedError.name = 'ValidationError';

    logger.debug('[PRUEBA] Nivel debug: detalle técnico para desarrollo', { endpoint: req.originalUrl });
    logger.http(`[PRUEBA] Nivel http: ${req.method} ${req.originalUrl}`);
    logger.info('[PRUEBA] Nivel info: pedido #TEST-001 creado correctamente');
    logger.warning('[PRUEBA] Nivel warning: pedido #TEST-002 sin repartidor asignado');
    logger.error(`[PRUEBA] Nivel error: falló la creación del pedido: ${simulatedError.name} (${simulatedError.message})`, { stack: simulatedError.stack });
    logger.fatal('[PRUEBA] Nivel fatal: falla crítica simulada, se perdió la conexión con la base de datos');

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      payload: {
        message: 'Se registró un log de cada nivel. Revisá la consola y la carpeta logs/',
        ...getLoggerSettings()
      }
    });
  }
}

export default new LoggerTestController();
