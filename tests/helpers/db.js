import mongoose from 'mongoose';

// Estrategia de limpieza: vacía todas las colecciones de la base de testing.
// Cada archivo de tests la llama en beforeEach, así cada test arranca con la base vacía
// y no depende de lo que hayan dejado otros tests ni del orden de ejecución.
// (Se borran los documentos y no la base entera, para conservar los índices únicos.)
export const clearDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};
