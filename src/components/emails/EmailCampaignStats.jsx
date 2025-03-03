import React from 'react';

export function EmailCampaignStats({ data, title, showPercentages }) {
  if (!data?.campaign) return null;
  
  // Calculate delivered count for percentage calculations
  const deliveredCount = data.campaign.stats?.delivered || 0;
  
  // Function to format percentage
  const formatPercentage = (value) => {
    if (!deliveredCount) return '0%';
    return `${Math.round((value / deliveredCount) * 100)}%`;
  };
  
  // Function to get display value based on view mode
  const getDisplayValue = (value) => {
    if (!showPercentages) return value;
    return formatPercentage(value);
  };
  
  return (
    <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
          {title} - {data.campaign.name}
        </h2>
      </div>
      
      <div className="space-y-8">
        {/* Delivery Stats */}
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>Delivery Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.campaign.stats?.total !== undefined && (
              <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Total Sent</h3>
                <p className="text-2xl font-bold">{data.campaign.stats.total}</p>
              </div>
            )}
            {data.campaign.stats?.delivered !== undefined && (
              <div style={{ background: 'var(--success-background)', color: 'var(--success)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Delivered</h3>
                <p className="text-2xl font-bold">{data.campaign.stats.delivered}</p>
              </div>
            )}
            {data.campaign.stats?.bounces !== undefined && (
              <div style={{ background: 'var(--error-background)', color: 'var(--error)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Bounces</h3>
                <p className="text-2xl font-bold">{data.campaign.stats.bounces}</p>
              </div>
            )}
          </div>
        </div>

        {/* Engagement Stats */}
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>Engagement Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {data.campaign.stats?.opens !== undefined && (
              <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Unique Opens</h3>
                <p className="text-2xl font-bold">{getDisplayValue(data.campaign.stats.opens)}</p>
              </div>
            )}
            {data.campaign.stats?.replies !== undefined && (
              <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Total Replies</h3>
                <p className="text-2xl font-bold">{getDisplayValue(data.campaign.stats.replies)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Response Stats */}
        <div>
          <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--foreground)' }}>Response Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.campaign.stats?.repliesPositive !== undefined && (
              <div style={{ background: 'var(--success-background)', color: 'var(--success)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Positive Replies</h3>
                <p className="text-2xl font-bold">{getDisplayValue(data.campaign.stats.repliesPositive)}</p>
              </div>
            )}
            {data.campaign.stats?.repliesNegative !== undefined && (
              <div style={{ background: 'var(--error-background)', color: 'var(--error)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Negative Replies</h3>
                <p className="text-2xl font-bold">{getDisplayValue(data.campaign.stats.repliesNegative)}</p>
              </div>
            )}
            {data.campaign.stats?.unsubscribes !== undefined && (
              <div style={{ background: 'var(--error-background)', color: 'var(--error)' }} className="p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Unsubscribes</h3>
                <p className="text-2xl font-bold">{getDisplayValue(data.campaign.stats.unsubscribes)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
