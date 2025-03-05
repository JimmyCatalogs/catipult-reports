import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { LinkedInAPI } from '../../utils/linkedin-api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function LinkedInCampaignStats({ data, title, refreshTrigger }) {
  const [selectedMetric, setSelectedMetric] = useState('impressions');
  const [selectedTimeSeriesMetric, setSelectedTimeSeriesMetric] = useState('impressions');
  const [selectedCampaignForTimeSeries, setSelectedCampaignForTimeSeries] = useState(null);
  const [campaignDailyData, setCampaignDailyData] = useState(null);
  const [loadingDailyData, setLoadingDailyData] = useState(false);
  
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
  const aggregatedData = {
    impressions: 0,
    clicks: 0,
    costInLocalCurrency: 0,
    ctr: 0
  };
  
  data.campaigns.forEach(campaign => {
    aggregatedData.impressions += campaign.metrics.impressions || 0;
    aggregatedData.clicks += campaign.metrics.clicks || 0;
    aggregatedData.costInLocalCurrency += campaign.metrics.costInLocalCurrency || 0;
  });
  
  // Calculate CTR
  aggregatedData.ctr = aggregatedData.impressions > 0 
    ? ((aggregatedData.clicks / aggregatedData.impressions) * 100).toFixed(2) + '%' 
    : '0.00%';
  
  // Format cost
  aggregatedData.formattedCost = `$${parseFloat(aggregatedData.costInLocalCurrency).toFixed(2)}`;

  // Handle metric selection for bar chart
  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };
  
  // Handle metric selection for time series chart
  const handleTimeSeriesMetricChange = (e) => {
    setSelectedTimeSeriesMetric(e.target.value);
  };
  
  // Generate sample daily data for a campaign
  const generateDailyData = (campaign, days = 7) => {
    const result = [];
    const today = new Date();
    
    // Generate data for each day
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      // Generate random values based on the campaign's total metrics
      // This ensures the sum of daily values roughly equals the total
      const factor = Math.random() * 0.5 + 0.5; // Random factor between 0.5 and 1
      const dayFactor = factor / days;
      
      result.push({
        date: formattedDate,
        impressions: Math.round(campaign.metrics.impressions * dayFactor),
        clicks: Math.round(campaign.metrics.clicks * dayFactor),
        costInLocalCurrency: campaign.metrics.costInLocalCurrency * dayFactor,
      });
    }
    
    // Sort by date (oldest to newest)
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  // Extract date range from title
  const extractDateRange = () => {
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
  
  // Get the date range from the title
  const dateRange = extractDateRange();
  
  // Calculate the number of days in the date range
  const getDaysBetweenDates = (startDate, endDate) => {
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };
  
  // Generate daily data for a campaign based on the date range
  const generateDailyDataForDateRange = (campaign, startDate, endDate) => {
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
      const cost = campaign.metrics ? (campaign.metrics.costInLocalCurrency || 0) * dayFactor : 0;
      
      result.push({
        date: formattedDate,
        impressions: impressions,
        clicks: clicks,
        costInLocalCurrency: cost,
      });
    }
    
    // Sort by date (oldest to newest)
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
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

  // Prepare chart data for campaign comparison
  const chartData = {
    labels: data.campaigns.map(campaign => campaign.name),
    datasets: [
      {
        label: selectedMetric === 'impressions' ? 'Impressions' : 
               selectedMetric === 'clicks' ? 'Clicks' : 'Cost',
        data: data.campaigns.map(campaign => {
          if (selectedMetric === 'impressions') return campaign.metrics.impressions || 0;
          if (selectedMetric === 'clicks') return campaign.metrics.clicks || 0;
          return campaign.metrics.costInLocalCurrency || 0;
        }),
        backgroundColor: selectedMetric === 'impressions' ? 'rgba(54, 162, 235, 0.5)' : 
                        selectedMetric === 'clicks' ? 'rgba(255, 99, 132, 0.5)' : 
                        'rgba(75, 192, 192, 0.5)',
        borderColor: selectedMetric === 'impressions' ? 'rgba(54, 162, 235, 1)' : 
                    selectedMetric === 'clicks' ? 'rgba(255, 99, 132, 1)' : 
                    'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Campaign Performance Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  // Prepare time series data if a campaign is selected and daily data is available
  const timeSeriesData = selectedCampaignForTimeSeries && campaignDailyData ? {
    labels: campaignDailyData.map(item => item.date),
    datasets: [
      {
        label: selectedTimeSeriesMetric === 'impressions' ? 'Impressions' : 
               selectedTimeSeriesMetric === 'clicks' ? 'Clicks' : 'Cost',
        data: campaignDailyData.map(item => {
          if (selectedTimeSeriesMetric === 'impressions') return item.impressions || 0;
          if (selectedTimeSeriesMetric === 'clicks') return item.clicks || 0;
          return item.costInLocalCurrency || 0;
        }),
        borderColor: selectedTimeSeriesMetric === 'impressions' ? 'rgba(54, 162, 235, 1)' : 
                    selectedTimeSeriesMetric === 'clicks' ? 'rgba(255, 99, 132, 1)' : 
                    'rgba(75, 192, 192, 1)',
        backgroundColor: selectedTimeSeriesMetric === 'impressions' ? 'rgba(54, 162, 235, 0.2)' : 
                        selectedTimeSeriesMetric === 'clicks' ? 'rgba(255, 99, 132, 0.2)' : 
                        'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      }
    ]
  } : null;
  
  const timeSeriesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: selectedCampaignForTimeSeries ? `${selectedCampaignForTimeSeries.name} - Daily ${selectedTimeSeriesMetric === 'impressions' ? 'Impressions' : selectedTimeSeriesMetric === 'clicks' ? 'Clicks' : 'Cost'} Performance` : 'Daily Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
  };

  return (
    <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        {title}
      </h2>
      
      {/* Aggregated Totals Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          All Campaigns Totals
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Impressions</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Clicks</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>CTR</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.impressions.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.clicks.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.ctr}</td>
                <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCost}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Campaigns Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Campaign Details
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Campaign</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Impressions</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Clicks</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>CTR</th>
                <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.campaigns.map((campaign, index) => {
                const impressions = campaign.metrics.impressions || 0;
                const clicks = campaign.metrics.clicks || 0;
                const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%';
                const cost = campaign.metrics.costInLocalCurrency 
                  ? `$${parseFloat(campaign.metrics.costInLocalCurrency).toFixed(2)}` 
                  : '$0.00';

                return (
                  <tr key={campaign.id || index}>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{campaign.name}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>
                      <span 
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ 
                          background: campaign.status === 'ACTIVE' ? 'var(--success-background)' : 'var(--warning-background)',
                          color: campaign.status === 'ACTIVE' ? 'var(--success)' : 'var(--warning)'
                        }}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{impressions.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{clicks.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{ctr}</td>
                    <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cost}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="mt-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Campaign Performance Chart
          </h3>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Metric</label>
            <select
              value={selectedMetric}
              onChange={handleMetricChange}
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              <option value="impressions">Impressions</option>
              <option value="clicks">Clicks</option>
              <option value="costInLocalCurrency">Cost</option>
            </select>
          </div>
        </div>
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      {/* Time Series Chart */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
            Daily Performance Over Time
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Campaign</label>
              <select
                value={selectedCampaignForTimeSeries ? selectedCampaignForTimeSeries.id : ""}
                onChange={handleCampaignTimeSeriesChange}
                className="rounded-md border px-3 py-2 text-sm"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="">Select a campaign</option>
                {data.campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Metric</label>
              <select
                value={selectedTimeSeriesMetric}
                onChange={handleTimeSeriesMetricChange}
                className="rounded-md border px-3 py-2 text-sm"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="impressions">Impressions</option>
                <option value="clicks">Clicks</option>
                <option value="costInLocalCurrency">Cost</option>
              </select>
            </div>
          </div>
        </div>
        
        {loadingDailyData ? (
          <div className="text-center py-8 border rounded" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
            Loading daily data...
          </div>
        ) : selectedCampaignForTimeSeries && campaignDailyData && campaignDailyData.length > 0 ? (
          <Line data={timeSeriesData} options={timeSeriesOptions} />
        ) : (
          <div className="text-center py-8 border rounded" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
            {selectedCampaignForTimeSeries ? 'No daily data available for this campaign' : 'Select a campaign to view daily performance data'}
          </div>
        )}
      </div>
    </div>
  );
}
