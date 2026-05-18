require('./_loadEnv');

exports.handler = async (event, context) => {
  const mod = await import('../../server/netlify/functions/refresh.js');
  return mod.handler(event, context);
};
