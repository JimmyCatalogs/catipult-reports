export class GoogleAnalyticsAPI {
  constructor() {}

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
