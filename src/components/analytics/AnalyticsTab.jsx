import { useState, useEffect } from 'react';
import { GoogleAnalyticsAPI } from '../../utils/google-analytics-api';
import { LoadingBar } from '../LoadingBar';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper function to parse GA4 date format (YYYYMMDD)
function formatGADate(gaDate) {
  const year = gaDate.substring(0, 4);
  const month = gaDate.substring(4, 6);
  const day = gaDate.substring(6, 8);
  const date = new Date(year, parseInt(month) - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function AnalyticsTab() {
  const [dateRange, setDateRange] = useState([
    new Date(new Date().setDate(new Date().getDate() - 7)), // 7 days ago
    new Date() // today
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRangeError, setDateRangeError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    pageViews: [],
    userMetrics: null,
    topPages: [],
    sourceMedium: [],
  });

  const analyticsClient = new GoogleAnalyticsAPI();

  const fetchAnalyticsData = async (start, end) => {
    setLoading(true);
    setRefreshing(true);
    
    // Format dates as YYYY-MM-DD for GA4
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];
    
    console.log('Fetching analytics data for range:', { startDate, endDate });
    
    // Initialize with empty data
    const newAnalyticsData = {
      pageViews: [],
      userMetrics: null,
      topPages: [],
      sourceMedium: []
    };
    
    let hasDateRangeError = false;
    let hasOtherError = false;
    
    try {
      newAnalyticsData.pageViews = await analyticsClient.getPageViews(startDate, endDate);
    } catch (err) {
      console.error('Error fetching page views:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
    }
    
    try {
      newAnalyticsData.userMetrics = await analyticsClient.getUserMetrics(startDate, endDate);
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
      // Provide default user metrics if there's an error
      if (!newAnalyticsData.userMetrics) {
        newAnalyticsData.userMetrics = {
          metricValues: [
            { value: '0' },
            { value: '0' },
            { value: '0' }
          ]
        };
      }
    }
    
    try {
      newAnalyticsData.topPages = await analyticsClient.getTopPages(startDate, endDate);
    } catch (err) {
      console.error('Error fetching top pages:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
    }
    
    try {
      newAnalyticsData.sourceMedium = await analyticsClient.getSourceMedium(startDate, endDate);
    } catch (err) {
      console.error('Error fetching source/medium data:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
    }
    
    // Update state with the data we were able to fetch
    setAnalyticsData(newAnalyticsData);
    
    // Handle errors
    if (hasDateRangeError) {
      setDateRangeError('Analytics data is only available from February 18, 2025 onwards');
      setError(null);
    } else if (hasOtherError) {
      setError('Some analytics data could not be loaded. Please try again later.');
      setDateRangeError(null);
    } else {
      setError(null);
      setDateRangeError(null);
    }
    
    // Always reset loading state
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchAnalyticsData(dateRange[0], dateRange[1]);
    }
  }, [dateRange]);

  const handleRefresh = () => {
    if (dateRange[0] && dateRange[1]) {
      fetchAnalyticsData(dateRange[0], dateRange[1]);
    }
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setDateRange([start, end]);
  };

  const pageViewsChartData = {
    labels: analyticsData.pageViews
      .slice() // Create a copy to avoid mutating the original array
      .sort((a, b) => {
        // Sort by date (YYYYMMDD format)
        return a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value);
      })
      .map(row => formatGADate(row.dimensionValues[0].value)),
    datasets: [{
      label: 'Page Views',
      data: analyticsData.pageViews
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => {
          // Sort by date (YYYYMMDD format)
          return a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value);
        })
        .map(row => parseInt(row.metricValues[0].value)),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const topPagesChartData = {
    labels: analyticsData.topPages.map(row => {
      const path = row.dimensionValues[0].value;
      return path === '/' ? 'Home' : path.replace(/^\//, '');
    }),
    datasets: [{
      label: 'Views',
      data: analyticsData.topPages.map(row => parseInt(row.metricValues[0].value)),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    }]
  };

  const sourceMediumChartData = {
    labels: analyticsData.sourceMedium.map(row => {
      const sessionSource = row.dimensionValues[0].value || '(not set)';
      const sessionMedium = row.dimensionValues[1].value || '(not set)';
      return `${sessionSource} / ${sessionMedium}`;
    }),
    datasets: [{
      label: 'Users',
      data: analyticsData.sourceMedium.map(row => parseInt(row.metricValues[0].value)),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    }]
  };

  return (
    <div className="space-y-6 pb-8">
      {loading && <LoadingBar progress={1} />}

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
        </div>
      )}
      
      {dateRangeError && (
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          {dateRangeError}
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Google Analytics
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            onClick={handleRefresh}
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
              startDate={dateRange[0]}
              endDate={dateRange[1]}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {analyticsData.userMetrics && !dateRangeError && (
          <>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Total Visitors</h3>
              <p className="text-3xl">{analyticsData.userMetrics.metricValues[0].value}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">New Visitors</h3>
              <p className="text-3xl">{analyticsData.userMetrics.metricValues[1].value}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Active Visitors</h3>
              <p className="text-3xl">{analyticsData.userMetrics.metricValues[2].value}</p>
            </div>
          </>
        )}
      </div>

      {!dateRangeError && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Page Views Over Time</h3>
          <div className="h-[300px]">
            {analyticsData.pageViews.length > 0 && (
            <Line 
              data={pageViewsChartData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Page Views'
                    }
                  }
                }
              }} 
            />
            )}
          </div>
        </div>
      )}

      {!dateRangeError && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
          <div className="h-[400px]">
            {analyticsData.topPages.length > 0 && (
              <Bar 
                data={topPagesChartData}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                }}
              />
            )}
          </div>
        </div>
      )}

      {!dateRangeError && (
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold mb-4">Session Traffic Sources</h3>
          <div className="h-[400px]">
            {analyticsData.sourceMedium.length > 0 && (
              <Bar 
                data={sourceMediumChartData}
                options={{
                  indexAxis: 'y',
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: function(context) {
                          return context[0].label;
                        },
                        label: function(context) {
                          return `Users: ${context.raw}`;
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
