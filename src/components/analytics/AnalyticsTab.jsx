import { useState, useEffect } from 'react';
import { GoogleAnalyticsAPI } from '../../utils/google-analytics-api';
import { LoadingBar } from '../LoadingBar';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PageViewsPanel } from './PageViewsPanel';
import { EventsPanel } from './EventsPanel';

export function AnalyticsTab() {
  const [activeTab, setActiveTab] = useState('pageViews'); // 'pageViews' or 'events'
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
    source: [],
    medium: [],
    events: [],
    buttonClickEvents: [],
  });
  const [trafficView, setTrafficView] = useState('sourceMedium'); // 'sourceMedium', 'source', or 'medium'
  const [buttonClickView, setButtonClickView] = useState('pageLabel'); // 'pageLabel', 'page', or 'label'
  const [selectedFilters, setSelectedFilters] = useState({
    sourceMedium: [],
    source: [],
    medium: [],
    buttonClickPageLabel: [],
    buttonClickPage: [],
    buttonClickLabel: [],
  });
  const [showFilters, setShowFilters] = useState(false);

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
      sourceMedium: [],
      source: [],
      medium: [],
      events: [],
      buttonClickEvents: []
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
    
    try {
      newAnalyticsData.source = await analyticsClient.getSource(startDate, endDate);
    } catch (err) {
      console.error('Error fetching source data:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
    }
    
    try {
      newAnalyticsData.medium = await analyticsClient.getMedium(startDate, endDate);
    } catch (err) {
      console.error('Error fetching medium data:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
    }
    
    try {
      newAnalyticsData.events = await analyticsClient.getEvents(startDate, endDate);
    } catch (err) {
      console.error('Error fetching events data:', err);
      if (err.error === 'DATE_TOO_EARLY') {
        hasDateRangeError = true;
      } else {
        hasOtherError = true;
      }
    }
    
    try {
      newAnalyticsData.buttonClickEvents = await analyticsClient.getButtonClickEvents(startDate, endDate);
    } catch (err) {
      console.error('Error fetching button click events data:', err);
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

  const handleFilterChange = (option) => {
    setSelectedFilters(prev => {
      const currentFilters = [...prev[trafficView]];
      if (currentFilters.includes(option)) {
        return {
          ...prev,
          [trafficView]: currentFilters.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          [trafficView]: [...currentFilters, option]
        };
      }
    });
  };
  
  const handleViewChange = (view) => {
    setTrafficView(view);
  };
  
  const handleButtonClickViewChange = (view) => {
    setButtonClickView(view);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleButtonClickFilterChange = (option) => {
    const filterType = buttonClickView === 'pageLabel' ? 'buttonClickPageLabel' : 
                      buttonClickView === 'page' ? 'buttonClickPage' : 'buttonClickLabel';
    
    setSelectedFilters(prev => {
      const currentFilters = [...prev[filterType]];
      if (currentFilters.includes(option)) {
        return {
          ...prev,
          [filterType]: currentFilters.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          [filterType]: [...currentFilters, option]
        };
      }
    });
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
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('pageViews')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'pageViews'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Page Views
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'events'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Events
          </button>
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
          {analyticsData.userMetrics && !dateRangeError && (
            <div className="bg-white py-2 px-3 rounded-md shadow-sm border border-gray-100 inline-flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Total Visitors:</span>
              <span className="text-lg text-gray-800">{analyticsData.userMetrics.metricValues[0].value}</span>
            </div>
          )}
        </div>
      </div>

      {/* Page Views Tab Content */}
      {activeTab === 'pageViews' && !dateRangeError && (
        <PageViewsPanel 
          pageViews={analyticsData.pageViews}
          topPages={analyticsData.topPages}
          sourceMedium={analyticsData.sourceMedium}
          source={analyticsData.source}
          medium={analyticsData.medium}
          dateRangeError={dateRangeError}
          trafficView={trafficView}
          handleViewChange={handleViewChange}
          showFilters={showFilters}
          toggleFilters={toggleFilters}
          selectedFilters={selectedFilters}
          handleFilterChange={handleFilterChange}
          setSelectedFilters={setSelectedFilters}
        />
      )}

      {/* Events Tab Content */}
      {activeTab === 'events' && !dateRangeError && (
        <EventsPanel 
          events={analyticsData.events}
          buttonClickEvents={analyticsData.buttonClickEvents}
          dateRangeError={dateRangeError}
          buttonClickView={buttonClickView}
          handleButtonClickViewChange={handleButtonClickViewChange}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          selectedFilters={selectedFilters}
          handleButtonClickFilterChange={handleButtonClickFilterChange}
          setSelectedFilters={setSelectedFilters}
        />
      )}
    </div>
  );
}
