// Dynamic API route handler for Aircall proxy
export default async function handler(req, res) {
  // Get the path from the query parameter
  const path = req.query.path || '';
  const normalizedPath = '/' + path;
  
  const apiId = '9ec53b199aeda57d9daf6279a4c88a7f';
  const apiToken = process.env.AIRCALL_API_TOKEN;

  if (!apiToken) {
    console.error('Missing Aircall API token in environment variables');
    return res.status(500).json({ error: 'Aircall API token not configured. Please check AIRCALL_API_TOKEN in .env.local' });
  }

  // console.log('Environment check:', {
  //   hasApiId: !!apiId,
  //   hasApiToken: !!apiToken,
  //   apiIdLength: apiId.length,
  //   tokenLength: apiToken.length,
  //   path: req.query.path
  // });

  try {
    // Create a new object without the path parameter
    const { path: _, ...queryParams } = req.query;
    const searchParams = new URLSearchParams(queryParams);
    const queryString = searchParams.toString();
    const url = `https://api.aircall.io/v1${normalizedPath}${queryString ? `?${queryString}` : ''}`;
    
    // Enhanced request logging
    console.log('Aircall API Request Details:', {
      url,
      method: req.method,
      path: normalizedPath,
      queryString,
      queryParams,
      auth: {
        apiId,
        hasToken: !!apiToken,
        authHeader: 'Basic ' + Buffer.from(`${apiId}:${apiToken}`).toString('base64')
      }
    });

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiId}:${apiToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(req.body && req.method !== 'GET' && req.method !== 'HEAD' && { 
        body: JSON.stringify(req.body) 
      }),
    });

    // Detailed response logging
    const responseText = await response.text();
    // console.log('Aircall API Response:', {
    //   status: response.status,
    //   statusText: response.statusText,
    //   headers: Object.fromEntries(response.headers.entries()),
    //   body: responseText
    // });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      console.error('Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      throw new Error(data.message || `API Error: ${response.status} ${response.statusText}`);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Aircall API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
