import { callsStore } from './calls-store';

export class AircallAPI {
  // AircallAI endpoints
  static AI_ENDPOINTS = {
    TRANSCRIPTION: 'calls/:call_id/transcription',
    SENTIMENTS: 'calls/:call_id/sentiments',
    TOPICS: 'calls/:call_id/topics',
    SUMMARY: 'calls/:call_id/summary'
  };
  constructor(apiId) {
    this.apiId = apiId;
    this.analyticsProgress = {
      total: 0,
      loaded: 0,
      onProgress: null
    };
    this.currentFetch = null;
  }

  setAnalyticsProgressCallback(callback) {
    this.analyticsProgress.onProgress = callback;
  }

  async getCalls(params = {}, useCache = true) {
    // If a fetch is already in progress, wait for it
    if (this.currentFetch) {
      await this.currentFetch;
      return callsStore.getCalls({
        filters: {
          direction: params.direction,
          status: params.status,
          user_id: params.user_id,
          raw_digits: params.raw_digits,
          recording: params.recording,
          answered: params.answered
        },
        sorting: {
          order: params.order,
          order_by: params.order_by
        },
        pagination: {
          page: params.page || 1,
          per_page: params.per_page || 20
        }
      });
    }

    // If using cache and we don't need a fresh fetch, return processed data from store
    if (useCache && !callsStore.needsFetch({ from: params.from, to: params.to })) {
      return callsStore.getCalls({
        filters: {
          direction: params.direction,
          status: params.status,
          user_id: params.user_id,
          raw_digits: params.raw_digits,
          recording: params.recording,
          answered: params.answered
        },
        sorting: {
          order: params.order,
          order_by: params.order_by
        },
        pagination: {
          page: params.page || 1,
          per_page: params.per_page || 20
        }
      });
    }

    // If we need fresh data, fetch all pages
    const allCalls = [];

    try {
      // Set current fetch promise
      this.currentFetch = this.fetchAllPages(params, allCalls);
      await this.currentFetch;

      // Update store with all fetched calls
      callsStore.updateCalls(allCalls, {
        from: params.from,
        to: params.to
      });

      return callsStore.getCalls({
        filters: {
          direction: params.direction,
          status: params.status,
          user_id: params.user_id,
          raw_digits: params.raw_digits,
          recording: params.recording,
          answered: params.answered
        },
        sorting: {
          order: params.order,
          order_by: params.order_by
        },
        pagination: {
          page: params.page || 1,
          per_page: params.per_page || 20
        }
      });
    } finally {
      this.currentFetch = null;
    }
  }

  async fetchAllPages(params, allCalls) {
    console.log('Starting to fetch Aircall data...');
    
    // Get initial page to determine total pages
    const initialData = await this.fetchCallsPage({
      ...params,
      per_page: 50,
      page: 1
    });

    allCalls.push(...initialData.calls);

    // Set total for progress tracking
    this.analyticsProgress.total = initialData.meta.total;
    this.analyticsProgress.loaded = Math.min(50, initialData.meta.total);
    console.log(`Fetched page 1/${Math.ceil(initialData.meta.total / 50)} (${this.analyticsProgress.loaded}/${initialData.meta.total} calls)`);
    
    if (this.analyticsProgress.onProgress) {
      this.analyticsProgress.onProgress(this.analyticsProgress.loaded / this.analyticsProgress.total);
    }

    // Fetch remaining pages sequentially
    const totalPages = Math.ceil(initialData.meta.total / 50);
    let currentPage = 2;
    
    while (currentPage <= totalPages) {
      try {
        const pageData = await this.fetchCallsPage({
          ...params,
          per_page: 50,
          page: currentPage
        });
        
        // Always proceed if we got a valid response
        if (pageData?.calls) {
          if (pageData.calls.length > 0) {
            allCalls.push(...pageData.calls);
          }
          
          // Update progress
          this.analyticsProgress.loaded = Math.min(currentPage * 50, initialData.meta.total);
          console.log(`Fetched page ${currentPage}/${totalPages} (${this.analyticsProgress.loaded}/${initialData.meta.total} calls)`);
          
          if (this.analyticsProgress.onProgress) {
            this.analyticsProgress.onProgress(this.analyticsProgress.loaded / this.analyticsProgress.total);
          }
          
          // Add small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Move to next page even if current page was empty
          currentPage++;
        } else {
          throw new Error(`Invalid response for page ${currentPage}`);
        }
      } catch (error) {
        console.error(`Failed to fetch page ${currentPage}, retrying...`, error);
        // Don't increment page counter, will retry the same page
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit longer before retry
      }
    }

    console.log('Finished fetching Aircall data');
  }

  async getCallAnalytics(params = {}, useCache = true, onProgress) {
    // Set progress callback
    this.analyticsProgress.onProgress = onProgress;

    // Return analytics calculated from store if we have the data
    if (!callsStore.needsFetch({ from: params.from, to: params.to })) {
      return callsStore.getAnalytics();
    }

    // If we need to fetch, use getCalls which will update the store
    await this.getCalls(params, false);
    return callsStore.getAnalytics();
  }

  // AircallAI methods
  async getCallTranscription(callId) {
    return this.fetchAIData(AircallAPI.AI_ENDPOINTS.TRANSCRIPTION.replace(':call_id', callId));
  }

  async getCallSentiments(callId) {
    return this.fetchAIData(AircallAPI.AI_ENDPOINTS.SENTIMENTS.replace(':call_id', callId));
  }

  async getCallTopics(callId) {
    return this.fetchAIData(AircallAPI.AI_ENDPOINTS.TOPICS.replace(':call_id', callId));
  }

  async getCallSummary(callId) {
    return this.fetchAIData(AircallAPI.AI_ENDPOINTS.SUMMARY.replace(':call_id', callId));
  }

  // Helper method to fetch AircallAI data
  async fetchAIData(path, retryCount = 0) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 2000; // 2 seconds

    try {
      const url = `/api/aircall-proxy?path=${path}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      // Handle 404 errors (no transcript available)
      if (response.status === 404) {
        throw new Error('Resource not found (404)');
      }
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Handle rate limiting with retries
      if (response.status === 429 || (response.status === 403 && data.message?.toLowerCase().includes('rate limit'))) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Rate limited. Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchAIData(path, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded after maximum retries');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch AI data: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('Rate limit') || error.message.includes('rate limit')) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount);
          console.log(`Error: ${error.message}. Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchAIData(path, retryCount + 1);
        }
      }
      throw error;
    }
  }

  // Helper method to fetch a single page of calls
  async fetchCallsPage(params = {}, retryCount = 0) {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 2000; // 2 seconds

    try {
      const queryParams = new URLSearchParams();
      
      // Add all params to query string
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const url = `/api/aircall-proxy?path=calls&${queryParams.toString()}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // Handle rate limiting with retries
      if (response.status === 429 || (response.status === 403 && data.message?.toLowerCase().includes('rate limit'))) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Rate limited. Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchCallsPage(params, retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded after maximum retries');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch calls: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (error.message.includes('Rate limit') || error.message.includes('rate limit')) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount);
          console.log(`Error: ${error.message}. Retrying in ${delay/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchCallsPage(params, retryCount + 1);
        }
      }
      throw error;
    }
  }
}
