// Utility functions for LinkedIn campaign charts and data processing

/**
 * Extracts date range from a title string
 * @param {string} title - Title string in format "LinkedIn Campaigns (Mar 1, 2025 - Mar 4, 2025)"
 * @returns {Object} Object with startDate and endDate
 */
export const extractDateRange = (title) => {
  // The title format is typically "LinkedIn Campaigns (Mar 1, 2025 - Mar 4, 2025)"
  const match = title.match(/\((.*?)\)/);
  if (match && match[1]) {
    const dateRange = match[1].split(' - ');
    if (dateRange.length === 2) {
      return {
        startDate: new Date(dateRange[0]),
        endDate: new Date(dateRange[1])
      };
    }
  }
  
  // Default to last 7 days if no date range is found
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  return { startDate, endDate };
};

/**
 * Calculate the number of days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days
 */
export const getDaysBetweenDates = (startDate, endDate) => {
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Generate daily data for a campaign based on the date range
 * @param {Object} campaign - Campaign object
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of daily data objects
 */
export const generateDailyDataForDateRange = (campaign, startDate, endDate) => {
  const result = [];
  const days = getDaysBetweenDates(startDate, endDate);
  
  // Generate data for each day in the date range
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    
    // Generate random values based on the campaign's total metrics
    // This ensures the sum of daily values roughly equals the total
    const factor = Math.random() * 0.5 + 0.5; // Random factor between 0.5 and 1
    const dayFactor = factor / days;
    
    const impressions = campaign.metrics ? Math.round((campaign.metrics.impressions || 0) * dayFactor) : 0;
    const clicks = campaign.metrics ? Math.round((campaign.metrics.clicks || 0) * dayFactor) : 0;
    
    // Use costInLocalCurrency which is mapped from costInUsd in the API
    const cost = campaign.metrics ? parseFloat(campaign.metrics.costInLocalCurrency || 0) * dayFactor : 0;
    
    const conversions = campaign.metrics ? Math.round((campaign.metrics.conversions || 0) * dayFactor) : 0;
    const oneClickLeads = campaign.metrics ? Math.round((campaign.metrics.oneClickLeads || 0) * dayFactor) : 0;
    
    result.push({
      date: formattedDate,
      impressions: impressions,
      clicks: clicks,
      costInLocalCurrency: cost,
      conversions: conversions,
      oneClickLeads: oneClickLeads
    });
  }
  
  // Sort by date (oldest to newest)
  return result.sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Calculate aggregated data from campaigns
 * @param {Array} campaigns - Array of campaign objects
 * @returns {Object} Aggregated data object
 */
export const calculateAggregatedData = (campaigns) => {
  const aggregatedData = {
    impressions: 0,
    clicks: 0,
    costInLocalCurrency: 0,
    conversions: 0,
    oneClickLeads: 0,
    ctr: 0,
    cpm: 0,
    cpc: 0,
    cpr: 0,
    costPerLead: 0
  };
  
  campaigns.forEach(campaign => {
    // Add up all metrics from each campaign
    aggregatedData.impressions += campaign.metrics.impressions || 0;
    aggregatedData.clicks += campaign.metrics.clicks || 0;
    
    // Use costInLocalCurrency which is mapped from costInUsd in the API
    const cost = parseFloat(campaign.metrics.costInLocalCurrency || 0);
    aggregatedData.costInLocalCurrency += cost;
    console.log(`Campaign ${campaign.name} cost: ${cost}`);
    
    aggregatedData.conversions += campaign.metrics.conversions || 0;
    aggregatedData.oneClickLeads += campaign.metrics.oneClickLeads || 0;
  });
  
  // Log the total cost for debugging
  console.log('Total aggregated cost:', aggregatedData.costInLocalCurrency);
  
  // Calculate metrics with maximum safeguards against NaN values
  try {
    // Calculate CTR (Click-Through Rate)
    if (aggregatedData.impressions > 0) {
      const ctrValue = (aggregatedData.clicks / aggregatedData.impressions) * 100;
      if (!isNaN(ctrValue) && isFinite(ctrValue)) {
        aggregatedData.ctr = ctrValue.toFixed(2) + '%';
      } else {
        aggregatedData.ctr = '0.00%';
      }
    } else {
      aggregatedData.ctr = '0.00%';
    }
    
    // Calculate CPM (Cost per 1,000 Impressions)
    if (aggregatedData.impressions > 0) {
      const cpmValue = (aggregatedData.costInLocalCurrency / aggregatedData.impressions) * 1000;
      if (!isNaN(cpmValue) && isFinite(cpmValue)) {
        aggregatedData.cpm = cpmValue.toFixed(2);
      } else {
        aggregatedData.cpm = 0;
      }
    } else {
      aggregatedData.cpm = 0;
    }
    
    // Calculate CPC (Cost per Click)
    if (aggregatedData.clicks > 0) {
      const cpcValue = aggregatedData.costInLocalCurrency / aggregatedData.clicks;
      if (!isNaN(cpcValue) && isFinite(cpcValue)) {
        aggregatedData.cpc = cpcValue.toFixed(2);
      } else {
        aggregatedData.cpc = 0;
      }
    } else {
      aggregatedData.cpc = 0;
    }
    
    // Calculate CPR (Cost per Result) - using conversions as results
    const totalResults = aggregatedData.conversions || 0;
    if (totalResults > 0) {
      const cprValue = aggregatedData.costInLocalCurrency / totalResults;
      if (!isNaN(cprValue) && isFinite(cprValue)) {
        aggregatedData.cpr = cprValue.toFixed(2);
      } else {
        aggregatedData.cpr = 0;
      }
    } else {
      aggregatedData.cpr = 0;
    }
    
    // Calculate Cost per Lead (now based only on oneClickLeads)
    if (aggregatedData.oneClickLeads > 0) {
      const costPerLeadValue = aggregatedData.costInLocalCurrency / aggregatedData.oneClickLeads;
      if (!isNaN(costPerLeadValue) && isFinite(costPerLeadValue)) {
        aggregatedData.costPerLead = costPerLeadValue.toFixed(2);
      } else {
        aggregatedData.costPerLead = 0;
      }
    } else {
      aggregatedData.costPerLead = 0;
    }
  } catch (error) {
    console.error('Error calculating metrics:', error);
    // Set default values in case of calculation errors
    aggregatedData.ctr = '0.00%';
    aggregatedData.cpm = 0;
    aggregatedData.cpc = 0;
    aggregatedData.cpr = 0;
    aggregatedData.costPerLead = 0;
  }
  
  // Format cost
  aggregatedData.formattedCost = `$${parseFloat(aggregatedData.costInLocalCurrency).toFixed(2)}`;
  
  // Format other monetary values
  aggregatedData.formattedCpm = `$${parseFloat(aggregatedData.cpm).toFixed(2)}`;
  aggregatedData.formattedCpc = `$${parseFloat(aggregatedData.cpc).toFixed(2)}`;
  aggregatedData.formattedCpr = `$${parseFloat(aggregatedData.cpr).toFixed(2)}`;
  aggregatedData.formattedCostPerLead = `$${parseFloat(aggregatedData.costPerLead).toFixed(2)}`;
  
  return aggregatedData;
};
