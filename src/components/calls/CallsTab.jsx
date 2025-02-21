import React, { useState } from 'react';
import { CallsListView } from './CallsListView';
import { CallsAnalyticsView } from './CallsAnalyticsView';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { LoadingBar } from '../LoadingBar';

export function CallsTab({
  activeCallsView,
  setActiveCallsView,
  callsData,
  callsAnalytics,
  initialLoading,
  refreshing,
  sorting,
  filters,
  pagination,
  dateRange,
  onRefresh,
  onSort,
  onFilter,
  onPageChange,
  onDateChange,
  analyticsProgress,
}) {
  const [datePickerRange, setDatePickerRange] = useState([
    new Date(dateRange.from * 1000),
    new Date(dateRange.to * 1000)
  ]);

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Call Analytics
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveCallsView('list')}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: activeCallsView === 'list' ? 'var(--primary)' : 'var(--background)',
                color: activeCallsView === 'list' ? 'white' : 'var(--muted)'
              }}
            >
              List View
            </button>
            <button
              onClick={() => setActiveCallsView('analytics')}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: activeCallsView === 'analytics' ? 'var(--primary)' : 'var(--background)',
                color: activeCallsView === 'analytics' ? 'white' : 'var(--muted)'
              }}
            >
              Analytics
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              background: 'var(--primary)',
              color: 'white'
            }}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Date Range</label>
            <DatePicker
              selectsRange={true}
              startDate={datePickerRange[0]}
              endDate={datePickerRange[1]}
              onChange={(dates) => {
                setDatePickerRange(dates);
                onDateChange('both', dates);
              }}
              className="rounded-md border px-3 py-2 text-sm"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              dateFormat="MMM d, yyyy"
              isClearable={false}
              showPopperArrow={false}
              placeholderText="Select date range"
            />
          </div>
        </div>
      </div>

      {activeCallsView === 'list' && (
        <div className="mb-4 flex gap-4">
          <select
            value={filters.direction}
            onChange={(e) => onFilter('direction', e.target.value)}
            style={{
              background: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            className="rounded-md shadow-sm text-sm"
          >
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => onFilter('status', e.target.value)}
            style={{
              background: 'var(--background)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            className="rounded-md shadow-sm text-sm"
          >
            <option value="">All Statuses</option>
            <option value="done">Done</option>
            <option value="missed">Missed</option>
            <option value="voicemail">Voicemail</option>
          </select>
        </div>
      )}

      {(initialLoading || refreshing) ? (
        <div className="relative min-h-[400px] flex items-center justify-center">
          <div style={{ background: 'var(--background)' }} className="p-6 rounded-lg shadow-lg w-64">
            <LoadingBar progress={analyticsProgress} height={4} />
            <p className="text-center mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Loading data... {Math.round(analyticsProgress * 100)}%
            </p>
          </div>
        </div>
      ) : activeCallsView === 'list' ? (
        <CallsListView
          callsData={callsData}
          sorting={sorting}
          pagination={pagination}
          filters={filters}
          onSort={onSort}
          onPageChange={onPageChange}
        />
      ) : (
        <CallsAnalyticsView 
          callsAnalytics={callsAnalytics}
          analyticsProgress={analyticsProgress}
        />
      )}
    </>
  );
}
