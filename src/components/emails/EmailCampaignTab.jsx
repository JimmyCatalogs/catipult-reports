import React from 'react';
import { EmailCampaignStats } from './EmailCampaignStats';
import { getLastNDaysRange, getDateRangeString } from '../../utils/dates';

export function EmailCampaignTab({ 
  campaignDataSets, 
  initialLoading, 
  refreshing, 
  onRefresh 
}) {
  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Email Campaign Analytics
          </h1>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: 'var(--primary)',
            color: 'white'
          }}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
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

      {(initialLoading || refreshing) ? (
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
          {(() => {
            const last7Range = getLastNDaysRange(7);
            const last30Range = getLastNDaysRange(30);
            return (
              <>
                <EmailCampaignStats 
                  data={campaignDataSets.last7} 
                  title={`Last 7 Days (${getDateRangeString(last7Range.start, last7Range.end)})`}
                />
                <EmailCampaignStats 
                  data={campaignDataSets.last30} 
                  title={`Last 30 Days (${getDateRangeString(last30Range.start, last30Range.end)})`}
                />
                <EmailCampaignStats 
                  data={campaignDataSets.full} 
                  title="Full Campaign"
                />
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}
