require('./_loadEnv');

exports.handler = async (event, context) => {
  const mod = await import('../../server/netlify/functions/logout.js');
  return mod.handler(event, context);
};
