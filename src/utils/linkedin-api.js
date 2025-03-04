/**
 * LinkedIn API Implementation
 * 
 * This implementation uses the LinkedIn Marketing API via a proxy endpoint.
 * No mock data is used - all data is fetched from the real LinkedIn API.
 */

export class LinkedInAPI {
  /**
   * Test API connectivity
   * This method makes a simple API call to verify that we can connect to the LinkedIn API
   * @returns {Promise<boolean>} True if connection is successful, false otherwise
   */
  static async testConnectivity(clientId, clientSecret, accountId, apiToken) {
    console.log('🧪 Testing LinkedIn API connectivity...');
    console.log('🔑 Credentials provided:', { 
      clientId: clientId ? '✓ Present' : '✗ Missing',
      clientSecret: clientSecret ? '✓ Present' : '✗ Missing',
      accountId: accountId ? `✓ Present (${accountId})` : '✗ Missing',
      apiToken: apiToken ? '✓ Present' : '✗ Missing'
    });
    
    try {
      if (!clientId || !clientSecret || !accountId || !apiToken) {
        throw new Error('Missing required LinkedIn API credentials');
      }
      
      const api = new LinkedInAPI(clientId, clientSecret, accountId, apiToken);
      console.log('✅ API token is present');
      
      // Make a simple API call to verify connectivity
      console.log('📡 Making test API call to verify full connectivity...');
      
      // Use the campaigns endpoint which we know works with our proxy
      // Just request a small count to minimize data transfer
      const endpoint = `/rest/adAccounts/${accountId}/adCampaigns`;
      
      console.log(`📡 Testing endpoint: ${endpoint}`);
      console.log(`📡 Using LinkedIn API version: 202411 (November 2024)`);
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
      console.log(`📡 Using proxy URL: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ LinkedIn API connectivity test successful!');
      
      // Extract the actual API response data
      const data = responseData.data || responseData;
      
      // Log campaign count and first campaign details if available
      console.log('📊 API Response:', {
        endpoint: endpoint,
        totalCampaigns: data.elements ? data.elements.length : 0,
        firstCampaign: data.elements && data.elements.length > 0 ? {
          id: data.elements[0].id,
          name: data.elements[0].name,
          status: data.elements[0].status
        } : 'No campaigns found'
      });
      
      return true;
    } catch (error) {
      console.error('❌ LinkedIn API connectivity test failed:', error.message);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }
  
  /**
   * Test various LinkedIn API endpoints
   * @param {string} endpoint - The endpoint to test
   * @returns {Promise<Object>} The API response
   */
  async testEndpoint(endpoint) {
    try {
      console.log(`📡 Testing endpoint: ${endpoint}`);
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
      console.log(`📡 Using proxy URL: ${proxyUrl}`);
      
      // Make API request via proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ LinkedIn API endpoint test successful!');
      
      // Extract the actual API response data
      const data = responseData.data || responseData;
      
      return {
        success: true,
        data,
        endpoint,
        _requestDetails: responseData._request
      };
    } catch (error) {
      console.error(`❌ LinkedIn API endpoint test failed for ${endpoint}:`, error.message);
      console.error('Stack trace:', error.stack);
      
      return {
        success: false,
        error: error.message,
        endpoint
      };
    }
  }
  
  constructor(clientId, clientSecret, accountId, apiToken) {
    console.log('Initializing LinkedIn API');
    console.log('API credentials:', { 
      clientId: clientId ? '[REDACTED]' : undefined,
      clientSecret: clientSecret ? '[REDACTED]' : undefined,
      accountId,
      apiToken: apiToken ? '[REDACTED]' : undefined
    });
    
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  /**
   * Get all campaigns for the account
   * @param {number} dayRange - Optional day range for filtering data
   * @returns {Promise<Object>} Campaign data
   */
  async getCampaigns(dayRange = 30) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);
      
      // Format dates as required by LinkedIn API (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Construct API endpoint exactly as specified in the LinkedIn API documentation
      const endpoint = `/rest/adAccounts/${this.accountId}/adCampaigns?q=search&start=0&count=25`;
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
      console.log(`📡 Using proxy URL for campaigns: ${proxyUrl}`);
      
      // Make API request via proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Extract the actual API response data and request details
      const data = responseData.data || responseData;
      const requestDetails = responseData._request;
      
      // Log the full API query details
      console.log('LinkedIn API Query Details:', requestDetails);
      
      // Get campaign metrics in a separate call
      const campaignsWithMetrics = await Promise.all(
        data.elements.map(async (campaign) => {
          try {
            const metrics = await this.getCampaignMetrics(campaign.id, dayRange);
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              type: campaign.type,
              createdAt: campaign.createdAt,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
              costType: campaign.costType,
              dailyBudget: campaign.dailyBudget?.amount?.value || 0,
              totalBudget: campaign.totalBudget?.amount?.value || 0,
              metrics: metrics
            };
          } catch (error) {
            console.error(`Error fetching metrics for campaign ${campaign.id}:`, error);
            return {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              type: campaign.type,
              createdAt: campaign.createdAt,
              startDate: campaign.startDate,
              endDate: campaign.endDate,
              costType: campaign.costType,
              dailyBudget: campaign.dailyBudget?.amount?.value || 0,
              totalBudget: campaign.totalBudget?.amount?.value || 0,
              metrics: {
                impressions: 0,
                clicks: 0,
                costInLocalCurrency: 0,
                conversions: 0
              }
            };
          }
        })
      );
      
      return {
        campaigns: campaignsWithMetrics,
        _requestDetails: requestDetails // Include request details in the response
      };
    } catch (error) {
      console.error('Error fetching LinkedIn campaigns:', error);
      throw error; // Propagate the error to be handled by the UI
    }
  }
  
  /**
   * Get metrics for a specific campaign
   * @param {string} campaignId - Campaign ID
   * @param {number} dayRange - Day range for metrics
   * @returns {Promise<Object>} Campaign metrics
   */
  async getCampaignMetrics(campaignId, dayRange = 30) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);
      
      // Format dates as required by LinkedIn API (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Parse the date for the required format (day/month/year)
      const startDay = startDate.getDate();
      const startMonth = startDate.getMonth() + 1; // JavaScript months are 0-indexed
      const startYear = startDate.getFullYear();
      
      const endDay = endDate.getDate();
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      
      // Format the campaign ID as a URN as required by the LinkedIn API
      const campaignUrn = `urn:li:sponsoredCampaign:${campaignId}`;
      
      // Using the exact URL format that works with the LinkedIn API
      // Construct the dateRange and campaigns parameters
      const dateRangeValue = `(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
      
      // Encode only the URN inside the List() wrapper
      const encodedUrn = campaignUrn.replace(/:/g, '%3A');
      const campaignsValue = `List(${encodedUrn})`;
      
      // Use the exact URL format that works - don't encode dateRange, only encode URN inside List()
      const endpoint = `/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${dateRangeValue}&campaigns=${campaignsValue}&fields=impressions,clicks,costInUsd,qualifiedLeads`;
      
      // Use query parameter approach to avoid routing issues
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodeURIComponent(endpoint)}`;
      
      console.log(`📡 Using proxy URL for metrics: ${proxyUrl}`);
      
      // Make API request via proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const data = responseData.data || responseData;
      
      // Extract metrics from response - note that LinkedIn API now uses lowercase field names
      if (data.elements && data.elements.length > 0) {
        return {
          impressions: data.elements[0].impressions || 0,
          clicks: data.elements[0].clicks || 0,
          costInLocalCurrency: data.elements[0].costInUsd || 0, // costInUsd is equivalent to costInLocalCurrency
          conversions: data.elements[0].qualifiedLeads || 0 // qualifiedLeads is equivalent to conversions
        };
      }
      
      return {
        impressions: 0,
        clicks: 0,
        costInLocalCurrency: 0,
        conversions: 0
      };
    } catch (error) {
      console.error(`Error fetching metrics for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get campaign analytics data
   * @param {string} campaignId - Campaign ID
   * @param {number} dayRange - Day range for analytics data
   * @returns {Promise<Object>} Campaign analytics data
   */
  async getCampaignAnalytics(campaignId, dayRange = 30) {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);
      
      // Format dates as required by LinkedIn API (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Parse the date for the required format (day/month/year)
      const startDay = startDate.getDate();
      const startMonth = startDate.getMonth() + 1; // JavaScript months are 0-indexed
      const startYear = startDate.getFullYear();
      
      const endDay = endDate.getDate();
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      
      // Format the campaign ID as a URN as required by the LinkedIn API
      const campaignUrn = `urn:li:sponsoredCampaign:${campaignId}`;
      
      // Using the exact URL format that works with the LinkedIn API
      // Construct the dateRange and campaigns parameters
      const dateRangeValue = `(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
      
      // Encode only the URN inside the List() wrapper
      const encodedUrn = campaignUrn.replace(/:/g, '%3A');
      const campaignsValue = `List(${encodedUrn})`;
      
      // Use the exact URL format that works - don't encode dateRange, only encode URN inside List()
      const endpoint = `/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${dateRangeValue}&campaigns=${campaignsValue}&fields=impressions,clicks,costInUsd,qualifiedLeads`;
      
      // Use query parameter approach to avoid routing issues
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodeURIComponent(endpoint)}`;
      
      console.log(`📡 Using proxy URL for analytics: ${proxyUrl}`);
      
      // Make API request via proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Extract the actual API response data and request details
      const data = responseData.data || responseData;
      const requestDetails = responseData._request;
      
      // Log the full API query details
      console.log('LinkedIn Analytics API Query Details:', requestDetails);
      
      // Transform API response to match our internal format
      return {
        elements: data.elements.map(item => {
          // Extract date from dateRange
          let date;
          if (item.dateRange && item.dateRange.start) {
            // Construct date from day, month, year
            const day = item.dateRange.start.day;
            const month = item.dateRange.start.month;
            const year = item.dateRange.start.year;
            
            // Format as YYYY-MM-DD for consistency with our UI
            date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          } else {
            // Fallback to current date if no date range is provided
            date = new Date().toISOString().split('T')[0];
          }
          
          return {
            date,
            impressions: item.impressions || 0,
            clicks: item.clicks || 0,
            costInLocalCurrency: item.costInUsd || 0, // costInUsd is equivalent to costInLocalCurrency
            conversions: item.qualifiedLeads || 0 // qualifiedLeads is equivalent to conversions
          };
        }),
        paging: data.paging,
        _requestDetails: requestDetails // Include request details in the response
      };
    } catch (error) {
      console.error('Error fetching LinkedIn campaign analytics:', error);
      throw error; // Propagate the error to be handled by the UI
    }
  }
  
  /**
   * Get detailed information for a specific campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Campaign details
   */
  async getCampaignDetails(campaignId) {
    try {
      // Construct API endpoint for getting campaign details
      const endpoint = `/rest/adCampaigns/${campaignId}`;
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
      console.log(`📡 Using proxy URL for campaign details: ${proxyUrl}`);
      
      // Make API request via proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const data = responseData.data || responseData;
      
      return {
        ...data,
        _requestDetails: responseData._request
      };
    } catch (error) {
      console.error(`Error fetching details for campaign ${campaignId}:`, error);
      throw error;
    }
  }
}
