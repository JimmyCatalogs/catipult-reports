import React, { useState, useEffect } from 'react';

// Dropdown filter component (reused from CallsListView)
function FilterDropdown({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef(null);
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
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

// Reply details component to show expanded content
function ReplyDetails({ reply, onClose }) {
  const [showOriginalEmail, setShowOriginalEmail] = useState(false);
  
  return (
    <div className="p-6 space-y-4 w-full" style={{ 
      background: 'var(--muted-background)',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Reply Details</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
          style={{ color: 'var(--muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {!showOriginalEmail ? (
          <button
            onClick={() => setShowOriginalEmail(true)}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              background: 'var(--primary)',
              color: 'white'
            }}
          >
            Show original email
          </button>
        ) : (
          <div>
            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Original Email</h4>
            <div className="p-4 rounded" style={{ 
              background: 'var(--background)', 
              border: '1px solid var(--border)',
              maxHeight: '200px',
              overflow: 'auto',
              maxWidth: '100%',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <p className="text-sm whitespace-pre-wrap break-all" style={{ 
                color: 'var(--foreground)',
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}>
                {reply.emailSent}
              </p>
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Reply Subject</h4>
          <div className="p-4 rounded" style={{ 
            background: 'var(--background)', 
            border: '1px solid var(--border)',
            overflowX: 'hidden'
          }}>
            <p className="text-sm font-medium break-words" style={{ color: 'var(--foreground)' }}>{reply.subject}</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Reply Content</h4>
          <div className="p-4 rounded" style={{ 
            background: 'var(--background)', 
            border: '1px solid var(--border)',
            overflowX: 'hidden'
          }}>
            <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--foreground)' }}>{reply.content}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Campaign</h4>
            <div className="p-2 rounded" style={{ 
              background: 'var(--background)', 
              border: '1px solid var(--border)',
              overflowX: 'hidden'
            }}>
              <p className="text-sm break-words" style={{ color: 'var(--foreground)' }}>{reply.campaign}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>Sentiment</h4>
            <div className="p-2 rounded flex items-center" style={{ 
              background: 'var(--background)', 
              border: '1px solid var(--border)',
              overflowX: 'hidden'
            }}>
              <span style={{
                background: 
                  reply.sentiment === 'positive' ? 'var(--success-background)' : 
                  reply.sentiment === 'negative' ? 'var(--error-background)' : 
                  'var(--primary-background)',
                color: 
                  reply.sentiment === 'positive' ? 'var(--success)' : 
                  reply.sentiment === 'negative' ? 'var(--error)' : 
                  'var(--primary)'
              }} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                {reply.sentiment}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Format date string to a more readable format (month/day/time)
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
}

// Parse date string to Date object for sorting
function parseDate(dateString) {
  if (!dateString) return new Date(0); // Default to epoch start if no date
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date(0) : date;
  } catch (e) {
    console.error('Error parsing date:', e);
    return new Date(0);
  }
}

export function QuickmailRepliesTab({ repliesData, initialLoading, refreshing, onRefresh }) {
  // Extract unique campaign values
  const campaignOptions = repliesData?.replies 
    ? [...new Set(repliesData.replies
        .map(reply => reply.campaign)
        .filter(Boolean) // Remove null/undefined values
      )]
        .map(campaign => ({ value: campaign, label: campaign }))
    : [];
  
  // Set default campaign to first one in the list if available
  const [filters, setFilters] = useState({
    campaign: ''
  });
  
  // Set default campaign when data loads
  useEffect(() => {
    if (campaignOptions.length > 0 && !filters.campaign) {
      setFilters(prev => ({
        ...prev,
        campaign: campaignOptions[0].value
      }));
    }
  }, [repliesData]);
  
  const [expandedReplyId, setExpandedReplyId] = useState(null);
  
  // Handle filter changes
  const handleFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Apply filters and sort by date (most recent first)
  const filteredReplies = repliesData?.replies
    ? repliesData.replies
        .filter(reply => {
          if (filters.campaign && reply.campaign !== filters.campaign) return false;
          return true;
        })
        .sort((a, b) => parseDate(b.date) - parseDate(a.date))
    : [];

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Quickmail Replies Data
          </h2>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Data source: <a 
              href="https://docs.google.com/spreadsheets/d/1pwfLXUF-ijpZSuOE6bQCxdHxCQ4AQWbVpBSymGskvVs/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)' }}
              className="underline hover:opacity-80"
            >
              Google Sheet
            </a>
          </div>
        </div>
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
      </div>

      {(initialLoading || refreshing) ? (
        <div className="space-y-8">
          <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
            <div className="animate-pulse space-y-4">
              <div style={{ background: 'var(--muted-background)' }} className="h-8 rounded w-1/4"></div>
              <div style={{ background: 'var(--muted-background)' }} className="h-[400px] rounded w-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <div className="w-48">
                <FilterDropdown 
                  options={campaignOptions}
                  value={filters.campaign}
                  onChange={(value) => handleFilter('campaign', value)}
                  placeholder="Select campaign"
                />
              </div>
            </div>
          </div>
          <div className="-mx-4 sm:mx-0">
            <table className="w-full divide-y" style={{ borderColor: 'var(--border)' }}>
              <thead style={{ background: 'var(--muted-background)' }}>
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" 
                    style={{ color: 'var(--muted)' }}
                  >
                    <span>Date/Time</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    <span>Email</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    <span>Name</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    <span>Title</span>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    <span>Details</span>
                  </th>
                </tr>
              </thead>
              <tbody style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="divide-y">
                {filteredReplies.map((reply) => (
                  <React.Fragment key={reply.id}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                        {formatDate(reply.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                        {reply.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                        {`${reply.firstName} ${reply.lastName}`}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div className="truncate">{reply.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setExpandedReplyId(expandedReplyId === reply.id ? null : reply.id)}
                          className="p-1 rounded-full hover:bg-opacity-10 hover:bg-gray-500"
                          style={{ color: expandedReplyId === reply.id ? 'var(--primary)' : 'var(--muted)' }}
                          title="View Reply Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expandedReplyId === reply.id && (
                      <tr>
                        <td colSpan="5" className="px-0 py-0">
                          <div className="w-full overflow-x-hidden">
                            <ReplyDetails 
                              reply={reply} 
                              onClose={() => setExpandedReplyId(null)} 
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredReplies.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
                      No replies found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {repliesData?.meta && (
            <div style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="px-4 py-3 border-t sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Showing <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {filteredReplies.length}
                  </span> of{' '}
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>{repliesData.meta.total}</span> replies
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
