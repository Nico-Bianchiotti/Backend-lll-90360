// Proveedor de emails simulado (mock). En producción se reemplazaría
// por uno real con el mismo método send().
const emailProvider = {
  send: async (message) => {
    console.log('[EMAIL] ' + message);
  }
};

export default emailProvider;
