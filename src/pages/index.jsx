import { useState, useEffect } from 'react';
import Head from 'next/head';
import { QuickMailAPI } from '../utils/quickmail-api';
import { AircallAPI } from '../utils/aircall-api';
import { formatUnixTimestamp } from '../utils/dates';

export default function Home() {
  const [activeTab, setActiveTab] = useState('emails');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callsData, setCallsData] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000), // 7 days ago
    to: Math.floor(Date.now() / 1000) // now
  });
  const [campaignDataSets, setCampaignDataSets] = useState({
    last7: null,
    last30: null,
    full: null
  });

  const fetchCalls = async () => {
    try {
      const client = new AircallAPI(
        process.env.NEXT_PUBLIC_AIRCALL_API_ID,
        process.env.NEXT_PUBLIC_AIRCALL_API_TOKEN
      );
      
      const data = await client.getCalls({
        from: dateRange.from.toString(),
        to: dateRange.to.toString(),
        order: 'desc'
      });
      
      setCallsData(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calls data. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching calls data:', err);
    } finally {
      setLoading(false);
    }
  };

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
    if (activeTab === 'emails') {
      fetchAllCampaignData();
    } else if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [activeTab]);

  // Poll for updates every 5 minutes
  useEffect(() => {
    let interval;
    if (activeTab === 'emails') {
      interval = setInterval(fetchAllCampaignData, 5 * 60 * 1000);
    } else if (activeTab === 'calls') {
      interval = setInterval(fetchCalls, 5 * 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Fetch calls when date range changes
  useEffect(() => {
    if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [dateRange]);

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
        <div className="max-w-6xl mx-auto px-8 pt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('emails')}
                className={`${
                  activeTab === 'emails'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                Emails
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`${
                  activeTab === 'calls'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
              >
                Calls
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="max-w-6xl mx-auto px-8 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto px-8 pt-4">
          {activeTab === 'emails' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Email Campaign Analytics
                  </h1>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-yellow-800">
                  Note: This data comes from the QuickMail API which is limited and may show inconsistencies with the analytics directly on their dashboard. We are in discussions with QuickMail to improve functionality and data consistency. For the most accurate data, please refer to{' '}
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1BSbAV3MmjsHK2lIQ-1nsS3V3c74rNDqzlEpyEAhT_PM/edit?gid=113981412#gid=113981412"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    this spreadsheet
                  </a>.
                </p>
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
            </>
          )}

          {activeTab === 'calls' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Call Analytics
                  </h1>
                </div>
                <div className="flex gap-4">
                  <div>
                    <label htmlFor="from-date" className="block text-sm font-medium text-gray-700">From</label>
                    <input
                      type="date"
                      id="from-date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={new Date(dateRange.from * 1000).toISOString().split('T')[0]}
                      onChange={(e) => setDateRange(prev => ({
                        ...prev,
                        from: Math.floor(new Date(e.target.value).getTime() / 1000)
                      }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="to-date" className="block text-sm font-medium text-gray-700">To</label>
                    <input
                      type="date"
                      id="to-date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={new Date(dateRange.to * 1000).toISOString().split('T')[0]}
                      onChange={(e) => setDateRange(prev => ({
                        ...prev,
                        to: Math.floor(new Date(e.target.value).getTime() / 1000)
                      }))}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-[400px] bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date/Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Direction
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {callsData?.calls.map((call) => (
                          <tr key={call.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatUnixTimestamp(call.started_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                call.direction === 'inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {call.direction}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                call.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {call.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {call.duration}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {call.raw_digits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {call.user?.name || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {callsData?.meta && (
                    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{callsData.calls.length}</span> of{' '}
                        <span className="font-medium">{callsData.meta.total}</span> calls
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
