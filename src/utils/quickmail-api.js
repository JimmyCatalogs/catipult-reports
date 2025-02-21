const QUICKMAIL_API_URL = '/api/quickmail-proxy';

/**
 * Formats campaign details into a standardized response object
 * @param {Object} data - Raw campaign data from the API
 * @returns {Object} Formatted campaign details
 */
const formatCampaignDetails = (data) => ({
  campaign: {
    id: data.agency.campaign.id,
    name: data.agency.campaign.name,
    appUrl: data.agency.campaign.appUrl,
    stats: data.agency.campaign.stats
  },
  agency: {
    id: data.agency.id,
    name: data.agency.name,
    appUrl: data.agency.appUrl
  }
});

export class QuickMailAPI {
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

  async getCampaignDetails(dayRange = 7) {
    const statsFilter = dayRange ? `(dayRange: ${dayRange})` : '';
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
            stats${statsFilter} {
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

    const data = await this.request(query);
    return formatCampaignDetails(data);
  }
}
