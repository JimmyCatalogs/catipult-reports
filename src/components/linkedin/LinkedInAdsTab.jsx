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

  const fetchCampaignData = async (forceRefresh = false) => {
    setRefreshing(true);
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
      
      // Use the specific endpoint for fetching campaign data
      const encodedEndpoint = encodeURIComponent(`/rest/adAccounts/509440002/adCampaigns?q=search&start=0&count=25`);
      const proxyUrl = `/api/linkedin-proxy?endpoint=${encodedEndpoint}`;
      
      console.log(`📡 Using proxy URL for campaigns: ${proxyUrl}`);
      
      // Make API request via proxy
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${client.apiToken}`,
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
      
      // Get campaign metrics in a separate call
      const campaignsWithMetrics = await Promise.all(
        // Filter to only include ACTIVE campaigns
        data.elements.filter(campaign => campaign.status === 'ACTIVE').map(async (campaign) => {
          try {
            const metrics = await client.getCampaignMetrics(campaign.id, dayDiff);
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
      
      setCampaignData({
        campaigns: campaignsWithMetrics,
        _requestDetails: requestDetails
      });
      
      // Reset selected campaign if it no longer exists in the data
      if (selectedCampaign && !campaignsWithMetrics.find(c => c.id === selectedCampaign.id)) {
        setSelectedCampaign(null);
        setCampaignAnalytics(null);
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
  
  const fetchCampaignAnalytics = async (campaign) => {
    if (!campaign) {
      setCampaignAnalytics(null);
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
      const analyticsData = await client.getCampaignAnalytics(campaign.id, dayDiff);
      
      setCampaignAnalytics(analyticsData);
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
    } else {
      const campaign = campaignData.campaigns.find(c => c.id === campaignId);
      setSelectedCampaign(campaign);
      fetchCampaignAnalytics(campaign);
    }
  };

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchCampaignData();
      if (selectedCampaign) {
        fetchCampaignAnalytics(selectedCampaign);
      }
    }
  }, [dateRange]);

  // Run API connectivity test when component mounts
  useEffect(() => {
    // Test API connectivity
    if (process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID && 
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET && 
        process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID && 
        process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN) {
      
      console.log('🔍 Running LinkedIn API connectivity test on component mount...');
      LinkedInAPI.testConnectivity(
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
        process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID,
        process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN
      ).then(success => {
        if (success) {
          console.log('✅ LinkedIn API connectivity test completed successfully');
        } else {
          console.error('❌ LinkedIn API connectivity test failed');
          // Don't set error state here as fetchCampaignData will handle that
        }
      });
    } else {
      console.error('❌ LinkedIn API connectivity test skipped - missing credentials');
    }
  }, []);
  
  // Set up refresh interval (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => fetchCampaignData(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
          {campaignData && campaignData.campaigns && campaignData.campaigns.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Campaign</label>
              <select
                value={selectedCampaign ? selectedCampaign.id : ""}
                onChange={handleCampaignChange}
                className="rounded-md border px-3 py-2 text-sm w-full sm:w-auto"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="">All Campaigns</option>
                {campaignData.campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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
          
          {campaignAnalytics._requestDetails && (
            <div className="mb-4 p-3 rounded text-xs font-mono overflow-x-auto" style={{ background: 'var(--muted-background)', color: 'var(--muted)' }}>
              <p className="font-semibold mb-1">API Query Details:</p>
              <p>Endpoint: {campaignAnalytics._requestDetails.endpoint}</p>
              <p>Full URL: {campaignAnalytics._requestDetails.fullUrl}</p>
              <p>API Type: {campaignAnalytics._requestDetails.apiType}</p>
              <p>Method: {campaignAnalytics._requestDetails.method}</p>
              <p className="font-semibold mt-2 mb-1">Query Parameters:</p>
              <pre>{JSON.stringify(campaignAnalytics._requestDetails.queryParams, null, 2)}</pre>
            </div>
          )}
          
          <div className="mb-6">
            {campaignAnalytics.elements && campaignAnalytics.elements.length > 0 ? (
              <Line 
                data={{
                  labels: campaignAnalytics.elements.map(item => item.date),
                  datasets: [
                    {
                      label: 'Impressions',
                      data: campaignAnalytics.elements.map(item => item.impressions),
                      borderColor: 'rgba(54, 162, 235, 1)',
                      backgroundColor: 'rgba(54, 162, 235, 0.2)',
                      tension: 0.1,
                      fill: true,
                    },
                    {
                      label: 'Clicks',
                      data: campaignAnalytics.elements.map(item => item.clicks),
                      borderColor: 'rgba(255, 99, 132, 1)',
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      tension: 0.1,
                      fill: true,
                    },
                    {
                      label: 'Conversions',
                      data: campaignAnalytics.elements.map(item => item.conversions),
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
                      text: 'Campaign Performance Over Time',
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
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Impressions</th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Clicks</th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>CTR</th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Conversions</th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {campaignAnalytics.elements.map((item, index) => {
                  const impressions = item.impressions || 0;
                  const clicks = item.clicks || 0;
                  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%';
                  const conversions = item.conversions || 0;
                  const cost = item.costInLocalCurrency 
                    ? `$${parseFloat(item.costInLocalCurrency).toFixed(2)}` 
                    : '$0.00';

                  return (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{item.date}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{impressions.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{clicks.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{ctr}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{conversions.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cost}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <LinkedInCampaignStats 
          data={campaignData} 
          title={`LinkedIn Campaigns (${getDateRangeString(dateRange.startDate, dateRange.endDate)})`}
        />
      )}
    </div>
  );
}
