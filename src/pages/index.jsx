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
      const client = new AircallAPI('9ec53b199aeda57d9daf6279a4c88a7f');
      
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

  useEffect(() => {
    if (activeTab === 'emails') {
      fetchAllCampaignData();
    } else if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (activeTab === 'emails') {
      interval = setInterval(fetchAllCampaignData, 5 * 60 * 1000);
    } else if (activeTab === 'calls') {
      interval = setInterval(fetchCalls, 5 * 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'calls') {
      fetchCalls();
    }
  }, [dateRange]);

  const StatsSection = ({ data, title }) => {
    if (!data?.campaign) return null;
    
    return (
      <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
            {title} - {data.campaign.name}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {data.campaign.stats?.opens !== undefined && (
            <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Opens</h3>
              <p className="text-2xl font-bold">{data.campaign.stats.opens}</p>
            </div>
          )}
          
          {data.campaign.stats?.clicks !== undefined && (
            <div style={{ background: 'var(--success-background)', color: 'var(--success)' }} className="p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Clicks</h3>
              <p className="text-2xl font-bold">{data.campaign.stats.clicks}</p>
            </div>
          )}
          
          {data.campaign.stats?.replies !== undefined && (
            <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Total Replies</h3>
              <p className="text-2xl font-bold">{data.campaign.stats.replies}</p>
            </div>
          )}
          
          {data.campaign.stats?.repliesPositive !== undefined && (
            <div style={{ background: 'var(--success-background)', color: 'var(--success)' }} className="p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Positive Replies</h3>
              <p className="text-2xl font-bold">{data.campaign.stats.repliesPositive}</p>
            </div>
          )}
          
          {data.campaign.stats?.repliesNegative !== undefined && (
            <div style={{ background: 'var(--error-background)', color: 'var(--error)' }} className="p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Negative Replies</h3>
              <p className="text-2xl font-bold">{data.campaign.stats.repliesNegative}</p>
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

      <div style={{ background: 'var(--muted-background)' }} className="min-h-screen">
        <div className="max-w-6xl mx-auto px-8 pt-8">
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('emails')}
                className="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
                style={{
                  borderColor: activeTab === 'emails' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'emails' ? 'var(--primary)' : 'var(--muted)'
                }}
              >
                Emails
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
                style={{
                  borderColor: activeTab === 'calls' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'calls' ? 'var(--primary)' : 'var(--muted)'
                }}
              >
                Calls
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="max-w-6xl mx-auto px-8 pt-4">
            <div style={{ background: 'var(--error-background)', color: 'var(--error)', borderColor: 'var(--error)' }} className="border px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto px-8 pt-4">
          {activeTab === 'emails' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                    Email Campaign Analytics
                  </h1>
                </div>
              </div>

              <div style={{ background: 'var(--warning-background)', borderColor: 'var(--warning)', color: 'var(--warning)' }} className="border rounded-lg p-4 mb-8">
                <p>
                  Note: This data comes from the QuickMail API which is limited and may show inconsistencies with the analytics directly on their dashboard. We are in discussions with QuickMail to improve functionality and data consistency. For the most accurate data, please refer to{' '}
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1BSbAV3MmjsHK2lIQ-1nsS3V3c74rNDqzlEpyEAhT_PM/edit?gid=113981412#gid=113981412"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary)' }}
                    className="underline hover:opacity-80"
                  >
                    this spreadsheet
                  </a>.
                </p>
              </div>

              {loading ? (
                <div className="space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
                      <div className="animate-pulse space-y-4">
                        <div style={{ background: 'var(--muted-background)' }} className="h-8 rounded w-1/4"></div>
                        <div style={{ background: 'var(--muted-background)' }} className="h-[200px] rounded w-full"></div>
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
                  <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                    Call Analytics
                  </h1>
                </div>
                <div className="flex gap-4">
                  <div>
                    <label htmlFor="from-date" className="block text-sm font-medium" style={{ color: 'var(--muted)' }}>From</label>
                    <input
                      type="date"
                      id="from-date"
                      style={{
                        background: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                      className="mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      value={new Date(dateRange.from * 1000).toISOString().split('T')[0]}
                      onChange={(e) => setDateRange(prev => ({
                        ...prev,
                        from: Math.floor(new Date(e.target.value).getTime() / 1000)
                      }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="to-date" className="block text-sm font-medium" style={{ color: 'var(--muted)' }}>To</label>
                    <input
                      type="date"
                      id="to-date"
                      style={{
                        background: 'var(--background)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                      className="mt-1 block w-full rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
                  <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
                    <div className="animate-pulse space-y-4">
                      <div style={{ background: 'var(--muted-background)' }} className="h-8 rounded w-1/4"></div>
                      <div style={{ background: 'var(--muted-background)' }} className="h-[400px] rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
                      <thead style={{ background: 'var(--muted-background)' }}>
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                            Date/Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                            Direction
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                            Duration
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                            Phone
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                            User
                          </th>
                        </tr>
                      </thead>
                      <tbody style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="divide-y">
                        {callsData?.calls.map((call) => (
                          <tr key={call.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                              {formatUnixTimestamp(call.started_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span style={{
                                background: call.direction === 'inbound' ? 'var(--success-background)' : 'var(--primary-background)',
                                color: call.direction === 'inbound' ? 'var(--success)' : 'var(--primary)'
                              }} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                {call.direction}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span style={{
                                background: call.status === 'done' ? 'var(--success-background)' : 'var(--warning-background)',
                                color: call.status === 'done' ? 'var(--success)' : 'var(--warning)'
                              }} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                {call.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                              {call.duration}s
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                              {call.raw_digits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                              {call.user?.name || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {callsData?.meta && (
                    <div style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="px-4 py-3 border-t sm:px-6">
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>
                        Showing <span className="font-medium" style={{ color: 'var(--foreground)' }}>{callsData.calls.length}</span> of{' '}
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>{callsData.meta.total}</span> calls
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
