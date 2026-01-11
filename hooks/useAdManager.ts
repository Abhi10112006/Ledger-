
import { useState, useCallback } from 'react';
import { AdContent, SPONSORED_CONTENT } from '../data/sponsoredContent';
import { getMeta, saveMeta } from '../utils/db';

const AD_KEY = 'abhi_ledger_ad_impressions_v1';
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

  const checkEligibility = useCallback(async () => {
    if (!isLoggedIn) return;

    // 1. Check Global Cooldown
    const state = await getMeta<AdState>(AD_KEY) || { lastGlobalImpression: 0, impressions: {} };
    const now = Date.now();
    const timeSinceLastAd = (now - state.lastGlobalImpression) / (1000 * 60);

    if (timeSinceLastAd < GLOBAL_COOLDOWN_MINUTES) {
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
        recordImpression(selectedAd.id, state);
    }, 2000);

  }, [isLoggedIn]);

  const recordImpression = async (adId: string, currentState: AdState) => {
    const now = Date.now();

    const history = currentState.impressions[adId] || { count: 0, lastShown: 0 };
    
    const newState: AdState = {
      lastGlobalImpression: now,
      impressions: {
        ...currentState.impressions,
        [adId]: {
          count: history.count + 1,
          lastShown: now
        }
      }
    };
    await saveMeta(AD_KEY, newState);
  };

  const closeAd = () => {
    setIsOpen(false);
    setTimeout(() => setCurrentAd(null), 500);
  };

  return {
    currentAd,
    isAdOpen: isOpen,
    closeAd,
    checkEligibility
  };
};
