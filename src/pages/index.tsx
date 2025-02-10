// src/pages/index.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';

interface Week {
  id: string;
  label: string;
  screenshots: string[];
}

interface ExpandedImage {
  src: string;
  alt: string;
}

export default function Home() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const fetchWeeks = async () => {
    try {
      const response = await fetch('/api/weeks');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch weeks');
      }
      setWeeks(data.weeks);
      
      // Set initial selected week if not already set
      if (!selectedWeek && data.weeks.length > 0) {
        setSelectedWeek(data.weeks[0].id);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weeks. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching weeks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWeeks();
  }, []);

  // Poll for updates every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchWeeks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null);

  const selectedWeekData = weeks.find(week => week.id === selectedWeek);

  const handleImageClick = (src: string, alt: string) => {
    setExpandedImage({ src, alt });
  };

  const handleCloseExpanded = () => {
    setExpandedImage(null);
  };

  return (
    <>
      <Head>
        <title>Email Campaign Analytics</title>
        <meta name="description" content="View email campaign analytics by week" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {error && (
          <div className="max-w-6xl mx-auto px-8 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          </div>
        )}
        
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Email Campaign Analytics
          </h1>
          
          {/* Week Selector */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-200 rounded w-[300px]"></div>
            ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Week
              </h2>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full md:w-[300px] px-4 py-2 border border-gray-300 rounded-md text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || weeks.length === 0}
              >
                <option value="" disabled>
                  {weeks.length === 0 ? 'No weeks available' : 'Select a week'}
                </option>
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {week.label}
                </option>
              ))}
              </select>
            </>
            )}
          </div>

          {/* Screenshots Display */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-[400px] bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ) : selectedWeekData && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Analytics Screenshots - {selectedWeekData.label}
              </h2>
              <div className="space-y-8">
                {selectedWeekData.screenshots.map((screenshot: string, index: number) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleImageClick(
                      screenshot,
                      `Analytics screenshot ${index + 1} for ${selectedWeekData.label}`
                    )}
                  >
                    <Image
                      src={screenshot}
                      alt={`Analytics screenshot ${index + 1} for ${selectedWeekData.label}`}
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                      priority={index === 0}
                      unoptimized={true}
                      onError={() => {
                        console.error(`Failed to load image: ${screenshot}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-2"
          onClick={handleCloseExpanded}
        >
          <div className="relative w-[90vw] mx-auto">
            <button
              onClick={handleCloseExpanded}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={expandedImage.src}
              alt={expandedImage.alt}
              width={2560}
              height={1440}
              className="w-full h-auto"
              unoptimized={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
