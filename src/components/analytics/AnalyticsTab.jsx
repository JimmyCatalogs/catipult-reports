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
  });

  const analyticsClient = new GoogleAnalyticsAPI();

  const fetchAnalyticsData = async (start, end) => {
    setLoading(true);
    setRefreshing(true);
    try {
      // Format dates as YYYY-MM-DD for GA4
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      
      console.log('Fetching analytics data for range:', { startDate, endDate });
      
      const [pageViews, userMetrics, topPages] = await Promise.all([
        analyticsClient.getPageViews(startDate, endDate),
        analyticsClient.getUserMetrics(startDate, endDate),
        analyticsClient.getTopPages(startDate, endDate)
      ]);

      setAnalyticsData({
        pageViews,
        userMetrics,
        topPages
      });
      setError(null);
      setDateRangeError(null); // Clear date range error on successful data fetch
    } catch (err) {
      // Check if this is the specific Google Analytics DATE_TOO_EARLY error
      if (err.message?.includes('Analytics data is only available from February 18')) {
        setDateRangeError('Analytics data is only available from February 18, 2025 onwards');
        setAnalyticsData({
          pageViews: [],
          userMetrics: {
            metricValues: [
              { value: '0' },
              { value: '0' },
              { value: '0' }
            ]
          },
          topPages: [],
        });
        setError(null);
      } else {
        setError('Failed to fetch analytics data. Please try again later.');
        setDateRangeError(null);
        console.error('Error fetching analytics data:', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
    labels: analyticsData.pageViews.map(row => formatGADate(row.dimensionValues[0].value)),
    datasets: [{
      label: 'Page Views',
      data: analyticsData.pageViews.map(row => parseInt(row.metricValues[0].value)),
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

  return (
    <div className="space-y-6">
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

      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Google Analytics
          </h1>
        </div>
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Date Range</label>
            <DatePicker
              selectsRange={true}
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              onChange={handleDateChange}
              className="rounded-md border px-3 py-2 text-sm min-w-[210px]"
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
              <h3 className="text-lg font-semibold mb-2">Total Users</h3>
              <p className="text-3xl">{analyticsData.userMetrics.metricValues[0].value}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">New Users</h3>
              <p className="text-3xl">{analyticsData.userMetrics.metricValues[1].value}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Active Users</h3>
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
    </div>
  );
}
