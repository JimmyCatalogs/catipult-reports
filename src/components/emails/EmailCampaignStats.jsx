import React from 'react';

export function EmailCampaignStats({ data, title }) {
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
}
