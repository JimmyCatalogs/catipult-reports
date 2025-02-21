export class AircallAPI {
  constructor(apiId, apiToken) {
    this.apiId = apiId;
    this.apiToken = apiToken;
  }

  async getCalls(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.from) {
      queryParams.append('from', params.from);
    }
    if (params.to) {
      queryParams.append('to', params.to);
    }
    if (params.order) {
      queryParams.append('order', params.order);
    }
    
    const response = await fetch(`/api/aircall-proxy/calls?${queryParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch calls: ${response.statusText}`);
    }
    
    return response.json();
  }
}
