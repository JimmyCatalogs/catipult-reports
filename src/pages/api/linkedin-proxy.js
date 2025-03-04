/**
 * LinkedIn API proxy endpoint
 * This endpoint forwards requests to the LinkedIn Marketing API
 */
export default async function handler(req, res) {
  // Extract the endpoint from the request URL
  let endpoint = req.url.split('/api/linkedin-proxy')[1] || '';
  
  // Log the raw URL and extracted endpoint for debugging
  console.log('Raw request URL:', req.url);
  console.log('Extracted endpoint:', endpoint);
  
  // If the endpoint starts with a query string, it means the path extraction failed
  if (endpoint.startsWith('?')) {
    console.log('Endpoint extraction failed, using query parameter instead');
    // Try to get the endpoint from a query parameter
    const url = new URL(req.url, 'http://localhost');
    const queryEndpoint = url.searchParams.get('endpoint');
    if (queryEndpoint) {
      endpoint = queryEndpoint;
      console.log('Using endpoint from query parameter:', endpoint);
    }
  }
  
  // Use the REST API base path for all endpoints
  const baseUrl = 'https://api.linkedin.com';
  let apiType = 'LinkedIn REST API';
  
  // Determine API type for logging purposes
  if (endpoint.includes('/adAccounts')) {
    apiType = 'Marketing API';
  } else if (endpoint.includes('/adCampaigns')) {
    apiType = 'Campaigns API';
  } else if (endpoint.includes('/adAnalytics')) {
    apiType = 'Analytics API';
  } else if (endpoint.includes('/campaignConversions')) {
    apiType = 'Conversions API';
  } else if (endpoint.includes('/adCampaignGroups')) {
    apiType = 'Campaign Groups API';
  }
  
  // Construct the full API URL
  const apiUrl = `${baseUrl}${endpoint}`;
  
  // Parse query parameters for better logging
  const queryParams = {};
  const urlObj = new URL(apiUrl);
  urlObj.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  
  // Create a detailed request log
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    apiType,
    endpoint,
    fullUrl: apiUrl,
    queryParams,
    headers: {
      // Log headers except authorization which contains sensitive info
      ...Object.fromEntries(
        Object.entries(req.headers)
          .filter(([key]) => key.toLowerCase() !== 'authorization')
      ),
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    }
  };
  
  console.log('LinkedIn Proxy Request:', requestLog);
  
  try {
    // Prepare headers for the LinkedIn API request
    const headers = {
      'Authorization': req.headers.authorization,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0', // Required for LinkedIn API
      'LinkedIn-Version': '202411', // Use the November 2024 API version
    };
    
    // Forward the request to LinkedIn API
    const response = await fetch(apiUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    console.log('LinkedIn API response status:', response.status);
    
    const text = await response.text();
    console.log('LinkedIn API response text:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    
    // Create a detailed response log
    const responseLog = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseText: text
    };
    
    console.log('LinkedIn API detailed response:', responseLog);
    
    // Always include the raw response text and details in the response
    const responseDetails = {
      _request: {
        apiType,
        endpoint,
        fullUrl: apiUrl,
        queryParams,
        method: req.method
      },
      _response: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        rawText: text
      }
    };
    
    // If the response is not successful (e.g., 404, 401, etc.), return the error with details
    if (!response.ok) {
      console.error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      
      try {
        // Try to parse the error response as JSON
        const errorData = JSON.parse(text);
        return res.status(response.status).json({
          error: `LinkedIn API error: ${response.status} ${response.statusText}`,
          errorData,
          ...responseDetails
        });
      } catch (e) {
        // If parsing fails, return the raw text
        return res.status(response.status).json({
          error: `LinkedIn API error: ${response.status} ${response.statusText}`,
          errorText: text,
          ...responseDetails
        });
      }
    }
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(text);
      console.log('LinkedIn API response parsed successfully');
      
      // Add the request details to the response
      return res.status(response.status).json({
        data,
        ...responseDetails
      });
    } catch (e) {
      console.error('Failed to parse JSON response:', e.message);
      return res.status(500).json({ 
        error: 'Failed to parse API response',
        details: text,
        ...responseDetails
      });
    }
  } catch (error) {
    console.error('LinkedIn proxy request failed:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      _request: {
        apiType,
        endpoint,
        fullUrl: apiUrl,
        queryParams,
        method: req.method
      }
    });
  }
}
