export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const year = searchParams.get('year') || '';

  /* 
     Fix: The endpoint GetVehicleTypesForMakeModelYear does not exist. 
     Using GetVehicleTypesForMake instead. This returns all types for the make, 
     but is the best availble valid endpoint.
  */
  const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMake/${encodeURIComponent(
    make
  )}?format=json`;

  try {
    // add a short timeout and a friendly User-Agent to improve upstream handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(nhtsaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'AutoSpecs/1.0 (+https://example.local)'
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const bodyText = await res.text();
    if (!res.ok) {
      // return status and a small snippet of the body for debugging
      const snippet = bodyText ? bodyText.slice(0, 2000) : '';
      return new Response(JSON.stringify({ success: false, status: res.status, statusText: res.statusText, bodySnippet: snippet }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    let json = null;
    try {
      json = JSON.parse(bodyText);
    } catch (err) {
      json = null;
    }
    return new Response(JSON.stringify({ success: true, data: json }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'fetch_failed', details: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
