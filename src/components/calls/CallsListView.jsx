import React from 'react';
import { formatUnixTimestamp } from '../../utils/dates';

export function CallsListView({
  callsData,
  sorting,
  pagination,
  filters,
  onSort,
  onPageChange
}) {
  return (
    <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead style={{ background: 'var(--muted-background)' }}>
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                style={{ color: 'var(--muted)' }}
                onClick={() => onSort('started_at')}
              >
                Date/Time {sorting.order_by === 'started_at' && (sorting.order === 'desc' ? '▼' : '▲')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Direction
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                style={{ color: 'var(--muted)' }}
                onClick={() => onSort('duration')}
              >
                Duration {sorting.order_by === 'duration' && (sorting.order === 'desc' ? '▼' : '▲')}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Recording
              </th>
            </tr>
          </thead>
          <tbody style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="divide-y">
            {callsData?.calls.map((call) => (
              <tr key={call.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                  {formatUnixTimestamp(call.started_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span style={{
                    background: call.direction === 'inbound' ? 'var(--success-background)' : 'var(--primary-background)',
                    color: call.direction === 'inbound' ? 'var(--success)' : 'var(--primary)'
                  }} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {call.direction}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span style={{
                    background: call.status === 'done' ? 'var(--success-background)' : 'var(--warning-background)',
                    color: call.status === 'done' ? 'var(--success)' : 'var(--warning)'
                  }} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {call.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                  {call.duration}s
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                  {call.raw_digits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                  {call.user?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {call.recording && (
                    <a
                      href={call.recording}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                      style={{ color: 'var(--primary)' }}
                    >
                      Listen
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {callsData?.meta && (
        <div style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="px-4 py-3 border-t sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              Showing <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                {((pagination.page - 1) * pagination.per_page) + 1} - {Math.min(pagination.page * pagination.per_page, callsData.meta.total)}
              </span> of{' '}
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{callsData.meta.total}</span> calls
              {filters.direction && <span className="ml-1">(filtered by {filters.direction})</span>}
              {filters.status && <span className="ml-1">(filtered by {filters.status})</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-md text-sm"
                style={{
                  background: 'var(--background)',
                  color: pagination.page === 1 ? 'var(--muted)' : 'var(--primary)',
                  borderColor: 'var(--border)',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                Page {pagination.page}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page * pagination.per_page >= callsData.meta.total}
                className="px-3 py-1 rounded-md text-sm"
                style={{
                  background: 'var(--background)',
                  color: pagination.page * pagination.per_page >= callsData.meta.total ? 'var(--muted)' : 'var(--primary)',
                  borderColor: 'var(--border)',
                  cursor: pagination.page * pagination.per_page >= callsData.meta.total ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
