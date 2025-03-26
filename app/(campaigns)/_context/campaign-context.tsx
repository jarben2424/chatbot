'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Define campaign state type
export type CampaignState = {
  id?: string;
  name: string;
  campaignType: string;
  status: string;
  selectedOfferIds: string[];
  useAiSegment: boolean;
  selectedSegmentId?: string;
  aiSegmentPrompt?: string;
  audienceSize?: number;
  matchingComplete: boolean;
  matchCount: number;
  integrationType?: string;
  integrationSettings: Record<string, any>;
};

// Initial state
const initialState: CampaignState = {
  name: '',
  campaignType: '',
  status: 'draft',
  selectedOfferIds: [],
  useAiSegment: false,
  matchingComplete: false,
  matchCount: 0,
  integrationSettings: {}
};

// Context type
type CampaignContextType = {
  campaignState: CampaignState;
  updateCampaign: (updates: Partial<CampaignState>) => void;
  resetCampaign: () => void;
  saveCampaign: () => Promise<void>;
  loadCampaign: (id: string) => Promise<void>;
  isLoading: boolean;
};

// Create context
const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// Provider component
export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaignState, setCampaignState] = useState<CampaignState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Extract campaign ID from URL if present (for editing existing campaigns)
  useEffect(() => {
    if (pathname?.includes('/campaigns/edit/')) {
      const campaignId = pathname.split('/').pop();
      if (campaignId) {
        loadCampaign(campaignId);
      }
    }
  }, [pathname]);

  // Update campaign data
  const updateCampaign = useCallback((updates: Partial<CampaignState>) => {
    setCampaignState(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset campaign data
  const resetCampaign = useCallback(() => {
    setCampaignState(initialState);
  }, []);

  // Save campaign
  const saveCampaign = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignState)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save campaign');
      }
      
      const savedCampaign = await response.json();
      setCampaignState(savedCampaign);
      return savedCampaign;
    } catch (error) {
      console.error('Error saving campaign:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [campaignState]);

  // Load campaign by ID
  const loadCampaign = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaigns?id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load campaign');
      }
      
      const campaign = await response.json();
      setCampaignState(campaign);
    } catch (error) {
      console.error('Error loading campaign:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <CampaignContext.Provider value={{ 
      campaignState, 
      updateCampaign, 
      resetCampaign, 
      saveCampaign,
      loadCampaign,
      isLoading
    }}>
      {children}
    </CampaignContext.Provider>
  );
}

// Hook for using the campaign context
export function useCampaignState() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaignState must be used within a CampaignProvider');
  }
  return context;
}
