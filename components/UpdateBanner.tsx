import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
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

interface Props {
  updateInfo: VersionInfo;
  activeTheme?: any;
  onDismiss: () => void;
}

type InstallState = 'idle' | 'permission_needed' | 'downloading' | 'installing' | 'completed' | 'error';

const UpdateBanner: React.FC<Props> = ({ updateInfo, onDismiss }) => {
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

  // Resolved direct APK URL
  const apkDownloadUrl =
    updateInfo.apkUrl ||
    (updateInfo.downloadUrl && updateInfo.downloadUrl.endsWith('.apk')
      ? updateInfo.downloadUrl
      : `https://github.com/Abhi10112006/Ledger-/releases/download/v${updateInfo.version}/app-release.apk`);

  const handle1TapInstall = async () => {
    haptic('success');

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
    setStatusMessage('Connecting to release server...');
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
          setErrorMessage(event.error || 'Failed to download APK package.');
        }
      }
    );

    if (res.success) {
      setInstallState('completed');
      setStatusMessage('Prompting system installer. Tap below if needed.');
    } else {
      setInstallState('error');
      setErrorMessage(res.error || 'Update process could not complete.');
    }
  };

  const handleGrantPermission = async () => {
    haptic('selection');
    await openInstallPermissionSettings();
    // After user returns from settings, resume download flow
    setInstallState('idle');
  };

  const handleRetryInstall = async () => {
    haptic('selection');
    const success = await retryInstallApk(updateInfo.version);
    if (!success) {
      // Re-download if file missing
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
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.5 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          padding: '0 16px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 440,
            margin: '0 auto',
            background: 'rgba(28, 28, 30, 0.96)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '0.5px solid rgba(255, 255, 255, 0.16)',
            borderRadius: 24,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
            padding: 20,
            color: '#FFFFFF',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)',
                  border: '1px solid rgba(10, 132, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0A84FF',
                  flexShrink: 0,
                }}
              >
                {installState === 'completed' ? (
                  <CheckCircle2 size={22} className="text-emerald-400" />
                ) : installState === 'error' ? (
                  <AlertCircle size={22} className="text-rose-400" />
                ) : installState === 'downloading' || installState === 'installing' ? (
                  <DownloadCloud size={22} className="text-blue-400 animate-pulse" />
                ) : (
                  <Sparkles size={22} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {installState === 'downloading' ? 'Downloading Update' : installState === 'installing' ? 'Ready to Install' : '1-Tap Update Ready'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  v{updateInfo.version} — {updateInfo.versionName}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.55)', marginTop: 1 }}>
                  Current version: v{APP_VERSION}
                </div>
              </div>
            </div>

            {!isForced && installState !== 'downloading' && (
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
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
                <X size={14} />
              </button>
            )}
          </div>

          {/* Download Progress Bar Section */}
          {installState === 'downloading' && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
                <span style={{ color: 'rgba(235, 235, 245, 0.9)', fontWeight: 600 }}>{statusMessage}</span>
                <span style={{ color: '#0A84FF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 999, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #0A84FF 0%, #10B981 100%)',
                    borderRadius: 999,
                  }}
                />
              </div>
              {totalBytes > 0 && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(235, 235, 245, 0.5)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{(bytesDownloaded / (1024 * 1024)).toFixed(1)} MB / {(totalBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>Direct In-App Install</span>
                </div>
              )}
            </div>
          )}

          {/* Installing Status Bar */}
          {installState === 'installing' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: 14, border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RefreshCw size={16} className="text-emerald-400 animate-spin flex-shrink-0" />
              <div style={{ fontSize: 12, color: 'rgba(235, 235, 245, 0.9)', fontWeight: 500 }}>
                Launching Android Package Installer... Confirm prompt on screen.
              </div>
            </div>
          )}

          {/* Permission Needed Prompt */}
          {installState === 'permission_needed' && (
            <div style={{ marginTop: 14, padding: '14px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ShieldCheck size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FBBF24' }}>Unknown App Permission Required</div>
                  <div style={{ fontSize: 11, color: 'rgba(235, 235, 245, 0.75)', marginTop: 3, lineHeight: 1.4 }}>
                    To install updates directly without an app store, toggle on "Allow from this source" in Android settings.
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
                    fontSize: 12,
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
                    color: 'rgba(235, 235, 245, 0.8)',
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
            <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(244, 63, 94, 0.12)', borderRadius: 14, border: '1px solid rgba(244, 63, 94, 0.25)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div style={{ fontSize: 11, color: '#FECDD3', lineHeight: 1.4 }}>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Changelog Toggle */}
          {updateInfo.changelog && updateInfo.changelog.length > 0 && installState !== 'downloading' && (
            <>
              <button
                type="button"
                onClick={handleToggleChangelog}
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgba(235, 235, 245, 0.65)',
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
            </>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            {installState === 'idle' && (
              <>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handle1TapInstall}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(10, 132, 255, 0.35)',
                  }}
                >
                  <DownloadCloud size={18} />
                  <span>1-Tap Direct Install</span>
                </motion.button>

                {!isForced && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    style={{
                      padding: '0 16px',
                      height: 46,
                      borderRadius: 14,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'rgba(235, 235, 245, 0.85)',
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
                  height: 46,
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
                }}
              >
                <CheckCircle2 size={18} />
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
                    height: 46,
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
                    height: 46,
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(235, 235, 245, 0.85)',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
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
