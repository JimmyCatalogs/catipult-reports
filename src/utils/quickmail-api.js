const QUICKMAIL_API_URL = 'https://api.quickmail.com/v2/graphiql';

class QuickMailAPI {
  constructor(apiKey, campaignId) {
    if (!apiKey) {
      throw new Error('QuickMail API key is required');
    }
    if (!campaignId) {
      throw new Error('Campaign ID is required');
    }
    this.apiKey = apiKey;
    this.campaignId = campaignId;
  }

  async request(query) {
    const headers = {
      'Authorization': this.apiKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(QUICKMAIL_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
        }),
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response (status ${response.status}): ${text}`);
      }

      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${JSON.stringify(data)}`);
      }

      if (data.errors) {
        throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error('API request failed:', error.message);
      throw error;
    }
  }

  async getCampaignDetails() {
    const query = `
      {
        agency {
          id
          name
          appUrl
          campaign(id: "${this.campaignId}") {
            id
            name
            appUrl
            stats {
              clicks
              opens
              replies
              repliesPositive
              repliesNegative
            }
          }
        }
      }
    `;

    return this.request(query);
  }
}

// Export the class
module.exports = {
  QuickMailAPI
};
