import React from 'react';
import { EmailCampaignTab } from './EmailCampaignTab';
import { QuickmailRepliesTab } from './QuickmailRepliesTab';
import { LoadingBar } from '../LoadingBar';

export function EmailsTab({
  activeEmailsView,
  setActiveEmailsView,
  campaignDataSets,
  repliesData,
  initialLoading,
  refreshing,
  onRefresh,
  error
}) {
  return (
    <div className="pb-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Email Analytics
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveEmailsView('api')}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: activeEmailsView === 'api' ? 'var(--primary)' : 'var(--background)',
                color: activeEmailsView === 'api' ? 'white' : 'var(--muted)'
              }}
            >
              Quickmail API
            </button>
            <button
              onClick={() => setActiveEmailsView('replies')}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: activeEmailsView === 'replies' ? 'var(--primary)' : 'var(--background)',
                color: activeEmailsView === 'replies' ? 'white' : 'var(--muted)'
              }}
            >
              Quickmail Replies Data
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--error-background)', color: 'var(--error)', borderColor: 'var(--error)' }} className="border px-4 py-3 rounded relative mb-6" role="alert">
          {error}
        </div>
      )}

      {(initialLoading || refreshing) && (
        <div className="absolute top-0 left-0 w-full">
          <LoadingBar progress={1} />
        </div>
      )}

      {activeEmailsView === 'api' ? (
        <EmailCampaignTab
          campaignDataSets={campaignDataSets}
          initialLoading={initialLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <QuickmailRepliesTab
          repliesData={repliesData}
          initialLoading={initialLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
