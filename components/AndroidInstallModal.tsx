
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ShieldCheck, Download, Terminal, Shield } from 'lucide-react';

interface AndroidInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AndroidInstallModal({ isOpen, onClose }: AndroidInstallModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Removed handleDownload function in favor of direct <a> tag for better compatibility

    if (!mounted) return null;

    // Cyberpunk/Hacker Theme Classes
    const styles = {
        overlay: "fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm", // z-10001 to beat Blocker's 9999
        modal: "relative w-full max-w-lg bg-black border border-red-600 rounded-lg shadow-[0_0_40px_rgba(220,38,38,0.3)] overflow-hidden max-h-[90vh] flex flex-col font-mono",
        header: "p-5 border-b border-red-900/50 flex justify-between items-center bg-red-950/10",
        title: "text-lg font-bold text-red-500 flex items-center gap-3 tracking-widest uppercase",
        closeBtn: "p-2 hover:bg-red-900/20 rounded-md transition-colors text-red-500/70 hover:text-red-500",
        content: "flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide",
        stepContainer: "relative pl-8 border-l border-red-900/50 pb-2",
        stepDot: "absolute -left-[5px] top-0 w-2.5 h-2.5 bg-red-600 shadow-[0_0_10px_red]",
        stepTitle: "text-base font-bold text-red-400 mb-2 uppercase tracking-wider",
        text: "text-xs text-red-300/80 leading-relaxed font-sans",
        highlight: "text-white font-bold",
        warnBox: "bg-red-900/10 border border-red-500/30 p-4 rounded mt-2 mb-4",
        imgContainer: "relative w-full rounded border border-red-900/30 bg-black mt-3 overflow-hidden bg-grid-red-900/20",
        img: "w-full h-auto object-contain opacity-90",
        footer: "p-5 border-t border-red-900/50 bg-red-950/10 flex flex-col gap-3"
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className={styles.overlay}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <div>
                                <h2 className={styles.title}>
                                    <Terminal className="w-5 h-5" />
                                    INSTALL_PROTOCOL
                                </h2>
                                <p className="text-[9px] text-red-600 mt-1 uppercase tracking-[0.2em] animate-pulse">
                                    // SECURITY OVERRIDE REQUIRED
                                </p>
                            </div>
                            <button onClick={onClose} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className={styles.content}>

                            {/* Step 1 */}
                            <div className={styles.stepContainer}>
                                <div className={styles.stepDot} />
                                <h3 className={styles.stepTitle}>1. Download & Trust</h3>
                                <div className={styles.warnBox}>
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                        <div className="space-y-1">
                                            <p className={styles.text}>
                                                Browser Warning: <span className={styles.highlight}>"File might be harmful"</span>
                                            </p>
                                            <p className={styles.text}>
                                                Reason: This is a direct APK download, not from the Play Store matrix.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pl-7">
                                        <p className="text-[10px] text-red-200 uppercase font-bold tracking-wider">
                                            ACTION: TAP "DOWNLOAD ANYWAY" or "KEEP"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className={styles.stepContainer}>
                                <div className={styles.stepDot} />
                                <h3 className={styles.stepTitle}>2. Open & Install</h3>
                                <p className={styles.text}>
                                    Go to your <strong>File Manager</strong> or <strong>Downloads</strong>. Locate <span className="text-red-400 font-mono">Ledger.apk</span> and tap to open it. Click <strong className="text-white">Install</strong> when asked.
                                </p>
                                <div className={styles.imgContainer}>
                                    <img 
                                        src="/install-guide/play-protect-scan.jpg" 
                                        alt="Step 2: Install Prompt"
                                        className={styles.img}
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className={styles.stepContainer}>
                                <div className={styles.stepDot} />
                                <h3 className={styles.stepTitle}>3. Play Protect Scan</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <Shield className="text-red-500 shrink-0 mt-0.5" size={18} />
                                        <p className={styles.text}>
                                            Google Play Protect might ask to scan the app since it is unknown to their servers.
                                        </p>
                                    </div>
                                    <p className="text-xs text-red-200 font-bold pl-8 border-l-2 border-red-600 ml-1">
                                        Click <span className="text-white underline decoration-red-500">Scan app</span> to verify safety.<br />
                                        <span className="text-[10px] text-red-400 font-normal mt-1 block opacity-70">
                                            Or click "Install without scanning" to skip.
                                        </span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={styles.imgContainer}>
                                            <img src="/install-guide/play-protect-details.jpg" alt="Scan Details" className={styles.img} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                        <div className={styles.imgContainer}>
                                            <img src="/install-guide/play-protect-safe.jpg" alt="Safe to Install" className={styles.img} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className={styles.stepContainer}>
                                <div className={styles.stepDot} />
                                <h3 className={styles.stepTitle}>4. Verified Safe & Install</h3>
                                <p className={styles.text}>
                                    After scanning, you will see a confirmation that the app is safe. Tap <strong className="text-white">Install</strong> to initialize the system.
                                </p>
                                <div className={styles.imgContainer}>
                                    <img src="/install-guide/install-prompt.jpg" alt="Install Success" className={styles.img} onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            </div>

                        </div>

                        {/* Footer */}
                        <div className={styles.footer}>
                            <a
                                href="/ledger.apk"
                                download="Ledger.apk"
                                className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-500 text-black rounded-sm font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] group no-underline"
                            >
                                <Download size={18} className="group-hover:animate-bounce" />
                                Initialize Download
                            </a>
                            <button
                                onClick={onClose}
                                className="w-full py-2 bg-transparent hover:bg-red-900/20 text-red-500/60 hover:text-red-400 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-colors"
                            >
                                Close Terminal
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
