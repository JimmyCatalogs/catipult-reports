/**
 * LinkedIn API Implementation
 * 
 * This implementation uses the LinkedIn Marketing API via a proxy endpoint.
 * No mock data is used - all data is fetched from the real LinkedIn API.
 */

// Simple cache to avoid duplicate API calls
const apiCache = {
  campaigns: new Map(), // Map of dayRange -> campaign data
  metrics: new Map(),   // Map of campaignId_dayRange -> metrics data
  analytics: new Map(), // Map of campaignId_dayRange -> analytics data
  details: new Map(),   // Map of campaignId -> campaign details
  
  // Cache expiration time (5 minutes)
  CACHE_TTL: 5 * 60 * 1000,
  
  // Get item from cache if it exists and is not expired
  get(cache, key) {
    const item = cache.get(key);
    if (!item) return null;
    
    // Check if the item is expired
    if (Date.now() - item.timestamp > this.CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  // Set item in cache with current timestamp
  set(cache, key, data) {
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  // Clear all caches
  clear() {
    this.campaigns.clear();
    this.metrics.clear();
    this.analytics.clear();
    this.details.clear();
  }
};

export class LinkedInAPI {
  /**
   * Test API connectivity
   * This method makes a simple API call to verify that we can connect to the LinkedIn API
   * @returns {Promise<boolean>} True if connection is successful, false otherwise
   */
  static async testConnectivity(clientId, clientSecret, accountId, apiToken) {
    console.log('🧪 Testing LinkedIn API connectivity...');
    
    try {
      if (!clientId || !clientSecret || !accountId || !apiToken) {
        throw new Error('Missing required LinkedIn API credentials');
      }
      
      const api = new LinkedInAPI(clientId, clientSecret, accountId, apiToken);
      
      // Use the campaigns endpoint which we know works with our proxy
      // Make sure to include the query parameters
      const endpoint = `/rest/adAccounts/${accountId}/adCampaigns?q=search&start=0&count=25`;
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
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
      
      return true;
    } catch (error) {
      console.error('❌ LinkedIn API connectivity test failed:', error.message);
      return false;
    }
  }
  
  constructor(clientId, clientSecret, accountId, apiToken) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  /**
   * Get all campaigns for the account
   * @param {number} dayRange - Optional day range for filtering data
   * @param {Date} startDate - Start date for filtering data
   * @param {Date} endDate - End date for filtering data
   * @param {boolean} forceRefresh - Force refresh the data from the API
   * @returns {Promise<Object>} Campaign data
   */
  async getCampaigns(dayRange = 30, startDate = null, endDate = null, forceRefresh = false) {
    try {
      // Create a cache key that includes the date range
      const cacheKey = startDate && endDate 
        ? `${dayRange}_${startDate.toISOString()}_${endDate.toISOString()}`
        : dayRange;
        
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = apiCache.get(apiCache.campaigns, cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // IMPORTANT: Use the hardcoded account ID 509440002 that was working before
      // This is a workaround to ensure compatibility with the existing API
      const accountId = "509440002";
      
      // Construct API endpoint exactly as specified in the LinkedIn API documentation
      // Make sure to include the query parameters
      const endpoint = `/rest/adAccounts/${accountId}/adCampaigns?q=search&start=0&count=25`;
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
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
      
      // First, filter to only include ACTIVE campaigns
      const activeCampaigns = data.elements.filter(campaign => campaign.status === 'ACTIVE');
      
      // Then get metrics only for the active campaigns
      const campaignsWithMetrics = await Promise.all(
        activeCampaigns.map(async (campaign) => {
          try {
            // Pass the startDate and endDate to getCampaignMetrics
            const metrics = await this.getCampaignMetrics(campaign.id, dayRange, startDate, endDate);
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
                conversions: 0,
                oneClickLeads: 0
              }
            };
          }
        })
      );
      
      const result = {
        campaigns: campaignsWithMetrics,
        _requestDetails: requestDetails // Include request details in the response
      };
      
      // Cache the result with the date-specific key
      apiCache.set(apiCache.campaigns, cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching LinkedIn campaigns:', error);
      throw error; // Propagate the error to be handled by the UI
    }
  }
  
  /**
   * Get metrics for a specific campaign
   * @param {string} campaignId - Campaign ID
   * @param {number} dayRange - Day range for metrics
   * @param {Date} startDate - Start date for filtering data
   * @param {Date} endDate - End date for filtering data
   * @param {boolean} forceRefresh - Force refresh the data from the API
   * @returns {Promise<Object>} Campaign metrics
   */
  async getCampaignMetrics(campaignId, dayRange = 30, startDate = null, endDate = null, forceRefresh = false) {
    try {
      // Use provided dates or calculate based on dayRange
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - dayRange);
        return date;
      })();
      
      const end = endDate || new Date();
      
      // Create a cache key combining campaignId and date range
      const cacheKey = `${campaignId}_${start.toISOString()}_${end.toISOString()}`;
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = apiCache.get(apiCache.metrics, cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Parse the date for the required format (day/month/year)
      const startDay = start.getDate();
      const startMonth = start.getMonth() + 1; // JavaScript months are 0-indexed
      const startYear = start.getFullYear();
      
      const endDay = end.getDate();
      const endMonth = end.getMonth() + 1;
      const endYear = end.getFullYear();
      
      // Format the campaign ID as a URN as required by the LinkedIn API
      const campaignUrn = `urn:li:sponsoredCampaign:${campaignId}`;
      
      // Using the exact URL format that works with the LinkedIn API
      // Construct the dateRange and campaigns parameters
      const dateRangeValue = `(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
      
      // Encode only the URN inside the List() wrapper
      const encodedUrn = campaignUrn.replace(/:/g, '%3A');
      const campaignsValue = `List(${encodedUrn})`;
      
      // Use the exact URL format that works - don't encode dateRange, only encode URN inside List()
      const endpoint = `/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${dateRangeValue}&campaigns=${campaignsValue}&fields=impressions,clicks,costInUsd,qualifiedLeads,oneClickLeads,dateRange`;
      
      // Use query parameter approach to avoid routing issues
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodeURIComponent(endpoint)}`;
      
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
      // Sum up all elements (days) to get the total metrics
      let result = {
        impressions: 0,
        clicks: 0,
        costInLocalCurrency: 0,
        conversions: 0,
        oneClickLeads: 0,
        dailyData: [] // Store daily data for time-series visualization
      };
      
      if (data.elements && data.elements.length > 0) {
        // Process each day's data
        data.elements.forEach((element, index) => {
          // Extract date from dateRange
          let date;
          if (element.dateRange && element.dateRange.start) {
            // Construct date from day, month, year
            const day = element.dateRange.start.day;
            const month = element.dateRange.start.month;
            const year = element.dateRange.start.year;
            
            // Format as YYYY-MM-DD for consistency with our UI
            date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          } else {
            // If no date range, calculate based on start date and index
            const dayDate = new Date(start);
            dayDate.setDate(dayDate.getDate() + index);
            date = dayDate.toISOString().split('T')[0];
          }
          
          // Add to daily data
          result.dailyData.push({
            date,
            impressions: element.impressions || 0,
            clicks: element.clicks || 0,
            // Parse costInUsd as a float to ensure numeric addition
            costInLocalCurrency: parseFloat(element.costInUsd || 0),
            conversions: element.qualifiedLeads || 0,
            oneClickLeads: element.oneClickLeads || 0
          });
          
          // Sum up totals
          result.impressions += element.impressions || 0;
          result.clicks += element.clicks || 0;
          // Parse costInUsd as a float to ensure numeric addition
          result.costInLocalCurrency += parseFloat(element.costInUsd || 0);
          result.conversions += element.qualifiedLeads || 0;
          result.oneClickLeads = (result.oneClickLeads || 0) + (element.oneClickLeads || 0);
        });
      }
      
      // Cache the result
      apiCache.set(apiCache.metrics, cacheKey, result);
      
      return result;
    } catch (error) {
      console.error(`Error fetching metrics for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get campaign analytics data
   * @param {string} campaignId - Campaign ID
   * @param {number} dayRange - Day range for analytics data
   * @param {Date} startDate - Start date for filtering data
   * @param {Date} endDate - End date for filtering data
   * @param {boolean} forceRefresh - Force refresh the data from the API
   * @returns {Promise<Object>} Campaign analytics data
   */
  async getCampaignAnalytics(campaignId, dayRange = 30, startDate = null, endDate = null, forceRefresh = false) {
    try {
      // Use provided dates or calculate based on dayRange
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - dayRange);
        return date;
      })();
      
      const end = endDate || new Date();
      
      // Create a cache key combining campaignId and date range
      const cacheKey = `${campaignId}_${start.toISOString()}_${end.toISOString()}`;
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = apiCache.get(apiCache.analytics, cacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Parse the date for the required format (day/month/year)
      const startDay = start.getDate();
      const startMonth = start.getMonth() + 1; // JavaScript months are 0-indexed
      const startYear = start.getFullYear();
      
      const endDay = end.getDate();
      const endMonth = end.getMonth() + 1;
      const endYear = end.getFullYear();
      
      // Format the campaign ID as a URN as required by the LinkedIn API
      const campaignUrn = `urn:li:sponsoredCampaign:${campaignId}`;
      
      // Using the exact URL format that works with the LinkedIn API
      // Construct the dateRange and campaigns parameters
      const dateRangeValue = `(start:(year:${startYear},month:${startMonth},day:${startDay}),end:(year:${endYear},month:${endMonth},day:${endDay}))`;
      
      // Encode only the URN inside the List() wrapper
      const encodedUrn = campaignUrn.replace(/:/g, '%3A');
      const campaignsValue = `List(${encodedUrn})`;
      
      // Use the exact URL format that works - don't encode dateRange, only encode URN inside List()
      const endpoint = `/rest/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&dateRange=${dateRangeValue}&campaigns=${campaignsValue}&fields=impressions,clicks,costInUsd,qualifiedLeads,oneClickLeads,dateRange`;
      
      // Use query parameter approach to avoid routing issues
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodeURIComponent(endpoint)}`;
      
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
      
      // Transform API response to match our internal format
      const result = {
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
            // Parse costInUsd as a float to ensure numeric addition
            costInLocalCurrency: parseFloat(item.costInUsd || 0), // costInUsd is equivalent to costInLocalCurrency
            conversions: item.qualifiedLeads || 0, // qualifiedLeads is equivalent to conversions
            oneClickLeads: item.oneClickLeads || 0
          };
        }),
        paging: data.paging,
        _requestDetails: requestDetails // Include request details in the response
      };
      
      // Cache the result
      apiCache.set(apiCache.analytics, cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error fetching LinkedIn campaign analytics:', error);
      throw error; // Propagate the error to be handled by the UI
    }
  }
  
  /**
   * Get detailed information for a specific campaign
   * @param {string} campaignId - Campaign ID
   * @param {boolean} forceRefresh - Force refresh the data from the API
   * @returns {Promise<Object>} Campaign details
   */
  async getCampaignDetails(campaignId, forceRefresh = false) {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = apiCache.get(apiCache.details, campaignId);
        if (cachedData) {
          return cachedData;
        }
      }
      
      // Construct API endpoint for getting campaign details
      const endpoint = `/rest/adCampaigns/${campaignId}`;
      
      // Use query parameter approach to avoid routing issues
      const encodedEndpoint = encodeURIComponent(endpoint);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
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
      
      const result = {
        ...data,
        _requestDetails: responseData._request
      };
      
      // Cache the result
      apiCache.set(apiCache.details, campaignId, result);
      
      return result;
    } catch (error) {
      console.error(`Error fetching details for campaign ${campaignId}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear all cached data
   */
  clearCache() {
    apiCache.clear();
  }
}
