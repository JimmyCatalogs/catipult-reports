import { useState, useEffect } from 'react';
import Head from 'next/head';
import { QuickMailAPI } from '../utils/quickmail-api';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaignDataSets, setCampaignDataSets] = useState({
    last7: null,
    last30: null,
    full: null
  });

  const fetchAllCampaignData = async () => {
    setLoading(true);
    try {
      const client = new QuickMailAPI(
        process.env.NEXT_PUBLIC_QUICKMAIL_API_KEY,
        process.env.NEXT_PUBLIC_QUICKMAIL_CAMPAIGN_ID
      );
      
      const [last7Data, last30Data, fullData] = await Promise.all([
        client.getCampaignDetails(7),
        client.getCampaignDetails(30),
        client.getCampaignDetails(null)
      ]);

      setCampaignDataSets({
        last7: last7Data,
        last30: last30Data,
        full: fullData
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign data. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllCampaignData();
  }, []);

  // Poll for updates every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAllCampaignData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const StatsSection = ({ data, title }) => {
    if (!data?.campaign) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {title} - {data.campaign.name}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.campaign.stats?.opens !== undefined && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Opens</h3>
              <p className="text-2xl font-bold text-blue-900">{data.campaign.stats.opens}</p>
            </div>
          )}
          
          {data.campaign.stats?.clicks !== undefined && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">Clicks</h3>
              <p className="text-2xl font-bold text-green-900">{data.campaign.stats.clicks}</p>
            </div>
          )}
          
          {data.campaign.stats?.replies !== undefined && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-2">Total Replies</h3>
              <p className="text-2xl font-bold text-purple-900">{data.campaign.stats.replies}</p>
            </div>
          )}
          
          {data.campaign.stats?.repliesPositive !== undefined && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">Positive Replies</h3>
              <p className="text-2xl font-bold text-green-900">{data.campaign.stats.repliesPositive}</p>
            </div>
          )}
          
          {data.campaign.stats?.repliesNegative !== undefined && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Negative Replies</h3>
              <p className="text-2xl font-bold text-red-900">{data.campaign.stats.repliesNegative}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Email Campaign Analytics</title>
        <meta name="description" content="View email campaign analytics" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {error && (
          <div className="max-w-6xl mx-auto px-8 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Email Campaign Analytics
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-[200px] bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <StatsSection 
                data={campaignDataSets.last7} 
                title="Last 7 Days"
              />
              <StatsSection 
                data={campaignDataSets.last30} 
                title="Last 30 Days"
              />
              <StatsSection 
                data={campaignDataSets.full} 
                title="Full Campaign"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
