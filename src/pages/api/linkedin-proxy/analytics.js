import { LinkedInAPI } from '../../../utils/linkedin-api';

/**
 * API endpoint for fetching LinkedIn campaign analytics
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the campaign ID from the query parameters
    const { campaignId } = req.query;
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    // Create a new LinkedInAPI instance
    const client = new LinkedInAPI(
      process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
      process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_LINKEDIN_ACCOUNT_ID,
      process.env.NEXT_PUBLIC_LINKEDIN_API_TOKEN
    );
    
    // Get the date range from the query parameters or use default (30 days)
    const dayRange = req.query.dayRange ? parseInt(req.query.dayRange) : 30;
    
    // Get start and end dates if provided
    let startDate = null;
    let endDate = null;
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate);
    }
    
    // Get the analytics data for the campaign
    const analyticsData = await client.getCampaignAnalytics(campaignId, dayRange, startDate, endDate);
    
    // Return the analytics data
    return res.status(200).json(analyticsData);
  } catch (error) {
    console.error('Error fetching LinkedIn campaign analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch LinkedIn campaign analytics' });
  }
}
