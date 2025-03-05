import React, { useState } from 'react';

// Tooltip component for displaying information on hover
const Tooltip = ({ text }) => (
  <div className="group relative inline-block">
    <span className="ml-1 cursor-help text-sm" style={{ color: 'var(--muted)' }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    </span>
    <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-2 left-6 w-48">
      {text}
    </div>
  </div>
);

export function LinkedInCampaignTable({ campaigns, aggregatedData }) {
  const [showCalculatedMetrics, setShowCalculatedMetrics] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Campaign Details
        </h3>
        <button
          onClick={() => setShowCalculatedMetrics(!showCalculatedMetrics)}
          className="px-3 py-1 rounded-md text-sm font-medium"
          style={{
            background: 'var(--primary)',
            color: 'white'
          }}
        >
          {showCalculatedMetrics ? 'Hide Calculated Metrics' : 'Show Calculated Metrics'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Campaign</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Impressions</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Clicks</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                CTR
                <Tooltip text="Click-Through Rate: Percentage of chargeable clicks relative to impressions (clicks divided by impressions)" />
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Cost</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Qualified Leads</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>One-Click Leads</th>
              
              {showCalculatedMetrics && (
                <>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    CPM
                    <Tooltip text="Cost per 1,000 Impressions: Total spent on your ads divided by 1,000 impressions" />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    CPC
                    <Tooltip text="Cost per Click: Total spent on your ads divided by total clicks" />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    CPR
                    <Tooltip text="Cost per Result: Average cost per result. Total spent on your campaign divided by the number of results based on your objective" />
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>
                    Cost per Lead
                    <Tooltip text="Amount spent per lead collected" />
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {/* Individual campaign rows */}
            {campaigns.map((campaign, index) => {
              const impressions = campaign.metrics.impressions || 0;
              const clicks = campaign.metrics.clicks || 0;
              
              // Use costInLocalCurrency which is mapped from costInUsd in the API
              const campaignCost = parseFloat(campaign.metrics.costInLocalCurrency || 0);
              console.log(`Campaign table: ${campaign.name} cost: ${campaignCost}`);
              
              const qualifiedLeads = campaign.metrics.conversions || 0;
              const oneClickLeads = campaign.metrics.oneClickLeads || 0;
              
              // Calculate metrics
              const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%';
              const cost = `$${parseFloat(campaignCost).toFixed(2)}`;
              
              // Calculate additional metrics
              const cpm = impressions > 0 ? `$${((campaignCost / impressions) * 1000).toFixed(2)}` : '$0.00';
              const cpc = clicks > 0 ? `$${(campaignCost / clicks).toFixed(2)}` : '$0.00';
              const cpr = qualifiedLeads > 0 ? `$${(campaignCost / qualifiedLeads).toFixed(2)}` : '$0.00';
              const totalLeads = qualifiedLeads + oneClickLeads;
              const costPerLead = totalLeads > 0 ? `$${(campaignCost / totalLeads).toFixed(2)}` : '$0.00';

              return (
                <tr key={campaign.id || index}>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{campaign.name}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>
                    <span 
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ 
                        background: campaign.status === 'ACTIVE' ? 'var(--success-background)' : 'var(--warning-background)',
                        color: campaign.status === 'ACTIVE' ? 'var(--success)' : 'var(--warning)'
                      }}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{impressions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{clicks.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{ctr}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cost}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{qualifiedLeads.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{oneClickLeads.toLocaleString()}</td>
                  
                  {showCalculatedMetrics && (
                    <>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cpm}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cpc}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cpr}</td>
                      <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{costPerLead}</td>
                    </>
                  )}
                </tr>
              );
            })}
            
            {/* Totals row */}
            {aggregatedData && (
              <tr className="border-t-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted-background)' }}>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>All Campaigns</td>
                <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}></td>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.impressions.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.clicks.toLocaleString()}</td>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.ctr}</td>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCost}</td>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{(aggregatedData.conversions || 0).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{(aggregatedData.oneClickLeads || 0).toLocaleString()}</td>
                
                {showCalculatedMetrics && (
                  <>
                    <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCpm}</td>
                    <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCpc}</td>
                    <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCpr}</td>
                    <td className="px-4 py-2 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCostPerLead}</td>
                  </>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
