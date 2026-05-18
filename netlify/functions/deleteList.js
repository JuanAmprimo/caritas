require('./_loadEnv');

exports.handler = async (event, context) => {
  const mod = await import('../../server/netlify/functions/deleteList.js');
  return mod.handler(event, context);
};
