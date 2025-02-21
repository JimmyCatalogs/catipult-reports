const { QuickMailAPI } = require('./quickmail-api');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Simple test to verify API connectivity
async function testQuickmailAPI() {
  try {
    const apiKey = process.env.QUICKMAIL_API_KEY;
    const campaignId = process.env.QUICKMAIL_CAMPAIGN_ID;

    if (!apiKey || !campaignId) {
      throw new Error('Missing required environment variables (QUICKMAIL_API_KEY, QUICKMAIL_CAMPAIGN_ID)');
    }

    const api = new QuickMailAPI(apiKey, campaignId);
    console.log('Testing QuickMail API connection...');
    
    const data = await api.getCampaignDetails();
    console.log('✓ Successfully connected to QuickMail API');
    console.log('✓ Retrieved campaign details for:', data.agency.campaign.name);
    console.log('✓ Campaign stats:', {
      opens: data.agency.campaign.stats.opens,
      clicks: data.agency.campaign.stats.clicks,
      replies: data.agency.campaign.stats.replies,
      positiveReplies: data.agency.campaign.stats.repliesPositive,
      negativeReplies: data.agency.campaign.stats.repliesNegative
    });
    
    return true;
  } catch (error) {
    console.error('Error connecting to QuickMail API:', error.message);
    return false;
  }
}

// Run the test
testQuickmailAPI();
