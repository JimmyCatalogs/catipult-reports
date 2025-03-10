import React from 'react';
import { Line, Bar } from 'react-chartjs-2';

// Helper function to parse GA4 date format (YYYYMMDD)
function formatGADate(gaDate) {
  const year = gaDate.substring(0, 4);
  const month = gaDate.substring(4, 6);
  const day = gaDate.substring(6, 8);
  const date = new Date(year, parseInt(month) - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function PageViewsPanel({ 
  pageViews, 
  topPages, 
  sourceMedium, 
  source, 
  medium, 
  dateRangeError,
  trafficView,
  handleViewChange,
  showFilters,
  toggleFilters,
  selectedFilters,
  handleFilterChange,
  setSelectedFilters
}) {
  const pageViewsChartData = {
    labels: pageViews
      .slice() // Create a copy to avoid mutating the original array
      .sort((a, b) => {
        // Sort by date (YYYYMMDD format)
        return a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value);
      })
      .map(row => formatGADate(row.dimensionValues[0].value)),
    datasets: [{
      label: 'Page Views',
      data: pageViews
        .slice() // Create a copy to avoid mutating the original array
        .sort((a, b) => {
          // Sort by date (YYYYMMDD format)
          return a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value);
        })
        .map(row => parseInt(row.metricValues[0].value)),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const topPagesChartData = {
    labels: topPages.map(row => {
      const path = row.dimensionValues[0].value;
      return path === '/' ? 'Home' : path.replace(/^\//, '');
    }),
    datasets: [{
      label: 'Views',
      data: topPages.map(row => parseInt(row.metricValues[0].value)),
      backgroundColor: 'rgba(53, 162, 235, 0.5)',
    }]
  };

  // Helper function to get filtered data based on selected filters
  const getFilteredData = (data, filterType, filters) => {
    if (!filters || filters.length === 0) {
      return data;
    }
    
    return data.filter(row => {
      if (filterType === 'sourceMedium') {
        const source = row.dimensionValues[0].value || '(not set)';
        const medium = row.dimensionValues[1].value || '(not set)';
        const label = `${source} / ${medium}`;
        return filters.includes(label);
      } else if (filterType === 'source') {
        const source = row.dimensionValues[0].value || '(not set)';
        return filters.includes(source);
      } else if (filterType === 'medium') {
        const medium = row.dimensionValues[0].value || '(not set)';
        return filters.includes(medium);
      }
      return true;
    });
  };

  const sourceMediumChartData = {
    labels: getFilteredData(sourceMedium, 'sourceMedium', selectedFilters.sourceMedium).map(row => {
      const sessionSource = row.dimensionValues[0].value || '(not set)';
      const sessionMedium = row.dimensionValues[1].value || '(not set)';
      return `${sessionSource} / ${sessionMedium}`;
    }),
    datasets: [{
      label: 'Users',
      data: getFilteredData(sourceMedium, 'sourceMedium', selectedFilters.sourceMedium).map(row => parseInt(row.metricValues[0].value)),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    }]
  };
  
  const sourceChartData = {
    labels: getFilteredData(source, 'source', selectedFilters.source).map(row => {
      return row.dimensionValues[0].value || '(not set)';
    }),
    datasets: [{
      label: 'Users',
      data: getFilteredData(source, 'source', selectedFilters.source).map(row => parseInt(row.metricValues[0].value)),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    }]
  };
  
  const mediumChartData = {
    labels: getFilteredData(medium, 'medium', selectedFilters.medium).map(row => {
      return row.dimensionValues[0].value || '(not set)';
    }),
    datasets: [{
      label: 'Users',
      data: getFilteredData(medium, 'medium', selectedFilters.medium).map(row => parseInt(row.metricValues[0].value)),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    }]
  };

  // Get all available filter options for the current view
  const getFilterOptions = () => {
    if (trafficView === 'sourceMedium') {
      return sourceMedium.map(row => {
        const source = row.dimensionValues[0].value || '(not set)';
        const medium = row.dimensionValues[1].value || '(not set)';
        return `${source} / ${medium}`;
      });
    } else if (trafficView === 'source') {
      return source.map(row => row.dimensionValues[0].value || '(not set)');
    } else if (trafficView === 'medium') {
      return medium.map(row => row.dimensionValues[0].value || '(not set)');
    }
    return [];
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Page Views Over Time</h3>
        <div className="h-[300px]">
          {pageViews.length > 0 && (
          <Line 
            data={pageViewsChartData} 
            options={{ 
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Page Views'
                  }
                }
              }
            }} 
          />
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
        <div className="h-[400px]">
          {topPages.length > 0 && (
            <Bar 
              data={topPagesChartData}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
              }}
            />
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h3 className="text-lg font-semibold">Session Traffic Sources</h3>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
            <div className="flex gap-2">
              <button
                onClick={() => handleViewChange('sourceMedium')}
                className={`px-3 py-1 text-sm rounded-md ${
                  trafficView === 'sourceMedium'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Source / Medium
              </button>
              <button
                onClick={() => handleViewChange('source')}
                className={`px-3 py-1 text-sm rounded-md ${
                  trafficView === 'source'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Source
              </button>
              <button
                onClick={() => handleViewChange('medium')}
                className={`px-3 py-1 text-sm rounded-md ${
                  trafficView === 'medium'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Medium
              </button>
            </div>
            <button
              onClick={toggleFilters}
              className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-700 flex items-center"
            >
              <span>Filter</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-1 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mb-4 p-3 border rounded-md bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Filter by {trafficView === 'sourceMedium' ? 'Source / Medium' : trafficView === 'source' ? 'Source' : 'Medium'}</h4>
            <div className="max-h-40 overflow-y-auto">
              {getFilterOptions().map((option, index) => (
                <div key={index} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`filter-${index}`}
                    checked={selectedFilters[trafficView].includes(option)}
                    onChange={() => handleFilterChange(option)}
                    className="mr-2"
                  />
                  <label htmlFor={`filter-${index}`} className="text-sm">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {selectedFilters[trafficView].length > 0 && (
              <button
                onClick={() => setSelectedFilters(prev => ({ ...prev, [trafficView]: [] }))}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        
        <div className="h-[400px]">
          {trafficView === 'sourceMedium' && sourceMedium.length > 0 && (
            <Bar 
              data={sourceMediumChartData}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        return context[0].label;
                      },
                      label: function(context) {
                        return `Users: ${context.raw}`;
                      }
                    }
                  }
                }
              }}
            />
          )}
          
          {trafficView === 'source' && source.length > 0 && (
            <Bar 
              data={sourceChartData}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        return context[0].label;
                      },
                      label: function(context) {
                        return `Users: ${context.raw}`;
                      }
                    }
                  }
                }
              }}
            />
          )}
          
          {trafficView === 'medium' && medium.length > 0 && (
            <Bar 
              data={mediumChartData}
              options={{
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        return context[0].label;
                      },
                      label: function(context) {
                        return `Users: ${context.raw}`;
                      }
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
