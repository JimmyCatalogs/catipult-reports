import { formatAnalyticsDate } from './dates';

// Normalized store for calls data with client-side processing
export class CallsStore {
  constructor() {
    this.data = {
      calls: {
        byId: {},
        allIds: []
      },
      meta: {
        lastFetched: null,
        dateRange: { from: null, to: null }
      }
    };
  }

  // Update store with new calls data
  updateCalls(calls, dateRange) {
    // Add/update calls in byId
    for (const call of calls) {
      this.data.calls.byId[call.id] = call;
    }

    // Update allIds to maintain uniqueness
    const uniqueIds = new Set([...this.data.calls.allIds, ...calls.map(c => c.id)]);
    this.data.calls.allIds = Array.from(uniqueIds);

    // Update meta
    this.data.meta.lastFetched = Date.now();
    this.data.meta.dateRange = dateRange;
  }

  // Get filtered, sorted, and paginated calls
  getCalls({ filters, sorting, pagination }) {
    let filteredCalls = this.filterCalls(filters);
    let sortedCalls = this.sortCalls(filteredCalls, sorting);
    return this.paginateCalls(sortedCalls, pagination);
  }

  // Filter calls based on current filters
  filterCalls(filters) {
    return this.data.calls.allIds
      .map(id => this.data.calls.byId[id])
      .filter(call => {
        if (filters.direction && call.direction !== filters.direction) return false;
        if (filters.status && call.status !== filters.status) return false;
        if (filters.user_id && call.user?.id !== filters.user_id) return false;
        return true;
      });
  }

  // Sort calls based on current sorting
  sortCalls(calls, { order_by = 'started_at', order = 'desc' } = {}) {
    return [...calls].sort((a, b) => {
      let aVal = a[order_by];
      let bVal = b[order_by];
      
      // Handle nested properties
      if (typeof order_by === 'string' && order_by.includes('.')) {
        aVal = order_by.split('.').reduce((obj, key) => obj?.[key], a);
        bVal = order_by.split('.').reduce((obj, key) => obj?.[key], b);
      }

      if (aVal === bVal) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return order === 'desc' ? -comparison : comparison;
    });
  }

  // Paginate calls based on current pagination
  paginateCalls(calls, { page, per_page }) {
    const start = (page - 1) * per_page;
    const end = start + per_page;
    return {
      calls: calls.slice(start, end),
      meta: {
        total: calls.length,
        per_page,
        current_page: page,
        total_pages: Math.ceil(calls.length / per_page)
      }
    };
  }

  // Calculate analytics from cached data
  getAnalytics(userId = null, viewType = 'daily') {
    let allCalls = this.data.calls.allIds.map(id => this.data.calls.byId[id]);
    
    // Filter by date range
    const { from, to } = this.data.meta.dateRange;
    allCalls = allCalls.filter(call => {
      const callTime = call.started_at;
      return callTime >= from && callTime <= to;
    });
    
    // Filter by user if specified
    if (userId) {
      allCalls = allCalls.filter(call => call.user?.id === userId);
    }

    const analytics = {
      totalCalls: allCalls.length,
      byDirection: {
        inbound: 0,
        outbound: 0
      },
      byStatus: {
        done: 0,
        missed: 0,
        voicemail: 0
      },
      totalDuration: 0,
      averageDuration: 0,
      userStats: []
    };

    const userStats = {};

    for (const call of allCalls) {
      // Aggregate by direction
      analytics.byDirection[call.direction]++;

      // Aggregate by status
      analytics.byStatus[call.status]++;

      // Total duration
      analytics.totalDuration += call.duration || 0;

      // Aggregate by user
      if (call.user?.name) {
        if (!userStats[call.user.name]) {
          userStats[call.user.name] = {
            totalCalls: 0,
            totalDuration: 0,
            inbound: 0,
            outbound: 0,
            done: 0,
            missed: 0,
            voicemail: 0
          };
        }
        const stats = userStats[call.user.name];
        stats.totalCalls++;
        stats.totalDuration += call.duration || 0;
        stats[call.direction]++;
        stats[call.status]++;
      }
    }

    // Calculate averages and format user stats
    if (analytics.totalCalls > 0) {
      analytics.averageDuration = Math.round(analytics.totalDuration / analytics.totalCalls);
    }

    analytics.userStats = Object.entries(userStats).map(([name, stats]) => ({
      name,
      ...stats,
      averageDuration: stats.totalCalls > 0 ? Math.round(stats.totalDuration / stats.totalCalls) : 0
    }));

    // Add time-based analytics
    analytics.timeBasedStats = this.getTimeBasedStats(allCalls, viewType);

    return analytics;
  }

