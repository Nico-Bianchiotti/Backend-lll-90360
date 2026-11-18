import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './env.config.js';
import { logger } from './logger.js';

// Configuración de Swagger / OpenAPI.
// Acá solo vive la configuración: la documentación de cada módulo está en
// src/docs/*.yaml y la lógica de las rutas no se toca.

const DOCS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');

export const DOCS_ROUTE = '/api/docs';

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API',
    version: '1.0.0',
    description: [
      'API de logística de **ShipNow**: gestiona usuarios (clientes y repartidores), productos, pedidos y entregas.',
      '',
      '**Propósito de esta documentación:** consultar y probar los endpoints desde el navegador, con sus parámetros, bodies, respuestas y errores reales.',
      '',
      '- Todas las respuestas exitosas tienen la forma `{ status: "success", payload }`.',
      '- Todos los errores salen del middleware global con la forma `{ status: "error", statusCode, error, message }`, donde `error` es un código fijo del diccionario de errores.',
      '- La API no usa autenticación: ningún endpoint requiere token.',
      '- Los endpoints de **Mocks** solo existen fuera de producción (`NODE_ENV` distinto de `production`).'
    ].join('\n')
  },
  servers: [
    { url: `http://localhost:${config.port}`, description: `Servidor local (${config.nodeEnv})` }
  ],
  tags: [
    { name: 'Users', description: 'Usuarios: clientes (`user`), repartidores (`courier`) y administradores (`admin`)' },
    { name: 'Products', description: 'Productos y cotización de envío' },
    { name: 'Orders', description: 'Pedidos de los clientes' },
    { name: 'Deliveries', description: 'Entregas: una por pedido, con su repartidor y código de seguimiento' },
    { name: 'Mocks', description: 'Datos simulados y carga de datos de prueba (solo fuera de producción)' },
    { name: 'Logger', description: 'Herramienta interna para validar el logger. No es una funcionalidad de negocio' },
    { name: 'Health', description: 'Estado del servidor' }
  ]
};

// swagger-jsdoc busca los archivos con un patrón (glob), que necesita barras "/".
// En Windows, path.join arma la ruta con "\\", así que se reemplazan.
const DOCS_PATTERN = path.join(DOCS_DIR, '*.yaml').replace(/\\/g, '/');

export const swaggerSpec = swaggerJSDoc({
  definition,
  apis: [DOCS_PATTERN]
});

// Monta Swagger UI y el JSON de la especificación en la app
export const setupSwagger = (app) => {
  app.get(`${DOCS_ROUTE}.json`, (req, res) => res.json(swaggerSpec));
  app.use(DOCS_ROUTE, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ShipNow API - Documentación'
  }));
  const documentedPaths = Object.keys(swaggerSpec.paths ?? {}).length;
  if (documentedPaths === 0) {
    logger.warning(`Swagger no encontró documentación de endpoints en ${DOCS_PATTERN}`);
  } else {
    logger.debug(`Documentación Swagger disponible en ${DOCS_ROUTE} (${documentedPaths} rutas documentadas)`);
  }
};
