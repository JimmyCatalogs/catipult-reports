import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Clean and format the private key
const formattedKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY
  ?.replace(/^"/, '') // Remove leading quote
  ?.replace(/"$/, '') // Remove trailing quote
  ?.replace(/\\n/g, '\n'); // Replace \n with actual newlines
console.log('Formatted private key:', {
  raw: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY,
  formatted: formattedKey,
  hasNewlines: formattedKey?.includes('\n'),
  beginsWithHeader: formattedKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
  endsWithFooter: formattedKey?.endsWith('-----END PRIVATE KEY-----\n')
});

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
    private_key: formattedKey,
    project_id: process.env.GOOGLE_ANALYTICS_PROJECT_ID
  },
});

const propertyId = `properties/${process.env.GOOGLE_ANALYTICS_PROPERTY_ID}`;

async function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { metric, startDate: queryStartDate, endDate: queryEndDate } = req.query;
  
  // Format dates for GA4 API
  const formatDateForGA = (dateStr) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  const startDate = formatDateForGA(queryStartDate);
  const endDate = formatDateForGA(queryEndDate);
  
  console.log('GA API Request:', { metric, startDate, endDate });

  // Debug: Check private key formatting
  const keyDebugInfo = {
    hasNewlines: formattedKey?.includes('\n'),
    beginsWithHeader: formattedKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
    endsWithFooter: formattedKey?.endsWith('-----END PRIVATE KEY-----\n'),
    keyLength: formattedKey?.length,
    // Only show first and last 20 chars to avoid exposing the full key
    preview: formattedKey ? `${formattedKey.slice(0, 20)}...${formattedKey.slice(-20)}` : null
  };

  try {
    // If this is a debug request, return the key info
    if (metric === 'debug') {
      return res.json({ 
        debug: keyDebugInfo,
        envVars: {
          hasClientEmail: !!process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.GOOGLE_ANALYTICS_PRIVATE_KEY,
          hasProjectId: !!process.env.GOOGLE_ANALYTICS_PROJECT_ID,
          hasPropertyId: !!process.env.GOOGLE_ANALYTICS_PROPERTY_ID
        }
      });
    }

    switch (metric) {
      case 'pageviews': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'screenPageViews' }],
          dimensions: [{ name: 'date' }],
        });
        
        console.log('Page Views API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          return res.json([]);
        }
        return res.json(response.rows);
      }

      case 'users': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'activeUsers' }
          ],
        });
        
        console.log('Users API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return default user metrics
        if (!response.rows?.length) {
          return res.json({
            metricValues: [
              { value: '0' },
              { value: '0' },
              { value: '0' }
            ]
          });
        }
        return res.json(response.rows[0]);
      }

      case 'toppages': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'screenPageViews' }],
          dimensions: [{ name: 'pagePath' }],
          orderBys: [
            {
              metric: { metricName: 'screenPageViews' },
              desc: true,
            },
          ],
          limit: 10,
        });
        
        console.log('Top Pages API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          return res.json([]);
        }
        return res.json(response.rows);
      }

      case 'sourceMedium': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'totalUsers' }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' }
          ],
          orderBys: [
            {
              metric: { metricName: 'totalUsers' },
              desc: true,
            },
          ],
          limit: 20,
        });
        
        console.log('Source/Medium API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          // Return empty array instead of error
          return res.json([]);
        }
        return res.json(response.rows);
      }
      
      case 'source': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'totalUsers' }],
          dimensions: [
            { name: 'sessionSource' }
          ],
          orderBys: [
            {
              metric: { metricName: 'totalUsers' },
              desc: true,
            },
          ],
          limit: 20,
        });
        
        console.log('Source API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          return res.json([]);
        }
        return res.json(response.rows);
      }
      
      case 'medium': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'totalUsers' }],
          dimensions: [
            { name: 'sessionMedium' }
          ],
          orderBys: [
            {
              metric: { metricName: 'totalUsers' },
              desc: true,
            },
          ],
          limit: 20,
        });
        
        console.log('Medium API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          return res.json([]);
        }
        return res.json(response.rows);
      }

      case 'events': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'eventCount' }],
          dimensions: [
            { name: 'eventName' },
            { name: 'date' }
          ],
          orderBys: [
            {
              dimension: { dimensionName: 'date' },
              desc: false,
            },
            {
              metric: { metricName: 'eventCount' },
              desc: true,
            },
          ],
        });
        
        console.log('Events API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          return res.json([]);
        }
        return res.json(response.rows);
      }

      case 'buttonClicks': {
        const [response] = await analyticsDataClient.runReport({
          property: propertyId,
          dateRanges: [{ 
            startDate,
            endDate
          }],
          metrics: [{ name: 'eventCount' }],
          dimensions: [
            { name: 'eventName' },
            { name: 'customEvent:event_label' },  // Changed to match custom dimension
            { name: 'customEvent:page_path' },    // Changed to match custom dimension
            { name: 'date' }
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: 'button_click',  // Make sure this matches the actual event name in GA
                matchType: 'EXACT'
              }
            }
          },
          orderBys: [
            {
              dimension: { dimensionName: 'date' },
              desc: false,
            },
            {
              metric: { metricName: 'eventCount' },
              desc: true,
            },
          ],
        });
        
        console.log('Button Clicks API response:', {
          hasRows: !!response.rows?.length,
          rowCount: response.rows?.length || 0,
          startDate,
          endDate
        });
        
        // If no data returned, return empty array instead of error
        if (!response.rows?.length) {
          return res.json([]);
        }
        return res.json(response.rows);
      }

      default:
        return res.status(400).json({ error: 'Invalid metric specified' });
    }
  } catch (error) {
    console.error('Google Analytics API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}
