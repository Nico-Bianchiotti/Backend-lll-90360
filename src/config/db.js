import mongoose from 'mongoose';

export const connectDB = async (mongoUri) => {
  // Si la base no responde, las operaciones fallan a los 10 s (por defecto son 30 s)
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('Conectado a MongoDB');
};
