import { QuickMailAPI } from '../quickmail-api';

describe('QuickMailAPI', () => {
  const mockApiKey = 'test-api-key';
  const mockCampaignId = 'test-campaign-id';
  let api;

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
    api = new QuickMailAPI(mockApiKey, mockCampaignId);
  });

  test('constructor throws error if required params not provided', () => {
    expect(() => new QuickMailAPI()).toThrow('QuickMail API key is required');
    expect(() => new QuickMailAPI('')).toThrow('QuickMail API key is required');
    expect(() => new QuickMailAPI('api-key')).toThrow('Campaign ID is required');
    expect(() => new QuickMailAPI('api-key', '')).toThrow('Campaign ID is required');
  });

  test('getCampaignDetails makes correct GraphQL query', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        data: {
          agency: {
            id: 'agency-1',
            name: 'Test Agency',
            appUrl: 'https://app.quickmail.com',
            campaign: {
              id: mockCampaignId,
              name: 'Test Campaign',
              appUrl: 'https://app.quickmail.com/campaign/123',
              stats: {
                clicks: 100,
                opens: 200,
                replies: 50,
                repliesPositive: 30,
                repliesNegative: 20
              }
            }
          }
        }
      }))
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await api.getCampaignDetails();

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.quickmail.com/v2/graphiql',
      {
        method: 'POST',
        headers: {
          'Authorization': mockApiKey,
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining(`campaign(id: "${mockCampaignId}")`)
      }
    );
    
    expect(result.agency.campaign).toHaveProperty('id', mockCampaignId);
    expect(result.agency.campaign.stats).toHaveProperty('clicks', 100);
    expect(result.agency.campaign.stats).toHaveProperty('opens', 200);
  });

  test('handles GraphQL error responses', async () => {
    const mockErrorResponse = {
      ok: true,
      text: () => Promise.resolve(JSON.stringify({
        errors: [{
          message: 'Invalid campaign ID'
        }]
      }))
    };
    global.fetch.mockResolvedValue(mockErrorResponse);

    await expect(api.getCampaignDetails()).rejects.toThrow('GraphQL error');
  });

  test('handles network errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    await expect(api.getCampaignDetails()).rejects.toThrow('Network error');
  });

  test('handles invalid JSON responses', async () => {
    const mockInvalidResponse = {
      ok: true,
      text: () => Promise.resolve('Invalid JSON')
    };
    global.fetch.mockResolvedValue(mockInvalidResponse);

    await expect(api.getCampaignDetails()).rejects.toThrow('Invalid JSON response');
  });
});
