import React, { useState, useEffect } from 'react';
import { LinkedInCampaignStats } from './LinkedInCampaignStats';
import { getLastNDaysRange, getDateRangeString } from '../../utils/dates';
import { LinkedInAPI } from '../../utils/linkedin-api';
import { LoadingBar } from '../LoadingBar';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Line } from 'react-chartjs-2';

export function LinkedInAdsTab() {
  // Default to last 7 days
  const defaultDateRange = getLastNDaysRange(7);
  
  const [dateRange, setDateRange] = useState({
    startDate: defaultDateRange.start,
    endDate: defaultDateRange.end
  });
  
  const [datePickerRange, setDatePickerRange] = useState([
    defaultDateRange.start,
    defaultDateRange.end
  ]);
  
  const [campaignData, setCampaignData] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignAnalytics, setCampaignAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('impressions');
  const [aggregatedData, setAggregatedData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCampaignData = async (forceRefresh = false) => {
    setRefreshing(true);
    // Increment the refresh trigger to force a re-render of the LinkedInCampaignStats component
    setRefreshTrigger(prev => prev + 1);
    try {
      // Check if environment variables are set
      if (!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || 
          !process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET || 
          !process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID || 
          !process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN) {
        throw new Error('LinkedIn API credentials are missing. Please check your environment variables.');
      }
      
      const client = new LinkedInAPI(
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID,
        process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN
      );
      
      // Calculate the number of days in the date range
      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Use the LinkedInAPI class to fetch campaign data
      // Pass forceRefresh=true when the refresh button is clicked
      const campaignResponse = await client.getCampaigns(dayDiff, startDate, endDate, forceRefresh);
      
      // The campaigns are already filtered to active ones in the API utility
      setCampaignData(campaignResponse);
      
      // Reset selected campaign if it no longer exists in the data
      if (selectedCampaign && !campaignResponse.campaigns.find(c => c.id === selectedCampaign.id)) {
        setSelectedCampaign(null);
        setCampaignAnalytics(null);
      } else if (selectedCampaign) {
        // If we have a selected campaign, refresh its analytics too
        fetchCampaignAnalytics(selectedCampaign, forceRefresh);
      }
      
      setError(null);
    } catch (err) {
      let errorMessage = 'Failed to load LinkedIn campaign data. Please try again later.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for specific error types
        if (errorMessage.includes('authenticate')) {
          errorMessage = 'Authentication failed. Please check your LinkedIn API credentials in the .env.local file.';
        } else if (errorMessage.includes('access token')) {
          errorMessage = 'Failed to get access token. Your refresh token may have expired. Please generate a new one.';
        }
      }
      
      setError(errorMessage);
      console.error('Error fetching LinkedIn campaign data:', err);
      
      // Clear campaign data if there was an error
      setCampaignData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchCampaignAnalytics = async (campaign, forceRefresh = false) => {
    if (!campaign) {
      setCampaignAnalytics(null);
      setAggregatedData(null);
      return;
    }
    
    setRefreshing(true);
    try {
      // Use the getCampaignAnalytics method from the LinkedInAPI class
      const client = new LinkedInAPI(
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID,
        process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN
      );
      
      // Calculate the number of days in the date range
      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Use the API method that has the correct URL format and field mapping
      // Pass forceRefresh parameter to bypass cache when refreshing
      const analyticsData = await client.getCampaignAnalytics(campaign.id, dayDiff, startDate, endDate, forceRefresh);
      
      setCampaignAnalytics(analyticsData);
      
      // Calculate aggregated data
      if (analyticsData.elements && analyticsData.elements.length > 0) {
        const totals = {
          impressions: 0,
          clicks: 0,
          costInLocalCurrency: 0,
          ctr: 0
        };
        
        analyticsData.elements.forEach(item => {
          totals.impressions += item.impressions || 0;
          totals.clicks += item.clicks || 0;
          totals.costInLocalCurrency += item.costInLocalCurrency || 0;
        });
        
        // Calculate CTR
        totals.ctr = totals.impressions > 0 
          ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' 
          : '0.00%';
        
        // Format cost
        totals.formattedCost = `$${parseFloat(totals.costInLocalCurrency).toFixed(2)}`;
        
        setAggregatedData(totals);
      }
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      
      // Set a specific error for campaign analytics
      let analyticsErrorMessage = 'Failed to load campaign analytics data.';
      
      if (err instanceof Error) {
        analyticsErrorMessage = `Campaign analytics error: ${err.message}`;
      }
      
      // Set the error state but don't clear the campaign data
      setError(analyticsErrorMessage);
      setCampaignAnalytics(null);
      setAggregatedData(null);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle date range changes
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setDatePickerRange(dates);
    
    if (start && end) {
      setDateRange({
        startDate: start,
        endDate: end
      });
    }
  };
  
  // Handle campaign selection
  const handleCampaignChange = (e) => {
    const campaignId = e.target.value;
    if (campaignId === "") {
      setSelectedCampaign(null);
      setCampaignAnalytics(null);
      setAggregatedData(null);
    } else {
      const campaign = campaignData.campaigns.find(c => c.id === campaignId);
      setSelectedCampaign(campaign);
      fetchCampaignAnalytics(campaign);
    }
  };
  
  // Handle metric selection
  const handleMetricChange = (e) => {
    setSelectedMetric(e.target.value);
  };

  // Initial data load and API connectivity test when component mounts
  useEffect(() => {
    // Only run this effect once on component mount
    const loadInitialData = async () => {
      // Check if credentials are available
      if (process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID && 
          process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET && 
          process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID && 
          process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN) {
        
        // First test connectivity without setting loading state
        // to avoid unnecessary UI flicker if the test is quick
        const isConnected = await LinkedInAPI.testConnectivity(
          process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
          process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET,
          process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID,
          process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN
        );
        
        if (isConnected) {
          // If connected, fetch the campaign data
          await fetchCampaignData();
        } else {
          // If not connected, just set loading to false
          setLoading(false);
        }
      } else {
        setError('LinkedIn API credentials are missing. Please check your environment variables.');
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Set up refresh interval (every 5 minutes)
    const interval = setInterval(() => fetchCampaignData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch data when date range changes, but not on initial render
  useEffect(() => {
    // Skip the initial render since we already fetch data in the mount effect
    if (dateRange.startDate && dateRange.endDate && !loading) {
      fetchCampaignData();
    }
  }, [dateRange.startDate, dateRange.endDate]);
  
  // Fetch analytics when campaign selection changes
  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignAnalytics(selectedCampaign);
    }
  }, [selectedCampaign]);

  return (
    <div className="pb-8">
      {refreshing && !loading && (
        <div className="absolute top-0 left-0 w-full">
          <LoadingBar progress={1} />
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            LinkedIn Ads Analytics
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={() => fetchCampaignData(true)}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              background: 'var(--primary)',
              color: 'white'
            }}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Date Range</label>
            <DatePicker
              selectsRange={true}
              startDate={datePickerRange[0]}
              endDate={datePickerRange[1]}
              onChange={handleDateChange}
              className="rounded-md border px-3 py-2 text-sm w-full sm:w-auto"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              dateFormat="MMM d, yyyy"
              isClearable={false}
              showPopperArrow={false}
              placeholderText="Select date range"
            />
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--primary-background)', borderColor: 'var(--primary)', color: 'var(--primary)' }} className="border rounded-lg p-4 mb-8">
        <p className="font-bold">
          LinkedIn Ads Analytics
        </p>
        <p className="mt-2">
          This tab connects to the LinkedIn Marketing API to fetch real campaign data. Select a campaign from the dropdown to view detailed performance metrics over time.
        </p>
        <p className="mt-2">
          For more advanced analytics, you can also visit the{' '}
          <a 
            href="https://www.linkedin.com/campaignmanager/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--primary)' }}
            className="underline hover:opacity-80"
          >
            LinkedIn Campaign Manager
          </a>.
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--error-background)', color: 'var(--error)', borderColor: 'var(--error)' }} className="border px-4 py-3 rounded relative mb-8" role="alert">
          <div className="font-bold mb-1">Error:</div>
          <div>{error}</div>
          <div className="mt-2 text-sm">
            <p>Possible solutions:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>Check your LinkedIn API credentials in the .env.local file</li>
              <li>Verify that your LinkedIn account has access to the Marketing API</li>
              <li>Ensure your refresh token is valid and not expired</li>
              <li>Check the browser console for more detailed error information</li>
            </ul>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-8">
          <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div style={{ background: 'var(--muted-background)' }} className="h-8 rounded w-1/4"></div>
              <div style={{ background: 'var(--muted-background)' }} className="h-[200px] rounded w-full"></div>
            </div>
          </div>
        </div>
      ) : selectedCampaign && campaignAnalytics ? (
        <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
            {selectedCampaign.name} - Performance Over Time ({getDateRangeString(dateRange.startDate, dateRange.endDate)})
          </h2>
          
          {/* Aggregated Totals Table */}
          {aggregatedData && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Campaign Totals
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
          )}
          
          {/* Daily Data Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              Daily Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Date</th>
                    <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Impressions</th>
                    <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Clicks</th>
                    <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>CTR</th>
                    <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {selectedCampaign.metrics.dailyData && selectedCampaign.metrics.dailyData.map((item, index) => {
                    const impressions = item.impressions || 0;
                    const clicks = item.clicks || 0;
                    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%';
                    const cost = item.costInLocalCurrency 
                      ? `$${parseFloat(item.costInLocalCurrency).toFixed(2)}` 
                      : '$0.00';

                    return (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{item.date}</td>
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
          <div className="mt-8">
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
            
            {selectedCampaign.metrics.dailyData && selectedCampaign.metrics.dailyData.length > 0 ? (
              <Line 
                data={{
                  labels: selectedCampaign.metrics.dailyData.map(item => item.date),
                  datasets: [
                    {
                      label: selectedMetric === 'impressions' ? 'Impressions' : 
                             selectedMetric === 'clicks' ? 'Clicks' : 'Cost',
                      data: selectedCampaign.metrics.dailyData.map(item => item[selectedMetric] || 0),
                      borderColor: selectedMetric === 'impressions' ? 'rgba(54, 162, 235, 1)' : 
                                  selectedMetric === 'clicks' ? 'rgba(255, 99, 132, 1)' : 
                                  'rgba(75, 192, 192, 1)',
                      backgroundColor: selectedMetric === 'impressions' ? 'rgba(54, 162, 235, 0.2)' : 
                                      selectedMetric === 'clicks' ? 'rgba(255, 99, 132, 0.2)' : 
                                      'rgba(75, 192, 192, 0.2)',
                      tension: 0.1,
                      fill: true,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: `${selectedMetric === 'impressions' ? 'Impressions' : 
                             selectedMetric === 'clicks' ? 'Clicks' : 'Cost'} Over Time`,
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
                }}
              />
            ) : (
              <div style={{ color: 'var(--muted)' }} className="text-center py-8">
                No time-series data available for this campaign.
              </div>
            )}
          </div>
        </div>
      ) : (
        <LinkedInCampaignStats 
          data={campaignData} 
          title={`LinkedIn Campaigns (${getDateRangeString(dateRange.startDate, dateRange.endDate)})`}
          refreshTrigger={refreshTrigger}
        />
      )}
    </div>
  );
}
