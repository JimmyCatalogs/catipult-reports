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

export function LinkedInCampaignSummary({ aggregatedData }) {
  const [showCalculatedMetrics, setShowCalculatedMetrics] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          All Campaigns Totals
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
          <tbody>
            <tr>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.impressions.toLocaleString()}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.clicks.toLocaleString()}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.ctr}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCost}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{(aggregatedData.conversions || 0).toLocaleString()}</td>
              <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{(aggregatedData.oneClickLeads || 0).toLocaleString()}</td>
              
              {showCalculatedMetrics && (
                <>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCpm}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCpc}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCpr}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{aggregatedData.formattedCostPerLead}</td>
                </>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
