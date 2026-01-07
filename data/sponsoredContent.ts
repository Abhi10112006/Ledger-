
export interface AdContent {
  id: string;
  title: string;
  message: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  image?: string; // Optional: URL to an image
  video?: string; // Optional: URL to a video (Takes precedence over image)
}

/**
 * SPONSORED CONTENT CONFIGURATION
 * --------------------------------
 * Add your advertisement here. 
 * The system will pick the FIRST item in this list that has 'isActive: true'.
 */
export const SPONSORED_CONTENT: AdContent[] = [
  {
    id: 'promo_video_01',
    title: 'Neural Cloud Sync',
    message: 'Data integrity is paramount. Experience seamless, encrypted synchronization between your local ledger and our off-world secure vaults.',
    buttonText: 'Initialize Link',
    link: 'https://example.com/promo',
    isActive: true,
    
    // video: 'https://www.youtube.com/watch?v=g_hZm2b8ZO0', // HIDDEN: Enable for video ads
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop' // Placeholder Tech Image
  },
  {
    id: 'promo_001',
    title: 'Upgrade Your Gear',
    message: 'Unlock the full potential of your financial tracking with our new Neural Cloud Sync. Military-grade encryption for your most sensitive data.',
    buttonText: 'View Offer',
    link: 'https://example.com/promo',
    isActive: false,
    // image: 'https://placehold.co/600x400/1e293b/ffffff?text=AD+SPACE' 
  }
];
