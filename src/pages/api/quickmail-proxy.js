export default async function handler(req, res) {
  try {
    const apiUrl = 'https://api.quickmail.com/v2/graphql';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch (e) {
      console.error('Failed to parse JSON response:', text);
      return res.status(500).json({ 
        error: 'Failed to parse API response',
        details: text
      });
    }
  } catch (error) {
    console.error('Proxy request failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
