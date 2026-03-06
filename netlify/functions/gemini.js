export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { word, wordData } = await request.json();

    if (!word) {
      return new Response(JSON.stringify({ error: 'Word is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let contextBlock = '';
    if (wordData) {
      const parts = [];
      if (wordData.definitions?.length) {
        parts.push(`Definitions: ${wordData.definitions.map(d => d.text).join('; ')}`);
      }
      if (wordData.etymology) {
        parts.push(`Etymology: ${wordData.etymology}`);
      }
      if (wordData.examples?.length) {
        parts.push(`Real usage examples: ${wordData.examples.slice(0, 3).join(' | ')}`);
      }
      if (wordData.synonyms?.length) {
        parts.push(`Synonyms: ${wordData.synonyms.slice(0, 8).join(', ')}`);
      }
      if (wordData.antonyms?.length) {
        parts.push(`Antonyms: ${wordData.antonyms.slice(0, 5).join(', ')}`);
      }
      const related = wordData.relatedWords || {};
      if (related['hypernym']?.length) {
        parts.push(`Broader terms: ${related['hypernym'].slice(0, 5).join(', ')}`);
      }
      if (related['hyponym']?.length) {
        parts.push(`Narrower terms: ${related['hyponym'].slice(0, 5).join(', ')}`);
      }
      contextBlock = `\n\nHere is the dictionary data for "${word}":\n${parts.join('\n')}`;
    }

    const prompt = `You are a writing coach helping a fiction writer understand when and how to use the word "${word}".${contextBlock}

Return the response strictly as a JSON object matching this schema:
{
  "reach_for_when": "A vivid, specific writing scenario where this is the perfect word—describe the mood, tension, or narrative moment, not just a definition restatement",
  "connotation": "The emotional weight and register of this word: is it formal/informal, positive/negative, literary/colloquial? What feeling does it carry that its synonyms don't?",
  "common_pitfalls": "One common misuse, confusion with a similar word, or subtle trap writers fall into with this word. Be specific and practical.",
  "transformation": {
    "before": "A flat or generic sentence that a writer might draft (do NOT use '${word}' here)",
    "after": "The same idea rewritten using '${word}' in a way that elevates the prose—show craft, not just substitution",
    "why": "One sentence explaining the specific effect the transformation achieves"
  }
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch from Gemini API' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Invalid response from Gemini' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Could not parse AI response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
