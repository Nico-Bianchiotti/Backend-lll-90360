import dotenv from 'dotenv';

// Cada entorno tiene su archivo: en testing se usa .env.test (separado del de desarrollo).
// dotenv no pisa variables que ya existan en el sistema.
const ENV_FILE = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: ENV_FILE, quiet: true });


const REQUIRED_VARS = ['PORT', 'MONGODB_URI', 'NODE_ENV', 'SHIPPING_API_KEY'];
const VALID_ENVIRONMENTS = ['development', 'production', 'test'];

const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  throw new Error(
    `Configuración inválida: faltan las variables de entorno ${missing.join(', ')}. ` +
    'Revisá tu archivo .env (podés copiar .env.example como base).'
  );
}

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Configuración inválida: PORT debe ser un número entero positivo (valor actual: "${process.env.PORT}").`);
}

if (!VALID_ENVIRONMENTS.includes(process.env.NODE_ENV)) {
  throw new Error(
    `Configuración inválida: NODE_ENV debe ser uno de ${VALID_ENVIRONMENTS.join(', ')} ` +
    `(valor actual: "${process.env.NODE_ENV}").`
  );
}

export const config = Object.freeze({
  port,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  shippingApiKey: process.env.SHIPPING_API_KEY
});
