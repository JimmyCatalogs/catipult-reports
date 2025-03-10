import React from 'react';
import { Line } from 'react-chartjs-2';
import { ButtonClickPanel } from './ButtonClickPanel';

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

export function EventsPanel({ 
  events, 
  buttonClickEvents,
  dateRangeError,
  buttonClickView,
  handleButtonClickViewChange,
  showFilters,
  setShowFilters,
  selectedFilters,
  handleButtonClickFilterChange,
  setSelectedFilters
}) {
  // Process events data to group by event name and date
  const processEventsData = () => {
    if (!events || events.length === 0) {
      return { eventNames: [], eventsByName: {} };
    }

    // Get unique event names
    const eventNames = [...new Set(events.map(row => row.dimensionValues[0].value))];
    
    // Group events by name
    const eventsByName = {};
    eventNames.forEach(eventName => {
      const eventData = events
        .filter(row => row.dimensionValues[0].value === eventName)
        .sort((a, b) => a.dimensionValues[1].value.localeCompare(b.dimensionValues[1].value));
      
      eventsByName[eventName] = eventData;
    });
    
    return { eventNames, eventsByName };
  };

  const { eventNames, eventsByName } = processEventsData();

  // Create chart data for events
  const eventsChartData = {
    labels: [...new Set(events
      .map(row => formatGADate(row.dimensionValues[1].value)))],
    datasets: eventNames.map((eventName, index) => {
      // Get all dates
      const allDates = [...new Set(events
        .map(row => row.dimensionValues[1].value))].sort();
      
      // Create a map of date to count for this event
      const dateCountMap = {};
      allDates.forEach(date => {
        dateCountMap[date] = 0;
      });
      
      // Fill in the counts
      eventsByName[eventName].forEach(row => {
        dateCountMap[row.dimensionValues[1].value] = parseInt(row.metricValues[0].value);
      });
      
      // Generate colors based on index
      const colors = [
        'rgb(75, 192, 192)',
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)'
      ];
      const colorIndex = index % colors.length;
      
      return {
        label: eventName,
        data: allDates.map(date => dateCountMap[date]),
        borderColor: colors[colorIndex],
        backgroundColor: colors[colorIndex].replace('rgb', 'rgba').replace(')', ', 0.2)'),
        tension: 0.1
      };
    })
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Events Over Time</h3>
        <div className="h-[400px]">
          {events.length > 0 ? (
            <Line 
              data={eventsChartData} 
              options={{ 
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Event Count'
                    }
                  }
                }
              }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No events data available for the selected date range.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mt-6">
        <h3 className="text-lg font-semibold mb-4">Event Counts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eventNames.map((eventName, index) => {
                const totalCount = eventsByName[eventName].reduce(
                  (sum, row) => sum + parseInt(row.metricValues[0].value), 0
                );
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {totalCount}
                    </td>
                  </tr>
                );
              })}
              {eventNames.length === 0 && (
                <tr>
                  <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                    No events data available for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ButtonClickPanel 
        buttonClickEvents={buttonClickEvents}
        buttonClickView={buttonClickView}
        handleButtonClickViewChange={handleButtonClickViewChange}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedFilters={selectedFilters}
        handleButtonClickFilterChange={handleButtonClickFilterChange}
        setSelectedFilters={setSelectedFilters}
      />
    </>
  );
}
