export class GoogleAnalyticsAPI {
  constructor() {}

  async getButtonClickEvents(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=buttonClicks&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching button click events:', error);
      throw error;
    }
  }

  async getEvents(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=events&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching events data:', error);
      throw error;
    }
  }

  async getSourceMedium(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=sourceMedium&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching source/medium data:', error);
      throw error;
    }
  }
  
  async getSource(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=source&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching source data:', error);
      throw error;
    }
  }
  
  async getMedium(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=medium&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching medium data:', error);
      throw error;
    }
  }

  async getPageViews(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=pageviews&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching page views:', error);
      throw error;
    }
  }

  async getUserMetrics(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=users&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      throw error;
    }
  }

  async getTopPages(startDate, endDate) {
    try {
      const response = await fetch(`/api/google-analytics?metric=toppages&startDate=${startDate}&endDate=${endDate}`);
      const data = await response.json();
      if (!response.ok) {
        throw data;
      }
      return data;
    } catch (error) {
      console.error('Error fetching top pages:', error);
      throw error;
    }
  }
}
