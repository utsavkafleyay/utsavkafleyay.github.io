// Netlify serverless function to return Pendo API key
// This adds a layer of obscurity (key not hardcoded in source)
// Note: Pendo keys are designed to be public - they use domain whitelisting for security

export default async (request) => {
  const pendoKey = process.env.PENDO_API_KEY;
  
  if (!pendoKey) {
    return new Response(JSON.stringify({ error: 'Pendo key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ apiKey: pendoKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
