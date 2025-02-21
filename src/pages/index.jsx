import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaignData = async () => {
    try {
      const response = await fetch('/api/weeks');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch campaign data');
      }
      setCampaignData(data);
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
    fetchCampaignData();
  }, []);

  // Poll for updates every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchCampaignData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
            <h1 className="text-3xl font-bold text-gray-900">
              Email Campaign Analytics
            </h1>
            {campaignData?.agency && (
              <a 
                href={campaignData.agency.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View in {campaignData.agency.name}
              </a>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-[400px] bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ) : campaignData?.campaign && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {campaignData.campaign.name}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Opens</h3>
                  <p className="text-2xl font-bold text-blue-900">{campaignData.campaign.stats.opens}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Clicks</h3>
                  <p className="text-2xl font-bold text-green-900">{campaignData.campaign.stats.clicks}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800 mb-2">Total Replies</h3>
                  <p className="text-2xl font-bold text-purple-900">{campaignData.campaign.stats.replies}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Positive Replies</h3>
                  <p className="text-2xl font-bold text-green-900">{campaignData.campaign.stats.repliesPositive}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Negative Replies</h3>
                  <p className="text-2xl font-bold text-red-900">{campaignData.campaign.stats.repliesNegative}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
