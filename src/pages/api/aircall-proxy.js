export default async function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const path = pathname.replace('/api/aircall-proxy', '');
  
  const apiId = process.env.AIRCALL_API_ID;
  const apiToken = process.env.AIRCALL_API_TOKEN;

  if (!apiId || !apiToken) {
    return res.status(500).json({ error: 'Aircall API credentials not configured' });
  }

  try {
    const queryString = searchParams.toString();
    const url = `https://api.aircall.io/v1${path}${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiId}:${apiToken}`).toString('base64')}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch data from Aircall API');
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Aircall API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
