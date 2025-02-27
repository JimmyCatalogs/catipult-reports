import React, { useState, useEffect } from 'react';
import { QuickMailAPI } from '../../utils/quickmail-api';
import { EmailsTab } from './EmailsTab';

export function EmailsContainer() {
  const [activeEmailsView, setActiveEmailsView] = useState('api');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [campaignDataSets, setCampaignDataSets] = useState({
    last7: null,
    last30: null,
    full: null
  });
  const [repliesData, setRepliesData] = useState(null);

  const fetchAllCampaignData = async (forceRefresh = false) => {
    if (activeEmailsView !== 'api') return;
    
    setRefreshing(true);
    try {
      const client = new QuickMailAPI(
        process.env.NEXT_PUBLIC_QUICKMAIL_API_KEY,
        process.env.NEXT_PUBLIC_QUICKMAIL_CAMPAIGN_ID
      );
      
      const [last7Data, last30Data, fullData] = await Promise.all([
        client.getCampaignDetails(7),
        client.getCampaignDetails(30),
        client.getCampaignDetails(null)
      ]);

      setCampaignDataSets({
        last7: last7Data,
        last30: last30Data,
        full: fullData
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load campaign data. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching campaign data:', err);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch replies data from Google Sheets published XLSX via our proxy
  const fetchRepliesData = async () => {
    if (activeEmailsView !== 'replies') return;
    
    setRefreshing(true);
    try {
      // Use our proxy endpoint with XLSX format
      const proxyUrl = '/api/google-sheets-proxy?format=xlsx';
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      // The proxy now returns JSON directly when using XLSX format
      const data = await response.json();
      
      // Transform the data to match our expected format based on actual column names
      const replies = data.replies.map((row, index) => ({
        id: index.toString(),
        date: row['Timestamp'] || '',
        email: row['Prospect Email'] || '',
        firstName: row['Prospect First Name'] || '',
        lastName: row['Prospect Last Name'] || '',
        title: row['Prospect Title'] || '',
        company: row['Company Name'] || '',
        subject: row['Reply Subject'] || '',
        sentiment: row['Email Sentiment'] || 'neutral',
        content: row['Reply Body'] || '',
        emailSent: row['Email sent'] || '',
        campaign: row['Campaign Name'] || ''
      }));
      
      const formattedData = {
        replies,
        meta: {
          total: replies.length
        }
      };
      
      setRepliesData(formattedData);
      setError(null);
      setInitialLoading(false);
      setRefreshing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load replies data. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching replies data:', err);
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch based on active view
  useEffect(() => {
    if (activeEmailsView === 'api') {
      fetchAllCampaignData();
    } else if (activeEmailsView === 'replies') {
      fetchRepliesData();
    }
  }, [activeEmailsView]);

  return (
    <EmailsTab
      activeEmailsView={activeEmailsView}
      setActiveEmailsView={setActiveEmailsView}
      campaignDataSets={campaignDataSets}
      repliesData={repliesData}
      initialLoading={initialLoading}
      refreshing={refreshing}
      onRefresh={() => {
        if (activeEmailsView === 'api') {
          fetchAllCampaignData(true);
        } else if (activeEmailsView === 'replies') {
          fetchRepliesData();
        }
      }}
      error={error}
    />
  );
}
