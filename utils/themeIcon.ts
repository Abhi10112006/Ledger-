import { registerPlugin, Capacitor } from '@capacitor/core';

interface NativeThemeIconPluginInterface {
  changeIcon(options: { theme: string }): Promise<{ success: boolean; activeTheme: string }>;
}

const NativeThemeIcon = registerPlugin<NativeThemeIconPluginInterface>('NativeThemeIcon');

export const updateAppLauncherIcon = async (theme: string) => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeThemeIcon.changeIcon({ theme });
  } catch (err) {
    console.warn('Dynamic launcher icon update skipped or not supported:', err);
  }
};
