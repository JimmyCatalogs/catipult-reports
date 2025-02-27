import { useState, useEffect } from 'react';
import Head from 'next/head';
import { QuickMailAPI } from '../utils/quickmail-api';
import { LoadingBar } from '../components/LoadingBar';
import { EmailsContainer } from '../components/emails/EmailsContainer';
import { CallsContainer } from '../components/calls/CallsContainer';
import { AnalyticsTab } from '../components/analytics/AnalyticsTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  return (
    <>
      <Head>
        <title>Email Campaign Analytics</title>
        <meta name="description" content="View email campaign analytics" />
      </Head>

      <div style={{ background: 'var(--muted-background)' }} className="min-h-screen relative">
        {refreshing && !initialLoading && activeTab === 'emails' && (
          <div className="absolute top-0 left-0 w-full">
            <LoadingBar progress={1} />
          </div>
        )}
        <div className="max-w-6xl mx-auto px-8 pt-8">
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('calls')}
                className="whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium rounded-t-lg transition-all"
                style={{
                  borderColor: activeTab === 'calls' ? 'var(--tertiary)' : 'transparent',
                  color: activeTab === 'calls' ? 'var(--tertiary)' : 'var(--muted)',
                  background: activeTab === 'calls' ? 'var(--tertiary-background)' : 'transparent'
                }}
              >
                Calls
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className="whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium rounded-t-lg transition-all"
                style={{
                  borderColor: activeTab === 'emails' ? 'var(--tertiary)' : 'transparent',
                  color: activeTab === 'emails' ? 'var(--tertiary)' : 'var(--muted)',
                  background: activeTab === 'emails' ? 'var(--tertiary-background)' : 'transparent'
                }}
              >
                Emails
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="whitespace-nowrap border-b-2 py-4 px-4 text-sm font-medium rounded-t-lg transition-all"
                style={{
                  borderColor: activeTab === 'analytics' ? 'var(--tertiary)' : 'transparent',
                  color: activeTab === 'analytics' ? 'var(--tertiary)' : 'var(--muted)',
                  background: activeTab === 'analytics' ? 'var(--tertiary-background)' : 'transparent'
                }}
              >
                Analytics
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
            <EmailsContainer />
          )}

          {activeTab === 'calls' && (
            <CallsContainer />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab />
          )}
        </div>
      </div>
    </>
  );
}
