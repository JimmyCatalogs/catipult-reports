import React from 'react';
import { Bar } from 'react-chartjs-2';

export function LinkedInPerformanceChart({ campaigns, selectedMetric, handleMetricChange }) {
  // Prepare chart data for campaign comparison
  const chartData = {
    labels: campaigns.map(campaign => campaign.name),
    datasets: [
      {
        label: selectedMetric === 'impressions' ? 'Impressions' : 
               selectedMetric === 'clicks' ? 'Clicks' : 'Cost',
        data: campaigns.map(campaign => {
          if (selectedMetric === 'impressions') return campaign.metrics.impressions || 0;
          if (selectedMetric === 'clicks') return campaign.metrics.clicks || 0;
          return campaign.metrics.costInLocalCurrency || 0;
        }),
        backgroundColor: selectedMetric === 'impressions' ? 'rgba(54, 162, 235, 0.5)' : 
                        selectedMetric === 'clicks' ? 'rgba(255, 99, 132, 0.5)' : 
                        'rgba(75, 192, 192, 0.5)',
        borderColor: selectedMetric === 'impressions' ? 'rgba(54, 162, 235, 1)' : 
                    selectedMetric === 'clicks' ? 'rgba(255, 99, 132, 1)' : 
                    'rgba(75, 192, 192, 1)',
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
        text: 'Campaign Performance Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="mt-8 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Campaign Performance Chart
        </h3>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Metric</label>
          <select
            value={selectedMetric}
            onChange={handleMetricChange}
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              background: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            <option value="impressions">Impressions</option>
            <option value="clicks">Clicks</option>
            <option value="costInLocalCurrency">Cost</option>
          </select>
        </div>
      </div>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}
