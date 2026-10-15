const emailProvider = {
  send: async (message) => {
    console.log('[EMAIL] ' + message);
  }
};

export default emailProvider;
