require('./_loadEnv');

exports.handler = async (event, context) => {
  const mod = await import('../../server/netlify/functions/updateList.js');
  return mod.handler(event, context);
};
