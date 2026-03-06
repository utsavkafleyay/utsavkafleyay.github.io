const WORDNIK_BASE = 'https://api.wordnik.com/v4/word.json';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { word } = await request.json();

    if (!word) {
      return new Response(JSON.stringify({ error: 'Word is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.WORDNIK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanWord = encodeURIComponent(word.trim().toLowerCase());
    const keyParam = `api_key=${apiKey}`;

    const endpoints = {
      definitions: `${WORDNIK_BASE}/${cleanWord}/definitions?limit=5&includeRelated=false&sourceDictionaries=all&${keyParam}`,
      examples: `${WORDNIK_BASE}/${cleanWord}/examples?limit=5&${keyParam}`,
      relatedWords: `${WORDNIK_BASE}/${cleanWord}/relatedWords?limitPerRelationshipType=10&${keyParam}`,
      pronunciations: `${WORDNIK_BASE}/${cleanWord}/pronunciations?limit=3&${keyParam}`,
      etymologies: `${WORDNIK_BASE}/${cleanWord}/etymologies?${keyParam}`,
      audio: `${WORDNIK_BASE}/${cleanWord}/audio?limit=1&${keyParam}`,
    };

    const results = await Promise.allSettled(
      Object.entries(endpoints).map(async ([key, url]) => {
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 404) return [key, null];
          throw new Error(`${key}: ${res.status}`);
        }
        return [key, await res.json()];
      })
    );

    const data = {};
    let allNotFound = true;
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const [key, value] = result.value;
        data[key] = value;
        if (value !== null) allNotFound = false;
      }
    }

    if (allNotFound || (!data.definitions?.length && !data.examples?.examples?.length)) {
      return new Response(JSON.stringify({ notFound: true, word: word.trim().toLowerCase() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