  getTimeBasedStats(calls, viewType) {
    const stats = {};
    
    // Get date range from meta (timestamps are already in seconds)
    let fromDate = new Date(this.data.meta.dateRange.from * 1000);
    let toDate = new Date(this.data.meta.dateRange.to * 1000);
    
    // For weekly view, extend range to full weeks
    if (viewType === 'weekly') {
      // Adjust fromDate to previous Monday
      const fromDay = fromDate.getDay();
      fromDate.setDate(fromDate.getDate() - (fromDay === 0 ? 6 : fromDay - 1));
      
      // Adjust toDate to next Sunday
      const toDay = toDate.getDay();
      if (toDay !== 0) { // If not already Sunday
        toDate.setDate(toDate.getDate() + (7 - toDay));
      }
    }
    
    // Initialize all dates in range with zero counts
    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      let key;
      
      // Set time to start of day for consistent grouping
      const dateWithoutTime = new Date(currentDate);
      dateWithoutTime.setHours(0, 0, 0, 0);
      const timestamp = Math.floor(dateWithoutTime.getTime() / 1000);
      
      if (viewType === 'weekly') {
        // Use Monday as key for the whole week
        const monday = new Date(currentDate);
        if (currentDate.getDay() !== 1) { // If not Monday
          const diff = currentDate.getDay() === 0 ? -6 : 1 - currentDate.getDay();
          monday.setDate(currentDate.getDate() + diff);
        }
        key = Math.floor(monday.getTime() / 1000);
      } else {
        key = timestamp;
      }

      if (!stats[key]) {
        stats[key] = {
          total: 0,
          inbound: 0,
          outbound: 0,
          done: 0,
          missed: 0,
          voicemail: 0,
          date: key // Store the key date for reference
        };
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add call counts to the initialized dates
    calls.forEach(call => {
      // Convert Unix timestamp (seconds) to milliseconds for Date object
      const date = new Date(call.started_at * 1000);
      
      // Skip if outside extended date range
      if (date < fromDate || date > toDate) return;
      
      let key;
      // Set time to start of day for consistent grouping
      const dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
      const timestamp = Math.floor(dateWithoutTime.getTime() / 1000);
      
      if (viewType === 'weekly') {
        const monday = new Date(date);
        const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
        monday.setDate(date.getDate() + diff);
        key = Math.floor(monday.getTime() / 1000);
      } else {
        key = timestamp;
      }

      if (stats[key]) {
        stats[key].total++;
        stats[key][call.direction]++;
        stats[key][call.status]++;
      }
    });

    // Convert to array, sort by date, and format dates using our utility
    return Object.entries(stats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([timestamp, stat]) => ({
        ...stat,
        date: viewType === 'weekly'
          ? `Week of ${formatAnalyticsDate(parseInt(timestamp))}`
          : formatAnalyticsDate(parseInt(timestamp))
      }));
  }

  // Check if we need to fetch new data based on date range
  needsFetch(dateRange) {
    if (!this.data.meta.lastFetched) return true;
    
    const currentRange = this.data.meta.dateRange;
    if (!currentRange) return true;

    return currentRange.from !== dateRange.from || 
           currentRange.to !== dateRange.to;
  }

  // Clear all data
  clear() {
    this.data = {
      calls: {
        byId: {},
        allIds: []
      },
      meta: {
        lastFetched: null,
        dateRange: { from: null, to: null }
      }
    };
  }
}

export const callsStore = new CallsStore();
