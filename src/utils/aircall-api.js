export class AircallAPI {
  constructor(apiId) {
    this.apiId = apiId;
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
    
    const url = `/api/aircall-proxy?path=calls&${queryParams.toString()}`;
    // console.log('Making Aircall API request:', {
    //   url,
    //   params,
    //   queryString: queryParams.toString()
    // });

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
    });
    
    const responseText = await response.text();
    // console.log('Aircall API client response:', {
    //   status: response.status,
    //   statusText: response.statusText,
    //   body: responseText
    // });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch calls: ${response.statusText}`);
    }

    console.log('Aircall API client success:', {
      meta: data.meta,
      callCount: data.calls?.length
    });
    return data;
  }
}
