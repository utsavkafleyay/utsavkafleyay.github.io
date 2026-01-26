// Netlify serverless function to proxy Merriam-Webster Dictionary API
// This keeps your API keys secure on the server side

const MERRIAM_WEBSTER_BASE_URL = 'https://www.dictionaryapi.com/api/v3/references';

export default async (request) => {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { word, type = 'collegiate' } = await request.json();
    
    if (!word) {
      return new Response(JSON.stringify({ error: 'Word is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Select the right API key based on type
    let apiKey;
    let dictionary;
    
    if (type === 'thesaurus') {
      apiKey = process.env.MW_THESAURUS_KEY;
      dictionary = 'ithesaurus';
    } else {
      apiKey = process.env.MW_COLLEGIATE_KEY;
      dictionary = 'collegiate';
    }
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanWord = word.trim().toLowerCase();
    const url = `${MERRIAM_WEBSTER_BASE_URL}/${dictionary}/json/${encodeURIComponent(cleanWord)}?key=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `API request failed: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dictionary function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
