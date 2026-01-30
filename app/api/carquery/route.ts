export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const year = searchParams.get('year') || '';

  const carqueryUrl = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(
    make
  )}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`;

  try {
    const res = await fetch(carqueryUrl);
    const text = await res.text();
    let json = null;
    try {
      const trimmed = text.trim();
      json = trimmed.startsWith('{') || trimmed.startsWith('[')
        ? JSON.parse(trimmed)
        : JSON.parse(trimmed.replace(/^\w*\(|\);?$/g, ''));
    } catch (err) {
      // couldn't parse
      json = null;
    }

    return new Response(JSON.stringify({ success: true, data: json }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'fetch_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
