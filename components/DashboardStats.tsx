import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, TrendingUp, AlertCircle } from 'lucide-react';
import { SummaryStats, AppSettings } from '../types';
import { motion, useInView } from 'framer-motion';

interface Props {
  stats: SummaryStats;
  settings: AppSettings;
  activeTheme: any;
  tourStep: number;
  onShowActiveDeals: () => void;
}

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const start = 0;
    const end = value;
    const duration = 900;
    const startTime = performance.now();
    let id: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(start + (end - start) * ease));
      if (progress < 1) id = requestAnimationFrame(tick);
    };

    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value, isInView]);

  return <span ref={ref}>{displayValue.toLocaleString('en-IN')}</span>;
};

const DashboardStats: React.FC<Props> = ({ stats, settings, activeTheme, tourStep, onShowActiveDeals }) => {
  const totalVolume = stats.pending + stats.received;
  const recoveryRate = totalVolume > 0 ? Math.round((stats.received / totalVolume) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      id="tour-stats"
      className={`${tourStep === 1 ? `ring-2 ring-offset-2 ring-offset-black rounded-[22px]` : ''}`}
      style={tourStep === 1 ? { ringColor: activeTheme.hex } : {}}
    >
      {/* Main balance card */}
      <div
        style={{
          background: 'var(--app-card-bg, #1C1C1E)',
          borderRadius: 'var(--app-radius-lg, 22px)',
          padding: 'var(--app-card-padding, 20px 20px)',
          border: '0.5px solid var(--app-card-border, rgba(255,255,255,0.06))',
          boxShadow: 'var(--app-card-shadow, 0 2px 16px rgba(0,0,0,0.45))',
          backdropFilter: 'blur(var(--app-glass-blur, 16px))',
          WebkitBackdropFilter: 'blur(var(--app-glass-blur, 16px))',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Accent glow — dynamic intensity */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${activeTheme.hex} 0%, transparent 70%)`,
          opacity: (settings.glowIntensity ?? 0.5) * 0.25,
          pointerEvents: 'none',
        }} />

        {/* Top row: label + recovery indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: 'rgba(235,235,245,0.45)',
            letterSpacing: '-0.01em',
          }}>
            Total Outstanding
          </span>
          {/* Recovery pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 100,
            background: 'rgba(120,120,128,0.16)',
          }}>
            <TrendingUp size={10} style={{ color: 'rgba(235,235,245,0.4)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(235,235,245,0.5)', letterSpacing: '-0.01em' }}>
              {recoveryRate}% recovered
            </span>
          </div>
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 24 }}>
          <span style={{
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em',
            color: activeTheme.hex, lineHeight: 1,
          }}>
            {settings.currency}
          </span>
          <span style={{
            fontSize: 52, fontWeight: 700, letterSpacing: '-0.04em',
            color: '#fff', lineHeight: 1,
          }}>
            <AnimatedNumber value={stats.pending} />
          </span>
        </div>

        {/* Bottom metric row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* Collected card */}
          <div style={{
            background: 'rgba(120,120,128,0.1)',
            borderRadius: 'var(--app-radius-sm, 14px)', padding: '12px 14px',
            border: '0.5px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(235,235,245,0.4)', marginBottom: 4 }}>
              Collected
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#30D158' }}>
              {settings.currency}<AnimatedNumber value={stats.received} />
            </p>
          </div>

          {/* Active / Overdue card */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={onShowActiveDeals}
            style={{
              background: stats.overdueCount > 0
                ? 'rgba(255,59,48,0.1)'
                : 'rgba(120,120,128,0.1)',
              borderRadius: 'var(--app-radius-sm, 14px)', padding: '12px 14px',
              border: `0.5px solid ${stats.overdueCount > 0 ? 'rgba(255,59,48,0.2)' : 'rgba(255,255,255,0.05)'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{
                fontSize: 11, fontWeight: 500,
                color: stats.overdueCount > 0 ? 'rgba(255,99,88,0.9)' : 'rgba(235,235,245,0.4)',
                marginBottom: 4,
              }}>
                {stats.overdueCount > 0 ? 'Overdue' : 'Active'}
              </p>
              {stats.overdueCount > 0 && (
                <AlertCircle size={12} style={{ color: '#FF453A' }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{
                fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em',
                color: stats.overdueCount > 0 ? '#FF453A' : 'rgba(235,235,245,0.85)',
              }}>
                {stats.overdueCount > 0 ? `${stats.overdueCount} alerts` : `${stats.activeCount}`}
              </p>
              <ChevronRight size={14} style={{ color: 'rgba(235,235,245,0.25)' }} />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardStats;
