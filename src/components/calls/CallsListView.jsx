import React, { useState, useEffect, useRef } from 'react';
import { formatUnixTimestamp } from '../../utils/dates';

// Dropdown filter component
function FilterDropdown({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs rounded-md"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--border)',
          color: value ? 'var(--foreground)' : 'var(--muted)',
          border: '1px solid var(--border)'
        }}
      >
        <span>{value ? options.find(o => o.value === value)?.label || value : placeholder}</span>
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 rounded-md shadow-lg"
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
            minWidth: '180px'
          }}
        >
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-xs rounded-md mb-2"
              style={{
                background: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)'
              }}
              autoFocus
            />
            
            <div className="max-h-60 overflow-auto">
              <div 
                className="px-3 py-2 text-xs cursor-pointer hover:bg-opacity-10 hover:bg-gray-500"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                Clear filter
              </div>
              
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-3 py-2 text-xs cursor-pointer hover:bg-opacity-10 hover:bg-gray-500"
                  style={{
                    background: value === option.value ? 'var(--primary-background)' : 'transparent',
                    color: value === option.value ? 'var(--primary)' : 'var(--foreground)'
                  }}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))}
              
              {filteredOptions.length === 0 && (
                <div className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                  No options found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CallsListView({
  callsData,
  sorting,
  pagination,
  filters,
  onSort,
  onFilter,
  onPageChange
}) {
  const [showAnsweredOnly, setShowAnsweredOnly] = useState(false);
  
  // Extract unique values for filter dropdowns
  const [filterOptions, setFilterOptions] = useState({
    direction: [],
    user: [],
    raw_digits: [],
    recording: []
  });
  
  // Toggle answered calls filter
  const toggleAnsweredFilter = () => {
    const newState = !showAnsweredOnly;
    setShowAnsweredOnly(newState);
    onFilter('answered', newState ? 'yes' : '');
  };
  
  // Update filter options when data changes
  useEffect(() => {
    if (!callsData?.calls) return;
    
    const options = {
      direction: new Set(),
      user: new Set(),
      raw_digits: new Set(),
      recording: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    };
    
    callsData.calls.forEach(call => {
      if (call.direction) options.direction.add(call.direction);
      if (call.raw_digits) options.raw_digits.add(call.raw_digits);
      if (call.user?.name) options.user.add(JSON.stringify({ id: call.user.id, name: call.user.name }));
    });
    
    setFilterOptions({
      direction: Array.from(options.direction).map(value => ({ value, label: value })),
      raw_digits: Array.from(options.raw_digits).map(value => ({ value, label: value })),
      user: Array.from(options.user).map(userJson => {
        const user = JSON.parse(userJson);
        return { value: user.id, label: user.name };
      }),
      recording: options.recording
    });
  }, [callsData]);
  return (
    <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
      <div className="mb-4">
        <button
          onClick={toggleAnsweredFilter}
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: showAnsweredOnly ? 'var(--primary)' : 'var(--background)',
            color: showAnsweredOnly ? 'white' : 'var(--muted)',
            border: '1px solid var(--border)'
          }}
        >
          {showAnsweredOnly ? 'Show all calls' : 'Show answered calls only'}
        </button>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
          <thead style={{ background: 'var(--muted-background)' }}>
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                style={{ color: 'var(--muted)' }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center" onClick={() => onSort('started_at')}>
                    Date/Time {sorting.order_by === 'started_at' && (sorting.order === 'desc' ? '▼' : '▲')}
                  </div>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <div className="flex flex-col gap-2">
                  <span>Direction</span>
                  <FilterDropdown 
                    options={filterOptions.direction}
                    value={filters.direction}
                    onChange={(value) => onFilter('direction', value)}
                    placeholder="Filter direction"
                  />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" 
                style={{ color: 'var(--muted)' }}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center" onClick={() => onSort('duration')}>
                    Duration {sorting.order_by === 'duration' && (sorting.order === 'desc' ? '▼' : '▲')}
                  </div>
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <div className="flex flex-col gap-2">
                  <span>Phone</span>
                  <FilterDropdown 
                    options={filterOptions.raw_digits}
                    value={filters.raw_digits}
                    onChange={(value) => onFilter('raw_digits', value)}
                    placeholder="Filter phone"
                  />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <div className="flex flex-col gap-2">
                  <span>User</span>
                  <FilterDropdown 
                    options={filterOptions.user}
                    value={filters.user_id}
                    onChange={(value) => onFilter('user_id', value)}
                    placeholder="Filter user"
                  />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                <div className="flex flex-col gap-2">
                  <span>Recording</span>
                  <FilterDropdown 
                    options={filterOptions.recording}
                    value={filters.recording}
                    onChange={(value) => onFilter('recording', value)}
                    placeholder="Has recording"
                  />
                </div>
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
