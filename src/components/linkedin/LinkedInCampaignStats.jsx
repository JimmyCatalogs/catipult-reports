import React, { useState, useEffect } from 'react';
import { LinkedInAPI } from '../../utils/linkedin-api';
import { ChartRegistration } from './utils/ChartRegistration';
import { LinkedInCampaignTable } from './LinkedInCampaignTable';
import { LinkedInTimeSeriesChart } from './LinkedInTimeSeriesChart';
import { 
  extractDateRange, 
  generateDailyDataForDateRange, 
  calculateAggregatedData 
} from './utils/linkedInChartUtils';

export function LinkedInCampaignStats({ data, title, refreshTrigger }) {
  const [selectedMetric, setSelectedMetric] = useState('impressions');
  const [selectedTimeSeriesMetric, setSelectedTimeSeriesMetric] = useState('impressions');
  const [selectedCampaignForTimeSeries, setSelectedCampaignForTimeSeries] = useState(null);
  const [campaignDailyData, setCampaignDailyData] = useState(null);
  const [loadingDailyData, setLoadingDailyData] = useState(false);
  
  // Ensure Chart.js is registered
  ChartRegistration();
  
  if (!data || !data.campaigns || data.campaigns.length === 0) {
    return (
      <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          {title}
        </h2>
        <div style={{ color: 'var(--muted)' }} className="text-center py-8">
          No campaign data available for this period.
        </div>
      </div>
    );
  }

  // Calculate aggregated data
  const aggregatedData = calculateAggregatedData(data.campaigns);
  
  // Handle metric selection for time series chart
  const handleTimeSeriesMetricChange = (e) => {
    setSelectedTimeSeriesMetric(e.target.value);
  };
  
  // Get the date range from the title
  const dateRange = extractDateRange(title);
  
  // Handle campaign selection for time series
  const handleCampaignTimeSeriesChange = (e) => {
    const campaignId = e.target.value;
    if (campaignId === "") {
      setSelectedCampaignForTimeSeries(null);
      setCampaignDailyData(null);
      return;
    }
    
    // Find the campaign in the data
    // Convert both IDs to strings for comparison to handle both string and number types
    const campaign = data.campaigns.find(c => String(c.id) === String(campaignId));
    if (!campaign) {
      console.error('Campaign not found:', campaignId);
      
      // If campaign is not found, create a placeholder campaign with the ID
      const placeholderCampaign = {
        id: campaignId,
        name: `Campaign ${campaignId}`,
        metrics: {
          impressions: 1000,
          clicks: 50,
          costInLocalCurrency: 100
        }
      };
      
      setSelectedCampaignForTimeSeries(placeholderCampaign);
      return;
    }
    
    setSelectedCampaignForTimeSeries(campaign);
  };
  
  // Update daily data when the selected campaign, date range, or refresh trigger changes
  useEffect(() => {
    if (!selectedCampaignForTimeSeries) {
      setCampaignDailyData(null);
      return;
    }
    
    setLoadingDailyData(true);
    
    // Use the actual daily data from the API if available
    if (selectedCampaignForTimeSeries.metrics && selectedCampaignForTimeSeries.metrics.dailyData) {
      setCampaignDailyData(selectedCampaignForTimeSeries.metrics.dailyData);
      setLoadingDailyData(false);
      return;
    }
    
    // Fallback to generating daily data if not available from API
    const dailyData = generateDailyDataForDateRange(
      selectedCampaignForTimeSeries, 
      dateRange.startDate, 
      dateRange.endDate
    );
    
    setCampaignDailyData(dailyData);
    setLoadingDailyData(false);
  }, [selectedCampaignForTimeSeries, title, refreshTrigger]);

  return (
    <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        {title}
      </h2>
      
      {/* Campaigns Table with Aggregated Totals */}
      <LinkedInCampaignTable campaigns={data.campaigns} aggregatedData={aggregatedData} />
      
      {/* Time Series Chart */}
      <LinkedInTimeSeriesChart 
        campaigns={data.campaigns}
        selectedCampaignForTimeSeries={selectedCampaignForTimeSeries}
        selectedTimeSeriesMetric={selectedTimeSeriesMetric}
        campaignDailyData={campaignDailyData}
        loadingDailyData={loadingDailyData}
        handleCampaignTimeSeriesChange={handleCampaignTimeSeriesChange}
        handleTimeSeriesMetricChange={handleTimeSeriesMetricChange}
      />
    </div>
  );
}
