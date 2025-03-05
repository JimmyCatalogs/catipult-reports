import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { generateDailyDataForDateRange, extractDateRange } from './utils/linkedInChartUtils';

export function LinkedInTimeSeriesChart({ 
  campaigns, 
  selectedCampaignForTimeSeries, 
  selectedTimeSeriesMetric, 
  campaignDailyData, 
  loadingDailyData, 
  handleCampaignTimeSeriesChange, 
  handleTimeSeriesMetricChange 
}) {
  const [viewMode, setViewMode] = useState('byCampaign'); // 'byCampaign' or 'byMetric'
  
  // Get colors for different metrics and campaigns
  const getMetricColor = (metric, alpha = 1) => {
    if (metric === 'impressions') return `rgba(54, 162, 235, ${alpha})`;
    if (metric === 'clicks') return `rgba(255, 99, 132, ${alpha})`;
    return `rgba(75, 192, 192, ${alpha})`;
  };
  
  const getCampaignColor = (index, alpha = 1) => {
    const colors = [
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
    ];
    return colors[index % colors.length];
  };
  
  // Prepare time series data based on view mode
  let timeSeriesData = null;
  let chartTitle = 'Daily Performance';
  
  if (viewMode === 'byCampaign' && selectedCampaignForTimeSeries && campaignDailyData) {
    // View by Campaign: One campaign, showing all metrics
    timeSeriesData = {
      labels: campaignDailyData.map(item => item.date),
      datasets: [
        {
          label: 'Impressions',
          data: campaignDailyData.map(item => item.impressions || 0),
          borderColor: getMetricColor('impressions'),
          backgroundColor: getMetricColor('impressions', 0.2),
          tension: 0.1,
          fill: false,
        },
        {
          label: 'Clicks',
          data: campaignDailyData.map(item => item.clicks || 0),
          borderColor: getMetricColor('clicks'),
          backgroundColor: getMetricColor('clicks', 0.2),
          tension: 0.1,
          fill: false,
        },
        {
          label: 'Cost',
          data: campaignDailyData.map(item => item.costInLocalCurrency || 0),
          borderColor: getMetricColor('costInLocalCurrency'),
          backgroundColor: getMetricColor('costInLocalCurrency', 0.2),
          tension: 0.1,
          fill: false,
          yAxisID: 'costAxis',
        },
        {
          label: 'Qualified Leads',
          data: campaignDailyData.map(item => item.conversions || 0),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1,
          fill: false,
        },
        {
          label: 'One-Click Leads',
          data: campaignDailyData.map(item => item.oneClickLeads || 0),
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.1,
          fill: false,
        }
      ]
    };
    
    chartTitle = selectedCampaignForTimeSeries ? 
      `${selectedCampaignForTimeSeries.name} - Daily Performance Metrics` : 
      'Daily Performance';
  } else if (viewMode === 'byMetric') {
    // View by Metric: All campaigns, showing one metric
    // Generate daily data for all campaigns
    const dateRange = extractDateRange(campaigns[0]?.title || '');
    const allCampaignsData = {};
    
    // Get unique dates across all campaigns
    const allDates = new Set();
    
    campaigns.forEach((campaign, index) => {
      const dailyData = campaign.metrics?.dailyData || 
        generateDailyDataForDateRange(campaign, dateRange.startDate, dateRange.endDate);
      
      allCampaignsData[campaign.id] = dailyData;
      
      // Collect all dates
      dailyData.forEach(item => allDates.add(item.date));
    });
    
    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    
    // Create datasets for each campaign
    const datasets = campaigns.map((campaign, index) => {
      const campaignDailyData = allCampaignsData[campaign.id];
      
      // Create a map of date to data for quick lookup
      const dateDataMap = {};
      campaignDailyData.forEach(item => {
        dateDataMap[item.date] = item;
      });
      
      return {
        label: campaign.name,
        data: sortedDates.map(date => {
          const dataPoint = dateDataMap[date];
          if (!dataPoint) return 0;
          
          // For standard metrics, use the value directly
          if (['impressions', 'clicks', 'costInLocalCurrency', 'conversions', 'oneClickLeads'].includes(selectedTimeSeriesMetric)) {
            return dataPoint[selectedTimeSeriesMetric] || 0;
          }
          
          // For calculated metrics, compute them on the fly with maximum safeguards
          try {
            const impressions = dataPoint.impressions || 0;
            const clicks = dataPoint.clicks || 0;
            const cost = dataPoint.costInLocalCurrency || 0;
            const qualifiedLeads = dataPoint.conversions || 0;
            const oneClickLeads = dataPoint.oneClickLeads || 0;
            
            let result = 0;
            
            switch (selectedTimeSeriesMetric) {
              case 'ctr':
                if (impressions > 0) {
                  result = (clicks / impressions) * 100;
                }
                break;
              case 'cpm':
                if (impressions > 0) {
                  result = (cost / impressions) * 1000;
                }
                break;
              case 'cpc':
                if (clicks > 0) {
                  result = cost / clicks;
                }
                break;
              case 'cpr':
                if (qualifiedLeads > 0) {
                  result = cost / qualifiedLeads;
                }
                break;
              case 'costPerLead':
                // Cost per lead is now based only on oneClickLeads
                if (oneClickLeads > 0) {
                  result = cost / oneClickLeads;
                }
                break;
              default:
                result = 0;
            }
            
            // Final check to ensure we don't return NaN or Infinity
            if (isNaN(result) || !isFinite(result)) {
              console.warn(`Invalid result for ${selectedTimeSeriesMetric}: ${result}`);
              return 0;
            }
            
            return result;
          } catch (error) {
            console.error(`Error calculating ${selectedTimeSeriesMetric}:`, error);
            return 0;
          }
        }),
        borderColor: getCampaignColor(index),
        backgroundColor: getCampaignColor(index, 0.2),
        tension: 0.1,
        fill: false,
      };
    });
    
    timeSeriesData = {
      labels: sortedDates,
      datasets: datasets
    };
    
    chartTitle = `Daily ${
      selectedTimeSeriesMetric === 'impressions' ? 'Impressions' : 
      selectedTimeSeriesMetric === 'clicks' ? 'Clicks' : 
      selectedTimeSeriesMetric === 'costInLocalCurrency' ? 'Cost' : 
      selectedTimeSeriesMetric === 'conversions' ? 'Qualified Leads' : 
      selectedTimeSeriesMetric === 'oneClickLeads' ? 'One-Click Leads' :
      selectedTimeSeriesMetric === 'ctr' ? 'CTR' :
      selectedTimeSeriesMetric === 'cpm' ? 'CPM' :
      selectedTimeSeriesMetric === 'cpc' ? 'CPC' :
      selectedTimeSeriesMetric === 'cpr' ? 'CPR' :
      'Cost per Lead'
    } Performance - All Campaigns`;
  }
  
  // Configure chart options based on view mode
  const timeSeriesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: chartTitle,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: viewMode === 'byMetric' ? 
            (selectedTimeSeriesMetric === 'impressions' ? 'Impressions' : 
             selectedTimeSeriesMetric === 'clicks' ? 'Clicks' : 
             selectedTimeSeriesMetric === 'costInLocalCurrency' ? 'Cost' : 
             selectedTimeSeriesMetric === 'conversions' ? 'Qualified Leads' : 
             selectedTimeSeriesMetric === 'oneClickLeads' ? 'One-Click Leads' :
             selectedTimeSeriesMetric === 'ctr' ? 'CTR (%)' :
             selectedTimeSeriesMetric === 'cpm' ? 'CPM ($)' :
             selectedTimeSeriesMetric === 'cpc' ? 'CPC ($)' :
             selectedTimeSeriesMetric === 'cpr' ? 'CPR ($)' :
             'Cost per Lead ($)') : 
            'Metrics'
        }
      },
      ...(viewMode === 'byCampaign' ? {
        costAxis: {
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cost'
          },
          grid: {
            drawOnChartArea: false,
          }
        }
      } : {}),
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Daily Performance Over Time
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>View</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              <option value="byCampaign">View by Campaign</option>
              <option value="byMetric">View by Metric</option>
            </select>
          </div>
          
          {/* Campaign Selector (only shown in "View by Campaign" mode) */}
          {viewMode === 'byCampaign' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Campaign</label>
              <select
                value={selectedCampaignForTimeSeries ? selectedCampaignForTimeSeries.id : ""}
                onChange={handleCampaignTimeSeriesChange}
                className="rounded-md border px-3 py-2 text-sm"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="">Select a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Metric Selector (only shown in "View by Metric" mode) */}
          {viewMode === 'byMetric' && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Metric</label>
              <select
                value={selectedTimeSeriesMetric}
                onChange={handleTimeSeriesMetricChange}
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
                <option value="conversions">Qualified Leads</option>
                <option value="oneClickLeads">One-Click Leads</option>
                <option value="ctr">CTR</option>
                <option value="cpm">CPM</option>
                <option value="cpc">CPC</option>
                <option value="cpr">CPR</option>
                <option value="costPerLead">Cost per Lead</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
      {viewMode === 'byCampaign' && loadingDailyData ? (
        <div className="text-center py-8 border rounded" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
          Loading daily data...
        </div>
      ) : viewMode === 'byCampaign' && selectedCampaignForTimeSeries && campaignDailyData && campaignDailyData.length > 0 ? (
        <Line data={timeSeriesData} options={timeSeriesOptions} />
      ) : viewMode === 'byMetric' ? (
        <Line data={timeSeriesData} options={timeSeriesOptions} />
      ) : (
        <div className="text-center py-8 border rounded" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
          {viewMode === 'byCampaign' && selectedCampaignForTimeSeries ? 
            'No daily data available for this campaign' : 
            'Select a campaign to view daily performance data'}
        </div>
      )}
    </div>
  );
}
