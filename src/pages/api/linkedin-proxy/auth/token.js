/**
 * LinkedIn OAuth token refresh endpoint
 * This endpoint handles refreshing access tokens using the refresh token
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { client_id, client_secret, refresh_token } = req.body;

    if (!client_id || !client_secret || !refresh_token) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // LinkedIn OAuth token endpoint
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';

    // Log the request details (without sensitive info)
    console.log('LinkedIn token refresh request:', {
      url: tokenUrl,
      method: 'POST',
      clientIdProvided: !!client_id,
      clientSecretProvided: !!client_secret,
      refreshTokenProvided: !!refresh_token
    });

    // Exchange refresh token for access token
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: client_id,
        client_secret: client_secret,
      }).toString(),
    });

    // Get the response text first
    const responseText = await tokenResponse.text();
    console.log('LinkedIn token response status:', tokenResponse.status);
    console.log('LinkedIn token response text:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    // Create a detailed response log
    const responseLog = {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      headers: Object.fromEntries(tokenResponse.headers.entries()),
      responseText: responseText
    };
    
    console.log('LinkedIn token detailed response:', responseLog);

    // Try to parse the response as JSON
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse token response as JSON:', e.message);
      return res.status(500).json({
        error: 'Failed to parse token response',
        rawResponse: responseText,
        responseStatus: tokenResponse.status,
        responseStatusText: tokenResponse.statusText,
        responseHeaders: Object.fromEntries(tokenResponse.headers.entries())
      });
    }

    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', tokenData);
      return res.status(tokenResponse.status).json({
        error: `Failed to refresh token: ${tokenResponse.status} ${tokenResponse.statusText}`,
        details: tokenData,
        rawResponse: responseText,
        responseStatus: tokenResponse.status,
        responseStatusText: tokenResponse.statusText,
        responseHeaders: Object.fromEntries(tokenResponse.headers.entries())
      });
    }

    return res.status(200).json({
      ...tokenData,
      _response: {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: 'Internal server error during token refresh',
      message: error.message
    });
  }
}
