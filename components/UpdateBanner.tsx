import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowRight
} from 'lucide-react';
import {
  VersionInfo,
  APP_VERSION,
  isNativeAndroid,
  downloadAndInstallApk,
  canInstallUnknownApps,
  openInstallPermissionSettings,
  retryInstallApk,
  DownloadProgressEvent,
} from '../utils/version';
import { useHaptics } from '../hooks/useHaptics';
import { AppSettings } from '../types';

interface Props {
  updateInfo: VersionInfo;
  activeTheme?: any;
  settings?: AppSettings;
  onDismiss: () => void;
}

type InstallState = 'idle' | 'permission_needed' | 'downloading' | 'installing' | 'completed' | 'error';

const UpdateBanner: React.FC<Props> = ({ updateInfo, activeTheme, settings, onDismiss }) => {
  const haptic = useHaptics();
  const [isExpanded, setIsExpanded] = useState(false);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [progress, setProgress] = useState(0);
  const [bytesDownloaded, setBytesDownloaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isForced = !!updateInfo.isForced;
  const isAndroid = isNativeAndroid();

  const themeHex = activeTheme?.hex || '#10B981';
  const isOled = settings?.baseColor === 'oled';
  const cardBg = isOled ? 'rgba(10, 10, 12, 0.96)' : 'rgba(24, 24, 27, 0.95)';
  const cardBorder = isOled ? '0.5px solid rgba(255, 255, 255, 0.12)' : '0.5px solid rgba(255, 255, 255, 0.1)';
  const radiusVal = settings?.cornerRadius === 'sharp' ? 12 : settings?.cornerRadius === 'round' ? 20 : 28;

  // Resolved direct APK URL
  const apkDownloadUrl =
    updateInfo.apkUrl ||
    (updateInfo.downloadUrl && updateInfo.downloadUrl.endsWith('.apk')
      ? updateInfo.downloadUrl
      : `https://github.com/Abhi10112006/Ledger-/releases/download/v${updateInfo.version}/app-release.apk`);

  const handle1TapInstall = async () => {
    haptic('medium');

    // If web browser, open direct download link
    if (!isAndroid) {
      window.open(updateInfo.downloadUrl || apkDownloadUrl, '_blank');
      return;
    }

    // Check install permission for Android 8.0+
    const hasPermission = await canInstallUnknownApps();
    if (!hasPermission) {
      setInstallState('permission_needed');
      return;
    }

    startDownloadFlow();
  };

  const startDownloadFlow = async () => {
    setInstallState('downloading');
    setProgress(0);
    setStatusMessage('Connecting to update server...');
    setErrorMessage('');

    const res = await downloadAndInstallApk(
      apkDownloadUrl,
      updateInfo.version,
      (event: DownloadProgressEvent) => {
        if (event.status === 'downloading') {
          setProgress(Math.max(0, Math.min(100, event.progress)));
          if (event.bytesDownloaded) setBytesDownloaded(event.bytesDownloaded);
          if (event.totalBytes) setTotalBytes(event.totalBytes);
          setStatusMessage(`Downloading update (${event.progress}%)...`);
        } else if (event.status === 'installing') {
          setProgress(100);
          setInstallState('installing');
          setStatusMessage('Launching package installer...');
        } else if (event.status === 'error') {
          setInstallState('error');
          setErrorMessage(event.error || 'Failed to download update package.');
        }
      }
    );

    if (res.success) {
      setInstallState('completed');
      setStatusMessage('Installer opened. Tap below if needed.');
    } else {
      setInstallState('error');
      setErrorMessage(res.error || 'Update process could not complete.');
    }
  };

  const handleGrantPermission = async () => {
    haptic('selection');
    await openInstallPermissionSettings();
    setInstallState('idle');
  };

  const handleRetryInstall = async () => {
    haptic('selection');
    const success = await retryInstallApk(updateInfo.version);
    if (!success) {
      startDownloadFlow();
    }
  };

  const handleOpenBrowser = () => {
    haptic('light');
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  const handleDismiss = () => {
    haptic('light');
    onDismiss();
  };

  const handleToggleChangelog = () => {
    haptic('selection');
    setIsExpanded((p) => !p);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 3500,
          padding: '0 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 440,
            margin: '0 auto',
            background: cardBg,
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: cardBorder,
            borderRadius: radiusVal,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)',
            padding: '18px 20px',
            color: '#FFFFFF',
            position: 'relative',
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        >
          {/* Subtle top ambient glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: 100,
              background: `radial-gradient(ellipse at top center, ${themeHex}22 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              {/* Apple Squircle Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${themeHex}28 0%, ${themeHex}10 100%)`,
                  border: `1px solid ${themeHex}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: themeHex,
                  flexShrink: 0,
                  boxShadow: `0 4px 16px -2px ${themeHex}30`,
                }}
              >
                {installState === 'completed' ? (
                  <CheckCircle2 size={22} style={{ color: '#10B981' }} />
                ) : installState === 'error' ? (
                  <AlertCircle size={22} style={{ color: '#EF4444' }} />
                ) : installState === 'downloading' || installState === 'installing' ? (
                  <Loader2 size={22} className="animate-spin" style={{ color: themeHex }} />
                ) : (
                  <Sparkles size={22} />
                )}
              </div>

              {/* Version & Subtitle */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: themeHex,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 7px',
                      borderRadius: 6,
                      background: `${themeHex}20`,
                    }}
                  >
                    {installState === 'downloading'
                      ? 'Downloading'
                      : installState === 'installing'
                      ? 'Installing'
                      : installState === 'completed'
                      ? 'Ready'
                      : 'Update Available'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    marginTop: 3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
                  }}
                >
                  v{updateInfo.version}
                  {updateInfo.versionName ? ` — ${updateInfo.versionName}` : ''}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(235, 235, 245, 0.45)', marginTop: 1 }}>
                  Current version: v{APP_VERSION}
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            {!isForced && installState !== 'downloading' && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={handleDismiss}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(235, 235, 245, 0.6)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </motion.button>
            )}
          </div>

          {/* Download Progress Bar Section */}
          {installState === 'downloading' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginTop: 14, position: 'relative', zIndex: 1 }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 14,
                  border: '0.5px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: 'rgba(235, 235, 245, 0.85)', fontWeight: 500 }}>{statusMessage}</span>
                  <span style={{ color: themeHex, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
                </div>
                {/* Pill Track */}
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 999, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.2 }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${themeHex} 0%, ${themeHex}CC 100%)`,
                      borderRadius: 999,
                      boxShadow: `0 0 10px ${themeHex}60`,
                    }}
                  />
                </div>
                {totalBytes > 0 && (
                  <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(235, 235, 245, 0.45)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{(bytesDownloaded / (1024 * 1024)).toFixed(1)} MB / {(totalBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    <span>Direct In-App Install</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Installing Status Bar */}
          {installState === 'installing' && (
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                borderRadius: 14,
                border: '0.5px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <RefreshCw size={16} className="text-emerald-400 animate-spin flex-shrink-0" />
              <div style={{ fontSize: 12.5, color: '#FFFFFF', fontWeight: 500 }}>
                Launching Android Package Installer... Confirm prompt on screen.
              </div>
            </div>
          )}

          {/* Permission Needed Prompt */}
          {installState === 'permission_needed' && (
            <div
              style={{
                marginTop: 14,
                padding: '14px',
                background: 'rgba(245, 158, 11, 0.12)',
                borderRadius: 16,
                border: '0.5px solid rgba(245, 158, 11, 0.25)',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ShieldCheck size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FBBF24' }}>Allow Direct Updates</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(235, 235, 245, 0.75)', marginTop: 3, lineHeight: 1.4 }}>
                    To install updates directly, toggle on "Allow from this source" in Android settings.
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGrantPermission}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    background: '#F59E0B',
                    color: '#000000',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open Android Settings
                </motion.button>
                <button
                  type="button"
                  onClick={() => setInstallState('idle')}
                  style={{
                    padding: '0 12px',
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(235, 235, 245, 0.75)',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {installState === 'error' && (
            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: 'rgba(239, 68, 68, 0.12)',
                borderRadius: 14,
                border: '0.5px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div style={{ fontSize: 12, color: '#FECDD3', lineHeight: 1.4 }}>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Changelog Toggle */}
          {updateInfo.changelog && updateInfo.changelog.length > 0 && installState !== 'downloading' && (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <button
                type="button"
                onClick={handleToggleChangelog}
                style={{
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(235, 235, 245, 0.6)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>What's new in this release</span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      margin: '10px 0 0 0',
                      paddingLeft: 18,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                    }}
                  >
                    {updateInfo.changelog.map((item, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.8)', lineHeight: 1.4 }}>
                        {item}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
            {installState === 'idle' && (
              <>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handle1TapInstall}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${themeHex} 0%, ${themeHex}EE 100%)`,
                    color: '#000000',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px -2px ${themeHex}60`,
                  }}
                >
                  <Download size={16} />
                  <span>1-Tap Install</span>
                </motion.button>

                {!isForced && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    style={{
                      padding: '0 16px',
                      height: 44,
                      borderRadius: 14,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(235, 235, 245, 0.8)',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Later
                  </motion.button>
                )}
              </>
            )}

            {installState === 'completed' && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRetryInstall}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 14,
                  background: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px -2px rgba(16, 185, 129, 0.5)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Re-Open Installer</span>
              </motion.button>
            )}

            {installState === 'error' && (
              <>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={startDownloadFlow}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 14,
                    background: '#FFFFFF',
                    color: '#000000',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Retry Download</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenBrowser}
                  style={{
                    padding: '0 14px',
                    height: 44,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(235, 235, 245, 0.85)',
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Browser</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateBanner;
