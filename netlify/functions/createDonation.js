require('./_loadEnv');

exports.handler = async (event, context) => {
  const mod = await import('../../server/netlify/functions/CreateDonation.js');
  return mod.handler(event, context);
};
