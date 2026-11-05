import React from 'react';

interface LogoProps {
  className?: string;
  activeTheme?: any;
  size?: number | string;
}

/**
 * Modern minimal ledger mark — a clean geometric "L" formed by
 * two overlapping rectangles inside a rounded square, iOS-style.
 */
export const LogoIcon: React.FC<LogoProps> = ({ className = 'w-12 h-12', activeTheme, size = '100%' }) => {
  const hexColor = activeTheme?.hex || '#10b981';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
    >
      <defs>
        <linearGradient id="lgAccent" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={hexColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={hexColor} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="lgBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C1C1E" />
          <stop offset="100%" stopColor="#141416" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect width="100" height="100" rx="24" fill="url(#lgBg)" />

      {/* Subtle inner border */}
      <rect width="100" height="100" rx="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Bold "L" mark — vertical bar */}
      <rect x="27" y="24" width="14" height="52" rx="5" fill="url(#lgAccent)" />

      {/* Horizontal bar of L */}
      <rect x="27" y="62" width="46" height="14" rx="5" fill="url(#lgAccent)" />

      {/* Accent dot — top right */}
      <circle cx="73" cy="27" r="5" fill={hexColor} opacity="0.5" />
    </svg>
  );
};

export const Logo: React.FC<LogoProps & { showText?: boolean }> = ({ activeTheme, className, showText = true }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <LogoIcon activeTheme={activeTheme} className={className} />
      {showText && (
        <span
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#fff',
            fontSize: '1.1rem',
          }}
        >
          Ledger
        </span>
      )}
    </div>
  );
};
