
export type AdFrequency = 'always' | 'once_session' | 'once_daily' | 'once_weekly';

export interface AdContent {
  id: string;
  title: string;
  message: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  
  // Visuals
  image?: string; 
  video?: string; 
  
  // Logic Engine
  weight: number; // 1 (Low) to 10 (High) - Probability of showing
  frequency: AdFrequency; // How often to show to the same user
  expiresAt?: string; // ISO Date string to auto-disable
}

export const SPONSORED_CONTENT: AdContent[] = [
  {
    id: 'personal_branding_x',
    title: 'Connect on X',
    message: 'Follow the architect behind this system. Updates, tech talks, and cyber aesthetics.',
    buttonText: 'Follow @Abhinav_1289Y',
    link: 'https://x.com/Abhinav_1289Y',
    isActive: true,
    weight: 10,
    frequency: 'once_daily',
    image: 'https://i.ibb.co/MDgtHBfP/Screenshot-20260107-182702-2.jpg'
  },
  {
    id: 'feature_highlight_backup',
    title: 'Secure Your Data',
    message: 'System Reminder: Have you exported your backup lately? Keep your ledger safe.',
    buttonText: 'Backup Now',
    link: '/?action=backup', // Internal action link handled by app
    isActive: true,
    weight: 5,
    frequency: 'once_weekly',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop'
  }
];
