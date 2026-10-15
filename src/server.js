import { config } from './config/env.config.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const start = async () => {
  try {
    await connectDB(config.mongoUri);
    app.listen(config.port, () => {
      console.log(`Servidor corriendo en el puerto ${config.port} (entorno: ${config.nodeEnv})`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

start();
