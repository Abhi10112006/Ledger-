import React from 'react';
import { ArrowLeft, Trash2, MessageSquare, Loader2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onBack: () => void;
  onDelete: () => void;
  onShareSMS: () => void;
  onShareWA: () => void;
  onGeneratePDF: () => void;
  isSharing: boolean;
  activeTheme: any;
}

const ProfileHeader: React.FC<Props> = ({
  onBack, onDelete, onShareSMS, onShareWA, onGeneratePDF, isSharing, activeTheme
}) => {

  const actionButtons = [
    {
      icon: isSharing ? Loader2 : MessageSquare,
      label: 'SMS',
      color: '#0A84FF',
      onClick: onShareSMS,
      spinning: isSharing,
    },
    {
      icon: isSharing ? Loader2 : null,
      isWA: true,
      label: 'WhatsApp',
      color: '#30D158',
      onClick: onShareWA,
      spinning: isSharing,
    },
    {
      icon: FileText,
      label: 'Report',
      color: 'rgba(235,235,245,0.55)',
      onClick: onGeneratePDF,
    },
    {
      icon: Trash2,
      label: 'Delete',
      color: '#FF453A',
      onClick: onDelete,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 12,
        paddingRight: 16,
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: 12,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Back button */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px 8px 8px 4px',
        }}
      >
        <ArrowLeft size={22} style={{ color: activeTheme.hex }} />
        <span style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
          fontSize: 17, fontWeight: 400,
          color: activeTheme.hex, letterSpacing: '-0.02em',
        }}>
          Back
        </span>
      </motion.button>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {actionButtons.map((btn) => (
          <motion.button
            key={btn.label}
            whileTap={{ scale: 0.88 }}
            onClick={btn.onClick}
            disabled={btn.spinning}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(120,120,128,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {btn.isWA ? (
                btn.spinning ? (
                  <Loader2 size={18} style={{ color: btn.color, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill={btn.color} width={18} height={18}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                )
              ) : btn.spinning && btn.icon === Loader2 ? (
                <Loader2 size={18} style={{ color: btn.color, animation: 'spin 1s linear infinite' }} />
              ) : (
                <btn.icon size={18} style={{ color: btn.color }} />
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: 'rgba(235,235,245,0.4)', letterSpacing: '-0.01em',
            }}>
              {btn.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ProfileHeader;
