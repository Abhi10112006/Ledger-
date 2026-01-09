
export interface AdContent {
  id: string;
  title: string;
  message: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  image?: string; // Optional: URL to an image (Displayed if no video is provided)
  video?: string; // Optional: URL to a video (YouTube or MP4). Takes precedence over image.
}

/**
 * ------------------------------------------------------------------
 *  SPONSORSHIP CONTROL PROTOCOL
 * ------------------------------------------------------------------
 * 
 *  HOW TO ADD A NEW ADVERTISEMENT:
 *  1. Add a new object to the `SPONSORED_CONTENT` array below.
 *  2. Set `isActive: true` on the ad you want to display.
 *  3. Ensure only ONE ad is active at a time (The system picks the first active one).
 * 
 *  MEDIA AUTO-DETECTION:
 *  - If you provide a `video` URL, the system prioritizes it.
 *    - Supported Video Formats: YouTube Links (e.g., https://youtu.be/...) or Direct MP4 URLs.
 *  - If `video` is empty/undefined, the system looks for an `image` URL.
 *  - If both are missing, only text is displayed.
 * 
 *  HOW TO REMOVE/DISABLE ADS:
 *  - Simply set `isActive: false` on all items.
 * 
 * ------------------------------------------------------------------
 */

export const SPONSORED_CONTENT: AdContent[] = [
{
    id: 'personal_branding_1',
    title: 'X',
    message: 'Follow me on X (Twitter).',
    buttonText: 'X',
    link: 'https://x.com/Abhinav_1289Y',
    isActive: true, // <--- Toggle this to true/false to show/hide
    
    // CASE 1: VIDEO AD (YouTube Example)
    // video: 'https://www.youtube.com/watch?v=g_hZm2b8ZO0',
    
    // CASE 2: VIDEO AD (Direct MP4 Example) - Takes precedence if uncommented
    // video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',

    // CASE 3: IMAGE AD (Fallback if video is commented out or empty)
    // NOTE: Ensure this is a DIRECT link (ends in .jpg, .png). 
    // If using ImgBB, right-click the image on the site and "Copy Image Address".
    image: 'https://i.ibb.co/MDgtHBfP/Screenshot-20260107-182702-2.jpg'
  },
  {
    id: 'placeholder_ad_02',
    title: 'Cyber Deck Upgrade',
    message: 'Enhance your terminal with the latest hardware implants. Zero latency, infinite storage.',
    buttonText: 'Check Specs',
    link: 'https://example.com/hardware',
    isActive: false,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop' 
  }
];
