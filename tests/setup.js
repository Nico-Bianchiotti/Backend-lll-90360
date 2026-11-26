// Configuración global de la suite (Mocha la carga antes que los tests, ver .mocharc.json).
//
// 1. Base de datos de testing: si no hay una MONGODB_URI definida en el sistema,
//    se levanta un MongoDB en memoria. Es una base nueva y vacía en cada corrida,
//    separada de la de desarrollo, así que nunca se tocan datos reales.
// 2. Logger en modo testing (consola en silencio).
// 3. Hooks globales: conectar antes de todos los tests y desconectar al final.
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

// Tiene que resolverse antes de que los tests importen la app (que valida la configuración)
if (!process.env.MONGODB_URI) {
  memoryServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = memoryServer.getUri('shipnow_test');
}

// El logger se ajusta al entorno de testing antes de que se cargue la app,
// así la consola queda en silencio desde el principio
const { config } = await import('../src/config/env.config.js');
const { configureLogger } = await import('../src/config/logger.js');
configureLogger(config);

export const mochaHooks = {
  async beforeAll() {
    const { connectDB } = await import('../src/config/db.js');
    const { clearDatabase } = await import('./helpers/db.js');

    await connectDB(config.mongoUri);

    // Protección: los tests borran datos, así que solo corren contra una base de testing
    const dbName = mongoose.connection.name;
    if (!/test/i.test(dbName)) {
      await mongoose.disconnect();
      throw new Error(`Por seguridad, los tests solo corren contra una base cuyo nombre contenga "test" (base actual: "${dbName}")`);
    }

    await clearDatabase();
  },

  async afterAll() {
    const { clearDatabase } = await import('./helpers/db.js');
    if (mongoose.connection.readyState === 1) {
      await clearDatabase();
      await mongoose.disconnect();
    }
    if (memoryServer) await memoryServer.stop();
  }
};
