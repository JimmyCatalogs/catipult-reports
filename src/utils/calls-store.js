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
        dateRange: this.getDefaultDateRange()
      },
      // Store for AircallAI data
      aiData: {
        transcription: {},
        sentiments: {},
        topics: {},
        summary: {}
      }
    };
  }

  getDefaultDateRange() {
    const now = new Date();
    now.setHours(23, 59, 59);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // -6 to include current day
    sevenDaysAgo.setHours(0, 0, 0);
    return {
      from: Math.floor(sevenDaysAgo.getTime() / 1000),
      to: Math.floor(now.getTime() / 1000)
    };
  }

  getCurrentDateRange() {
    return this.data.meta.dateRange;
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

  // Get sorted, filtered, and paginated calls
  getCalls({ sorting, pagination, filters = {} }) {
    // Get all calls and filter by date range
    let allCalls = this.data.calls.allIds.map(id => this.data.calls.byId[id]);
    const { from, to } = this.data.meta.dateRange;
    
    // Filter by date range
    allCalls = allCalls.filter(call => {
      const callTime = call.started_at;
      return callTime >= from && callTime <= to;
    });

    // Apply filters
    if (filters) {
      allCalls = this.filterCalls(allCalls, filters);
    }

    let sortedCalls = this.sortCalls(allCalls, sorting);
    return this.paginateCalls(sortedCalls, pagination);
  }

  // Filter calls based on provided filters
  filterCalls(calls, filters) {
    return calls.filter(call => {
      // Check each filter
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue; // Skip empty filters
        
        // Handle special cases
        if (key === 'user_id' && value) {
          // For user filtering, check if user exists and matches id
          if (!call.user || call.user.id !== value) {
            return false;
          }
          continue;
        }
        
        if (key === 'recording' && value) {
          // For recording, check if it exists
          const hasRecording = !!call.recording;
          if (value === 'yes' && !hasRecording) return false;
          if (value === 'no' && hasRecording) return false;
          continue;
        }
        
        if (key === 'answered' && value === 'yes') {
          // For answered calls, check if answered_at exists and is not null
          if (!call.answered_at) return false;
          continue;
        }
        
        // For other fields, do a case-insensitive string comparison
        const callValue = call[key]?.toString().toLowerCase();
        if (!callValue || !callValue.includes(value.toLowerCase())) {
          return false;
        }
      }
      
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
      .map(([timestamp, stat]) => {
        // Create a proper Date object from the timestamp
        const date = new Date(parseInt(timestamp) * 1000);
        return {
          ...stat,
          date: viewType === 'weekly'
            ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      });
  }

  // Check if we need to fetch new data based on date range
  needsFetch(dateRange) {
    if (!this.data.meta.lastFetched) return true;
    
    const currentRange = this.data.meta.dateRange;
    if (!currentRange) return true;

    return currentRange.from !== dateRange.from || 
           currentRange.to !== dateRange.to;
  }

  // AircallAI methods
  
  // Store transcription data for a call
  updateCallTranscription(callId, data) {
    this.data.aiData.transcription[callId] = data;
  }
  
  // Store sentiments data for a call
  updateCallSentiments(callId, data) {
    this.data.aiData.sentiments[callId] = data;
  }
  
  // Store topics data for a call
  updateCallTopics(callId, data) {
    this.data.aiData.topics[callId] = data;
  }
  
  // Store summary data for a call
  updateCallSummary(callId, data) {
    this.data.aiData.summary[callId] = data;
  }
  
  // Get transcription data for a call
  getCallTranscription(callId) {
    return this.data.aiData.transcription[callId];
  }
  
  // Get sentiments data for a call
  getCallSentiments(callId) {
    return this.data.aiData.sentiments[callId];
  }
  
  // Get topics data for a call
  getCallTopics(callId) {
    return this.data.aiData.topics[callId];
  }
  
  // Get summary data for a call
  getCallSummary(callId) {
    return this.data.aiData.summary[callId];
  }
  
  // Check if we have AI data for a call
  hasAIData(callId) {
    return {
      transcription: !!this.data.aiData.transcription[callId],
      sentiments: !!this.data.aiData.sentiments[callId],
      topics: !!this.data.aiData.topics[callId],
      summary: !!this.data.aiData.summary[callId]
    };
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
      },
      aiData: {
        transcription: {},
        sentiments: {},
        topics: {},
        summary: {}
      }
    };
  }
}

export const callsStore = new CallsStore();
