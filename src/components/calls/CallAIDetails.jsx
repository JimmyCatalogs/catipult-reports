import React, { useState, useEffect } from 'react';

export function CallAIDetails({ call, aircallClient, onClose, transcription }) {
  const [loading, setLoading] = useState(!transcription);
  const [error, setError] = useState(null);
  const [transcriptionData, setTranscriptionData] = useState(transcription || null);

  useEffect(() => {
    // If transcription is already provided, no need to fetch
    if (transcription) {
      setLoading(false);
      return;
    }
    
    const fetchTranscription = async () => {
      setLoading(true);
      setError(null);
      
      console.log('CallAIDetails - Call data:', call);
      
      try {
        // Fetch only the transcription
        const data = await aircallClient.getCallTranscription(call.id);
        console.log('Transcription Data:', data);
        setTranscriptionData(data);
      } catch (err) {
        console.error('Error fetching transcription:', err);
        setError('Failed to load transcription. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTranscription();
  }, [call.id, aircallClient, transcription]);

  // Render the transcription content
  const renderTranscription = () => {
    const transcription = transcriptionData?.transcription;
    
    if (!transcription) {
      return <p className="text-sm italic" style={{ color: 'var(--muted)' }}>No transcription available</p>;
    }

    return (
      <div className="space-y-4">
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          Language: <span style={{ color: 'var(--foreground)' }}>{transcription.content.language}</span>
        </div>
        
        <div className="space-y-2">
          {transcription.content.utterances.map((utterance, index) => (
            <div key={index} className="p-3 rounded-lg" style={{ 
              background: utterance.participant_type === 'internal' ? 'var(--primary-background)' : 'var(--muted-background)',
              marginLeft: utterance.participant_type === 'internal' ? 'auto' : '0',
              marginRight: utterance.participant_type === 'internal' ? '0' : 'auto',
              maxWidth: '80%'
            }}>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium" style={{ 
                  color: utterance.participant_type === 'internal' ? 'var(--primary)' : 'var(--muted)'
                }}>
                  {utterance.participant_type === 'internal' ? 'Agent' : 'Customer'} 
                  {utterance.user_id ? ` (ID: ${utterance.user_id})` : ''}
                  {utterance.phone_number ? ` (${utterance.phone_number})` : ''}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {formatTime(utterance.start_time)}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>{utterance.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to format time in MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-2 p-4 rounded-lg" style={{ background: 'var(--muted-background)', border: '1px solid var(--border)' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
          Call Transcription
        </h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full"
          style={{ color: 'var(--muted)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg" style={{ background: 'var(--error-background)', color: 'var(--error)' }}>
          {error}
        </div>
      ) : (
        <div className="py-2">
          {renderTranscription()}
        </div>
      )}
    </div>
  );
}
