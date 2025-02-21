import React, { useState, useEffect, useRef } from 'react';
import { AircallAPI } from '../../utils/aircall-api';
import { callsStore } from '../../utils/calls-store';
import { CallsTab } from './CallsTab';

// Create a single instance of AircallAPI for this container
const aircallClient = new AircallAPI('9ec53b199aeda57d9daf6279a4c88a7f');

export function CallsContainer() {
  const [activeCallsView, setActiveCallsView] = useState('list');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [callsData, setCallsData] = useState(null);
  const [callsAnalytics, setCallsAnalytics] = useState(null);
  const [analyticsProgress, setAnalyticsProgress] = useState(0);
  // Set initial date range to cover last 7 days including today
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    now.setHours(23, 59, 59);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // -6 to include current day
    sevenDaysAgo.setHours(0, 0, 0);
    return {
      from: Math.floor(sevenDaysAgo.getTime() / 1000),
      to: Math.floor(now.getTime() / 1000)
    };
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20
  });
  const [sorting, setSorting] = useState({
    order: 'desc',
    order_by: 'started_at'
  });

  const fetchCalls = async (forceRefresh = false, customDateRange = null) => {
    try {
      setRefreshing(true);
      
      // Always set progress callback to show loading progress
      aircallClient.setAnalyticsProgressCallback(setAnalyticsProgress);

      // Use custom date range if provided, otherwise use state
      const fetchDateRange = customDateRange || dateRange;

      // Fetch data with the same parameters
      const data = await aircallClient.getCalls({
        from: fetchDateRange.from.toString(),
        to: fetchDateRange.to.toString(),
        ...pagination,
        ...sorting,
        direction: '',
        status: '',
        user_id: ''
      }, !forceRefresh);
      
      // Update store with new data and date range
      callsStore.updateCalls(data.calls, fetchDateRange);
      setCallsData(data);

      // Get analytics directly from store since data is already fetched
      if (activeCallsView === 'analytics') {
        setCallsAnalytics(callsStore.getAnalytics());
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calls data. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching calls data:', err);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      setAnalyticsProgress(0);
      aircallClient.setAnalyticsProgressCallback(null);
    }
  };

  // Use ref to track initial fetch
  const initialFetchDone = useRef(false);

  // Effect to handle initial data fetch
  useEffect(() => {
    if (!initialFetchDone.current && !refreshing) {
      initialFetchDone.current = true;
      fetchCalls();
    }
  }, [refreshing]);

  // Effect to update view from store when switching views
  useEffect(() => {
    if (initialFetchDone.current && !refreshing) {
      const data = callsStore.getCalls({
        sorting,
        pagination
      });
      setCallsData(data);

      if (activeCallsView === 'analytics') {
        const analytics = callsStore.getAnalytics();
        setCallsAnalytics(analytics);
      }
    }
  }, [activeCallsView, pagination, sorting, refreshing]);

  const handleSort = (field) => {
    setSorting(prev => ({
      order: prev.order_by === field && prev.order === 'desc' ? 'asc' : 'desc',
      order_by: field
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleDateChange = (type, value) => {
    // If both dates are provided at once, update them together
    if (type === 'both' && Array.isArray(value) && value.length === 2) {
      const [start, end] = value;
      if (start && end) {
        const newRange = {
          from: Math.floor(start.getTime() / 1000),
          to: Math.floor(end.setHours(23, 59, 59) / 1000)
        };
        // First fetch with new range, then update state
        fetchCalls(true, newRange).then(() => {
          setDateRange(newRange);
          setPagination(prev => ({ ...prev, page: 1 }));
        });
      }
      return;
    }
  };

  return (
    <CallsTab
      activeCallsView={activeCallsView}
      setActiveCallsView={setActiveCallsView}
      callsData={callsData}
      callsAnalytics={callsAnalytics}
      initialLoading={initialLoading}
      refreshing={refreshing}
      sorting={sorting}
      pagination={pagination}
      dateRange={dateRange}
      onRefresh={() => fetchCalls(true)}
      onSort={handleSort}
      onPageChange={handlePageChange}
      onDateChange={handleDateChange}
      analyticsProgress={analyticsProgress}
    />
  );
}
