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
  // Use date range from store
  const [dateRange, setDateRange] = useState(callsStore.getCurrentDateRange());
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20
  });
  const [sorting, setSorting] = useState({
    order: 'desc',
    order_by: 'started_at'
  });
  const [filters, setFilters] = useState({
    direction: '',
    user_id: '',
    raw_digits: '',
    recording: '',
    answered: ''
  });

  const fetchCalls = async (forceRefresh = false, customDateRange = null) => {
    const fetchDateRange = customDateRange || dateRange;

    // If not forcing refresh and we have valid cached data, use it
    if (!forceRefresh && !callsStore.needsFetch(fetchDateRange)) {
      const data = callsStore.getCalls({ sorting, pagination, filters });
      setCallsData(data);
      if (activeCallsView === 'analytics') {
        setCallsAnalytics(callsStore.getAnalytics());
      }
      setInitialLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      aircallClient.setAnalyticsProgressCallback(setAnalyticsProgress);

      // Fetch new data from API
      const data = await aircallClient.getCalls({
        from: fetchDateRange.from.toString(),
        to: fetchDateRange.to.toString(),
        ...pagination,
        ...sorting,
        ...filters
      });
      
      // Update store and state with new data
      callsStore.updateCalls(data.calls, fetchDateRange);
      setCallsData(data);
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

  // Effect to handle initial data fetch and view updates
  useEffect(() => {
    const updateFromStore = () => {
      const data = callsStore.getCalls({
        sorting,
        pagination,
        filters
      });
      setCallsData(data);

      if (activeCallsView === 'analytics') {
        const analytics = callsStore.getAnalytics();
        setCallsAnalytics(analytics);
      }
    };

    if (!initialFetchDone.current) {
      // Only fetch if we need new data
      if (callsStore.needsFetch(dateRange)) {
        initialFetchDone.current = true;
        fetchCalls();
      } else {
        initialFetchDone.current = true;
        setInitialLoading(false);
        updateFromStore();
      }
    } else if (!refreshing) {
      // Just update from store when switching views or changing pagination/sorting
      updateFromStore();
    }
  }, [activeCallsView, pagination, sorting, refreshing, dateRange]);

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
        // Update store's date range first
        callsStore.updateCalls([], newRange); // Update date range without changing data
        setDateRange(newRange);
        setPagination(prev => ({ ...prev, page: 1 }));
        // Then fetch with new range
        fetchCalls(true, newRange);
      }
      return;
    }
  };

  const handleFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset to first page when filtering
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
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
      filters={filters}
      pagination={pagination}
      dateRange={dateRange}
      onRefresh={() => fetchCalls(true)}
      onSort={handleSort}
      onFilter={handleFilter}
      onPageChange={handlePageChange}
      onDateChange={handleDateChange}
      analyticsProgress={analyticsProgress}
    />
  );
}
