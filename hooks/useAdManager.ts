
import { useState, useEffect, useCallback } from 'react';
import { AdContent, SPONSORED_CONTENT } from '../data/sponsoredContent';

const AD_STORAGE_KEY = 'abhi_ledger_ad_impressions_v1';
const GLOBAL_COOLDOWN_MINUTES = 30; // Don't show ANY ad if one was shown < 30 mins ago

interface AdState {
  lastGlobalImpression: number; // Timestamp
  impressions: Record<string, {
    count: number;
    lastShown: number;
  }>;
}

export const useAdManager = (isLoggedIn: boolean) => {
  const [currentAd, setCurrentAd] = useState<AdContent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load State
  const getAdState = (): AdState => {
    try {
      const saved = localStorage.getItem(AD_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { lastGlobalImpression: 0, impressions: {} };
    } catch {
      return { lastGlobalImpression: 0, impressions: {} };
    }
  };

  const saveAdState = (state: AdState) => {
    localStorage.setItem(AD_STORAGE_KEY, JSON.stringify(state));
  };

  const checkEligibility = useCallback(() => {
    if (!isLoggedIn) return;

    // 1. Check Global Cooldown
    const state = getAdState();
    const now = Date.now();
    const timeSinceLastAd = (now - state.lastGlobalImpression) / (1000 * 60);

    if (timeSinceLastAd < GLOBAL_COOLDOWN_MINUTES) {
      // console.log("Ad Blocked: Global Cooldown active");
      return;
    }

    // 2. Filter Candidate Ads
    const candidates = SPONSORED_CONTENT.filter(ad => {
      if (!ad.isActive) return false;
      
      // Check Expiry
      if (ad.expiresAt && new Date(ad.expiresAt).getTime() < now) return false;

      const history = state.impressions[ad.id] || { count: 0, lastShown: 0 };
      
      // Check Frequency Rules
      if (ad.frequency === 'once_session') {
         // Session logic is handled by React state (isOpen), checking strict persistence here implies "session" = "short time window"
         // Actually, let's treat 'once_session' as "don't show if shown in last 1 hour" for persistence sake
         if (now - history.lastShown < 1000 * 60 * 60) return false;
      }
      if (ad.frequency === 'once_daily') {
         if (now - history.lastShown < 1000 * 60 * 60 * 24) return false;
      }
      if (ad.frequency === 'once_weekly') {
         if (now - history.lastShown < 1000 * 60 * 60 * 24 * 7) return false;
      }

      return true;
    });

    if (candidates.length === 0) return;

    // 3. Weighted Lottery Selection
    // Ads with higher 'weight' have higher chance of appearing
    const totalWeight = candidates.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    let selectedAd = candidates[0];
    for (const ad of candidates) {
      const w = ad.weight || 1;
      if (random < w) {
        selectedAd = ad;
        break;
      }
      random -= w;
    }

    // 4. Trigger Ad
    setCurrentAd(selectedAd);
    
    // Delay slightly to not jar the user immediately on load
    setTimeout(() => {
        setIsOpen(true);
        recordImpression(selectedAd.id);
    }, 2000);

  }, [isLoggedIn]);

  const recordImpression = (adId: string) => {
    const state = getAdState();
    const now = Date.now();

    const history = state.impressions[adId] || { count: 0, lastShown: 0 };
    
    const newState: AdState = {
      lastGlobalImpression: now,
      impressions: {
        ...state.impressions,
        [adId]: {
          count: history.count + 1,
          lastShown: now
        }
      }
    };
    saveAdState(newState);
  };

  const closeAd = () => {
    setIsOpen(false);
    // Optional: Clear current ad after animation
    setTimeout(() => setCurrentAd(null), 500);
  };

  return {
    currentAd,
    isAdOpen: isOpen,
    closeAd,
    checkEligibility
  };
};
