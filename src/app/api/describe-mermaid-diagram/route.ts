
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { diagram } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY || '';
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: diagram }] }]
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: errorText }), { status: response.status });
    }
    const data = await response.json();
    return new Response(JSON.stringify({ result: data }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500 });
  }
}
