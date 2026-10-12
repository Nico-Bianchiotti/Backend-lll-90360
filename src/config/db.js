import mongoose from 'mongoose';

// La conexión a la base vive en un solo lugar.
// Recibe la URI por parámetro (inyección de configuración).
export const connectDB = async (mongoUri) => {
  await mongoose.connect(mongoUri);
  console.log('Conectado a MongoDB');
};
