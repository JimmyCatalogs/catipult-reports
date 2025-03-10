import React from 'react';
import { Bar } from 'react-chartjs-2';

export function ButtonClickPanel({ 
  buttonClickEvents, 
  buttonClickView, 
  handleButtonClickViewChange, 
  showFilters, 
  setShowFilters,
  selectedFilters,
  handleButtonClickFilterChange,
  setSelectedFilters
}) {
  // Process button click events data
  const processButtonClickEventsData = () => {
    if (!buttonClickEvents || buttonClickEvents.length === 0) {
      return { 
        pageLabels: [], 
        pages: [], 
        labels: [], 
        buttonClicksByPageLabel: {},
        buttonClicksByPage: {},
        buttonClicksByLabel: {}
      };
    }

    // Get unique page/label combinations
    const pageLabels = [...new Set(buttonClickEvents.map(row => {
      const label = row.dimensionValues[1].value || '(not set)'; // event_label
      const page = row.dimensionValues[2].value || '(not set)'; // page_path
      return `${page} / ${label}`;
    }))];
    
    // Get unique pages
    const pages = [...new Set(buttonClickEvents.map(row => 
      row.dimensionValues[2].value || '(not set)' // page_path
    ))];
    
    // Get unique labels
    const labels = [...new Set(buttonClickEvents.map(row => 
      row.dimensionValues[1].value || '(not set)' // event_label
    ))];
    
    // Group button clicks by page/label
    const buttonClicksByPageLabel = {};
    pageLabels.forEach(pageLabel => {
      const [page, label] = pageLabel.split(' / ');
      const eventData = buttonClickEvents
        .filter(row => {
          const rowLabel = row.dimensionValues[1].value || '(not set)'; // event_label
          const rowPage = row.dimensionValues[2].value || '(not set)'; // page_path
          return rowPage === page && rowLabel === label;
        })
        .sort((a, b) => a.dimensionValues[3].value.localeCompare(b.dimensionValues[3].value));
      
      buttonClicksByPageLabel[pageLabel] = eventData;
    });
    
    // Group button clicks by page
    const buttonClicksByPage = {};
    pages.forEach(page => {
      const eventData = buttonClickEvents
        .filter(row => {
          const rowPage = row.dimensionValues[2].value || '(not set)'; // page_path
          return rowPage === page;
        })
        .sort((a, b) => a.dimensionValues[3].value.localeCompare(b.dimensionValues[3].value));
      
      buttonClicksByPage[page] = eventData;
    });
    
    // Group button clicks by label
    const buttonClicksByLabel = {};
    labels.forEach(label => {
      const eventData = buttonClickEvents
        .filter(row => {
          const rowLabel = row.dimensionValues[1].value || '(not set)'; // event_label
          return rowLabel === label;
        })
        .sort((a, b) => a.dimensionValues[3].value.localeCompare(b.dimensionValues[3].value));
      
      buttonClicksByLabel[label] = eventData;
    });
    
    return { 
      pageLabels, 
      pages, 
      labels, 
      buttonClicksByPageLabel,
      buttonClicksByPage,
      buttonClicksByLabel
    };
  };

  const { 
    pageLabels, 
    pages, 
    labels, 
    buttonClicksByPageLabel,
    buttonClicksByPage,
    buttonClicksByLabel
  } = processButtonClickEventsData();

  // Helper function to get filtered button click data based on selected filters
  const getFilteredButtonClickData = () => {
    let data = [];
    let labels = [];
    
    if (buttonClickView === 'pageLabel') {
      // Filter by page/label
      const filteredPageLabels = selectedFilters.buttonClickPageLabel.length > 0 
        ? pageLabels.filter(pageLabel => selectedFilters.buttonClickPageLabel.includes(pageLabel))
        : pageLabels;
      
      // Get total counts for each page/label
      data = filteredPageLabels.map(pageLabel => {
        const events = buttonClicksByPageLabel[pageLabel] || [];
        return events.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0);
      });
      
      labels = filteredPageLabels;
    } else if (buttonClickView === 'page') {
      // Filter by page
      const filteredPages = selectedFilters.buttonClickPage.length > 0 
        ? pages.filter(page => selectedFilters.buttonClickPage.includes(page))
        : pages;
      
      // Get total counts for each page
      data = filteredPages.map(page => {
        const events = buttonClicksByPage[page] || [];
        return events.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0);
      });
      
      labels = filteredPages;
    } else if (buttonClickView === 'label') {
      // Filter by label
      const filteredLabels = selectedFilters.buttonClickLabel.length > 0 
        ? labels.filter(label => selectedFilters.buttonClickLabel.includes(label))
        : labels;
      
      // Get total counts for each label
      data = filteredLabels.map(label => {
        const events = buttonClicksByLabel[label] || [];
        return events.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0);
      });
      
      labels = filteredLabels;
    }
    
    return { data, labels };
  };
  
  const buttonClickChartData = (() => {
    const { data, labels } = getFilteredButtonClickData();
    
    return {
      labels,
      datasets: [{
        label: 'Button Clicks',
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      }]
    };
  })();

  // Get all available filter options for the button click view
  const getButtonClickFilterOptions = () => {
    if (buttonClickView === 'pageLabel') {
      return pageLabels;
    } else if (buttonClickView === 'page') {
      return pages;
    } else if (buttonClickView === 'label') {
      return labels;
    }
    return [];
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-semibold">Button Click Events</h3>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
          <div className="flex gap-2">
            <button
              onClick={() => handleButtonClickViewChange('pageLabel')}
              className={`px-3 py-1 text-sm rounded-md ${
                buttonClickView === 'pageLabel'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Page / Label
            </button>
            <button
              onClick={() => handleButtonClickViewChange('page')}
              className={`px-3 py-1 text-sm rounded-md ${
                buttonClickView === 'page'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Page
            </button>
            <button
              onClick={() => handleButtonClickViewChange('label')}
              className={`px-3 py-1 text-sm rounded-md ${
                buttonClickView === 'label'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Label
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
          <h4 className="text-sm font-medium mb-2">
            Filter by {
              buttonClickView === 'pageLabel' ? 'Page / Label' : 
              buttonClickView === 'page' ? 'Page' : 'Label'
            }
          </h4>
          <div className="max-h-40 overflow-y-auto">
            {getButtonClickFilterOptions().map((option, index) => {
              const filterType = buttonClickView === 'pageLabel' ? 'buttonClickPageLabel' : 
                                buttonClickView === 'page' ? 'buttonClickPage' : 'buttonClickLabel';
              return (
                <div key={index} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`button-click-filter-${index}`}
                    checked={selectedFilters[filterType].includes(option)}
                    onChange={() => handleButtonClickFilterChange(option)}
                    className="mr-2"
                  />
                  <label htmlFor={`button-click-filter-${index}`} className="text-sm">
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
          {(() => {
            const filterType = buttonClickView === 'pageLabel' ? 'buttonClickPageLabel' : 
                              buttonClickView === 'page' ? 'buttonClickPage' : 'buttonClickLabel';
            return selectedFilters[filterType].length > 0 && (
              <button
                onClick={() => setSelectedFilters(prev => ({ ...prev, [filterType]: [] }))}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            );
          })()}
        </div>
      )}
      
      <div className="h-[400px]">
        {processButtonClickEventsData().pageLabels.length > 0 ? (
          <Bar 
            data={buttonClickChartData}
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
                      return `Clicks: ${context.raw}`;
                    }
                  }
                }
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No button click events data available for the selected date range.</p>
          </div>
        )}
      </div>
    </div>
  );
}
