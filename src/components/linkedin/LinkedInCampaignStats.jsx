import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function LinkedInCampaignStats({ data, title }) {
  if (!data || !data.campaigns || data.campaigns.length === 0) {
    return (
      <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          {title}
        </h2>
        <div style={{ color: 'var(--muted)' }} className="text-center py-8">
          No campaign data available for this period.
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: data.campaigns.map(campaign => campaign.name),
    datasets: [
      {
        label: 'Impressions',
        data: data.campaigns.map(campaign => campaign.metrics.impressions || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Clicks',
        data: data.campaigns.map(campaign => campaign.metrics.clicks || 0),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Conversions',
        data: data.campaigns.map(campaign => campaign.metrics.conversions || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Campaign Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        {title}
      </h2>
      
      {data._requestDetails && (
        <div className="mb-4 p-3 rounded text-xs font-mono overflow-x-auto" style={{ background: 'var(--muted-background)', color: 'var(--muted)' }}>
          <p className="font-semibold mb-1">API Query Details:</p>
          <p>Endpoint: {data._requestDetails.endpoint}</p>
          <p>Full URL: {data._requestDetails.fullUrl}</p>
          <p>API Type: {data._requestDetails.apiType}</p>
          <p>Method: {data._requestDetails.method}</p>
          <p className="font-semibold mt-2 mb-1">Query Parameters:</p>
          <pre>{JSON.stringify(data._requestDetails.queryParams, null, 2)}</pre>
        </div>
      )}

      <div className="mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Campaign</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Impressions</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Clicks</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>CTR</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Conversions</th>
              <th className="px-4 py-2 text-left text-sm font-medium" style={{ color: 'var(--muted)' }}>Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {data.campaigns.map((campaign, index) => {
              const impressions = campaign.metrics.impressions || 0;
              const clicks = campaign.metrics.clicks || 0;
              const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0.00%';
              const conversions = campaign.metrics.conversions || 0;
              const cost = campaign.metrics.costInLocalCurrency 
                ? `$${parseFloat(campaign.metrics.costInLocalCurrency).toFixed(2)}` 
                : '$0.00';

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
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{conversions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--foreground)' }}>{cost}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
