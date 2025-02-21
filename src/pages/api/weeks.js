import { QuickMailAPI } from '../../utils/quickmail-api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.QUICKMAIL_API_KEY;
    const campaignId = process.env.QUICKMAIL_CAMPAIGN_ID;

    if (!apiKey || !campaignId) {
      throw new Error('Missing required environment variables');
    }

    const quickMailAPI = new QuickMailAPI(apiKey, campaignId);
    const data = await quickMailAPI.getCampaignDetails();

    // Return campaign details
    res.status(200).json({
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
  } catch (error) {
    console.error('Error processing weeks:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error processing weeks'
    });
  }
}
